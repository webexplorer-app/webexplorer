/**
 * Document Service - Client-side service for document generation.
 * 
 * Uses Socket.io to communicate with the server and follows the
 * @webexplorer/document streaming protocol.
 */

import { io, Socket } from 'socket.io-client';
import {
  DocumentAssembler,
  parsePart,
  type Document,
  type DocumentMode,
} from '@webexplorer/document';

/**
 * AI Provider options.
 */
export type AIProvider = 'openai' | 'anthropic' | 'azure' | 'ollama' | 'custom';

/**
 * AI Model configuration.
 */
export interface AIModelConfig {
  provider: AIProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  options?: Record<string, unknown>;
}

/**
 * Document generation request.
 */
export interface DocumentRequest {
  requestId: string;
  prompt: string;
  aiConfig: AIModelConfig;
  mode: 'structure' | 'content';
  template?: string;
  context?: string[];
  maxTokens?: number;
}

/**
 * Server message types.
 */
export interface AckMessage {
  type: 'ack';
  requestId: string;
  timestamp: number;
  boundary: string;
}

export interface PartMessage {
  type: 'part';
  requestId: string;
  timestamp: number;
  part: string;
  index: number;
}

export interface ProgressMessage {
  type: 'progress';
  requestId: string;
  timestamp: number;
  partsGenerated: number;
  estimatedTotal?: number;
  status: string;
}

export interface ErrorMessage {
  type: 'error';
  requestId: string;
  timestamp: number;
  code: string;
  message: string;
  recoverable: boolean;
}

export interface CompleteMessage {
  type: 'complete';
  requestId: string;
  timestamp: number;
  totalParts: number;
  terminator: string;
}

export type ServerMessage = AckMessage | PartMessage | ProgressMessage | ErrorMessage | CompleteMessage;

/**
 * Document generation event handlers.
 */
export interface DocumentGenerationHandlers {
  onAck?: (msg: AckMessage) => void;
  onPart?: (msg: PartMessage, partIndex: number) => void;
  onProgress?: (msg: ProgressMessage) => void;
  onError?: (msg: ErrorMessage) => void;
  onComplete?: (msg: CompleteMessage, document: Document<DocumentMode> | null) => void;
  onConnectionChange?: (connected: boolean) => void;
}

/**
 * Document generation session.
 */
export class DocumentGenerationSession<M extends DocumentMode = 'content'> {
  private assembler: DocumentAssembler<M>;
  private handlers: DocumentGenerationHandlers;
  private cancelled = false;

  constructor(
    public readonly requestId: string,
    handlers: DocumentGenerationHandlers = {}
  ) {
    this.assembler = new DocumentAssembler<M>();
    this.handlers = handlers;
  }

  /**
   * Handle incoming part message.
   */
  handlePart(msg: PartMessage): void {
    if (this.cancelled) return;

    // Parse the raw part string
    const part = parsePart(msg.part);
    if (part) {
      this.assembler.addPart(part);
    }

    this.handlers.onPart?.(msg, msg.index);
  }

  /**
   * Handle progress message.
   */
  handleProgress(msg: ProgressMessage): void {
    if (this.cancelled) return;
    this.handlers.onProgress?.(msg);
  }

  /**
   * Handle error message.
   */
  handleError(msg: ErrorMessage): void {
    this.handlers.onError?.(msg);
  }

  /**
   * Handle acknowledgment message.
   */
  handleAck(msg: AckMessage): void {
    this.handlers.onAck?.(msg);
  }

  /**
   * Handle completion.
   */
  handleComplete(msg: CompleteMessage): void {
    if (this.cancelled) return;
    const document = this.assembler.getDocument();
    this.handlers.onComplete?.(msg, document);
  }

  /**
   * Get the current document state.
   */
  getDocument(): Document<M> | null {
    return this.assembler.getDocument();
  }

  /**
   * Get number of parts received.
   */
  getPartsCount(): number {
    return this.assembler.getPartsCount();
  }

  /**
   * Cancel this session.
   */
  cancel(): void {
    this.cancelled = true;
  }

  /**
   * Check if cancelled.
   */
  isCancelled(): boolean {
    return this.cancelled;
  }
}

/**
 * Document Service - manages connection and document generation.
 */
export class DocumentService {
  private socket: Socket | null = null;
  private serverUrl: string;
  private connected = false;
  private connectionHandlers: ((connected: boolean) => void)[] = [];
  private activeSessions = new Map<string, DocumentGenerationSession<DocumentMode>>();

  constructor(serverUrl?: string) {
    // Default to same origin (use Vite proxy in development)
    this.serverUrl = serverUrl ?? window.location.origin;
  }

  /**
   * Connect to the document server.
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.serverUrl);

      this.socket.on('connect', () => {
        this.connected = true;
        this.notifyConnectionChange(true);
        resolve();
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
        this.notifyConnectionChange(false);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });

      // Handle server messages
      this.socket.on('ack', (msg: AckMessage) => {
        const session = this.activeSessions.get(msg.requestId);
        session?.handleAck(msg);
      });

      this.socket.on('part', (msg: PartMessage) => {
        const session = this.activeSessions.get(msg.requestId);
        session?.handlePart(msg);
      });

      this.socket.on('progress', (msg: ProgressMessage) => {
        const session = this.activeSessions.get(msg.requestId);
        session?.handleProgress(msg);
      });

      this.socket.on('error', (msg: ErrorMessage) => {
        const session = this.activeSessions.get(msg.requestId);
        session?.handleError(msg);
      });

      this.socket.on('complete', (msg: CompleteMessage) => {
        const session = this.activeSessions.get(msg.requestId);
        if (session) {
          session.handleComplete(msg);
          this.activeSessions.delete(msg.requestId);
        }
      });
    });
  }

  /**
   * Disconnect from the server.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
    this.activeSessions.clear();
  }

  /**
   * Check if connected.
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Subscribe to connection changes.
   */
  onConnectionChange(handler: (connected: boolean) => void): () => void {
    this.connectionHandlers.push(handler);
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index >= 0) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }

  private notifyConnectionChange(connected: boolean): void {
    for (const handler of this.connectionHandlers) {
      handler(connected);
    }
  }

  /**
   * Generate a document.
   */
  generateDocument<M extends DocumentMode = 'content'>(
    request: DocumentRequest,
    handlers: DocumentGenerationHandlers = {}
  ): DocumentGenerationSession<M> {
    if (!this.socket || !this.connected) {
      throw new Error('Not connected to server');
    }

    const session = new DocumentGenerationSession<M>(request.requestId, handlers);
    this.activeSessions.set(request.requestId, session);

    // Send generate request
    this.socket.emit('generate', request);

    return session;
  }

  /**
   * Cancel a document generation.
   */
  cancelGeneration(requestId: string): void {
    const session = this.activeSessions.get(requestId);
    if (session) {
      session.cancel();
      this.socket?.emit('cancel', requestId);
      this.activeSessions.delete(requestId);
    }
  }

  /**
   * Send a ping to keep connection alive.
   */
  ping(): Promise<{ timestamp: number }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ timestamp: 0 });
        return;
      }

      this.socket.once('pong', (data: { timestamp: number }) => {
        resolve(data);
      });

      this.socket.emit('ping');
    });
  }

  /**
   * Get server health status.
   */
  async getHealth(): Promise<{ status: string; timestamp: number }> {
    const response = await fetch(`${this.serverUrl}/health`);
    return response.json();
  }

  /**
   * Get available AI providers.
   */
  async getProviders(): Promise<{ providers: AIProvider[] }> {
    const response = await fetch(`${this.serverUrl}/providers`);
    return response.json();
  }
}

// Singleton instance
let documentServiceInstance: DocumentService | null = null;

/**
 * Get the document service singleton.
 */
export function getDocumentService(serverUrl?: string): DocumentService {
  if (!documentServiceInstance) {
    documentServiceInstance = new DocumentService(serverUrl);
  }
  return documentServiceInstance;
}

/**
 * Generate a unique request ID.
 */
export function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
