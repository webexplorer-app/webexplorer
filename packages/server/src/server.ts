/**
 * Document Generation Server using Express + Socket.io.
 */

import express, { Express, Request, Response } from 'express';
import { createServer as createHttpServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from 'cors';
import { randomUUID } from 'crypto';
import type {
  DocumentRequest,
  ServerMessage,
  ConnectionState,
  ErrorMessage,
} from './types';
import { handleGenerateRequest } from './handlers';

/**
 * Server configuration options.
 */
export interface ServerOptions {
  /** Port to listen on */
  port?: number;

  /** Host to bind to */
  host?: string;

  /** Maximum concurrent requests per connection */
  maxConcurrentRequests?: number;

  /** CORS origins (default: all) */
  corsOrigins?: string | string[];

  /** Enable REST API endpoints */
  enableRestApi?: boolean;
}

/**
 * Document Generation Server.
 */
export class DocumentServer {
  private app: Express;
  private httpServer: HttpServer;
  private io: SocketIOServer;
  private connections = new Map<string, ConnectionState>();
  private options: Required<ServerOptions>;

  constructor(options: ServerOptions = {}) {
    this.options = {
      port: options.port ?? 8080,
      host: options.host ?? '0.0.0.0',
      maxConcurrentRequests: options.maxConcurrentRequests ?? 5,
      corsOrigins: options.corsOrigins ?? '*',
      enableRestApi: options.enableRestApi ?? true,
    };

    // Initialize Express
    this.app = express();
    this.app.use(cors({ origin: this.options.corsOrigins }));
    this.app.use(express.json());

    // Create HTTP server
    this.httpServer = createHttpServer(this.app);

    // Initialize Socket.io
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: this.options.corsOrigins,
        methods: ['GET', 'POST'],
      },
    });

    // Setup routes and socket handlers
    this.setupRoutes();
    this.setupSocketHandlers();
  }

  /**
   * Get the Express app instance.
   */
  getApp(): Express {
    return this.app;
  }

  /**
   * Get the Socket.io server instance.
   */
  getIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Setup REST API routes.
   */
  private setupRoutes(): void {
    if (!this.options.enableRestApi) return;

    // Health check
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    // Server stats
    this.app.get('/stats', (_req: Request, res: Response) => {
      res.json(this.getStats());
    });

    // List available AI providers
    this.app.get('/providers', (_req: Request, res: Response) => {
      res.json({
        providers: ['openai', 'anthropic', 'azure', 'ollama', 'custom'],
      });
    });
  }

  /**
   * Setup Socket.io event handlers.
   */
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const connectionId = randomUUID();
      const state: ConnectionState = {
        id: connectionId,
        connectedAt: Date.now(),
        activeRequests: new Map(),
      };

      this.connections.set(socket.id, state);
      console.log(`Client connected: ${connectionId} (socket: ${socket.id})`);

      // Handle generate request
      socket.on('generate', async (request: DocumentRequest) => {
        await this.handleGenerate(socket, state, request);
      });

      // Handle cancel request
      socket.on('cancel', (requestId: string) => {
        this.handleCancel(state, requestId);
      });

      // Handle ping
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        // Cancel all active requests for this connection
        for (const [, controller] of state.activeRequests) {
          controller.abort();
        }
        this.connections.delete(socket.id);
        console.log(`Client disconnected: ${connectionId}`);
      });

      // Handle errors
      socket.on('error', (error: Error) => {
        console.error(`Socket error for ${connectionId}:`, error);
      });
    });
  }

  /**
   * Handle a generate request.
   */
  private async handleGenerate(
    socket: Socket,
    state: ConnectionState,
    request: DocumentRequest
  ): Promise<void> {
    // Check concurrent request limit
    if (state.activeRequests.size >= this.options.maxConcurrentRequests) {
      this.sendError(
        socket,
        request.requestId,
        'TOO_MANY_REQUESTS',
        `Maximum concurrent requests (${this.options.maxConcurrentRequests}) exceeded`
      );
      return;
    }

    // Create send function for this request
    const sendMessage = (msg: ServerMessage): void => {
      if (socket.connected) {
        socket.emit(msg.type, msg);
      }
    };

    try {
      const session = await handleGenerateRequest(request, sendMessage);
      state.activeRequests.set(request.requestId, session.getAbortController());

      // Clean up when done
      session
        .getAbortController()
        .signal.addEventListener('abort', () => {
          state.activeRequests.delete(request.requestId);
        });
    } catch (error) {
      this.sendError(
        socket,
        request.requestId,
        'GENERATION_START_ERROR',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Handle a cancel request.
   */
  private handleCancel(state: ConnectionState, requestId: string): void {
    const controller = state.activeRequests.get(requestId);

    if (controller) {
      controller.abort();
      state.activeRequests.delete(requestId);
    }
  }

  /**
   * Send an error message.
   */
  private sendError(
    socket: Socket,
    requestId: string,
    code: string,
    message: string
  ): void {
    const errorMsg: ErrorMessage = {
      type: 'error',
      requestId,
      timestamp: Date.now(),
      code,
      message,
      recoverable: false,
    };

    if (socket.connected) {
      socket.emit('error', errorMsg);
    }
  }

  /**
   * Start the server.
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.httpServer.listen(this.options.port, this.options.host, () => {
          console.log(
            `Document generation server listening on http://${this.options.host}:${this.options.port}`
          );
          resolve();
        });

        this.httpServer.on('error', (error) => {
          console.error('Server error:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the server.
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      // Cancel all active requests
      for (const [, state] of this.connections) {
        for (const [, controller] of state.activeRequests) {
          controller.abort();
        }
      }

      // Close Socket.io
      this.io.close(() => {
        // Close HTTP server
        this.httpServer.close(() => {
          this.connections.clear();
          resolve();
        });
      });
    });
  }

  /**
   * Get server statistics.
   */
  getStats(): {
    connections: number;
    activeRequests: number;
    uptime: number;
  } {
    let activeRequests = 0;
    for (const [, state] of this.connections) {
      activeRequests += state.activeRequests.size;
    }

    return {
      connections: this.connections.size,
      activeRequests,
      uptime: process.uptime(),
    };
  }
}

/**
 * Create and start a document server.
 */
export async function createDocumentServer(
  options?: ServerOptions
): Promise<DocumentServer> {
  const server = new DocumentServer(options);
  await server.start();
  return server;
}

/** @deprecated Use createDocumentServer instead */
export const createServer = createDocumentServer;
