import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io, Socket } from 'socket.io-client';
import {
  DocumentServer,
  type DocumentRequest,
  type ServerMessage,
} from '../src/index';

describe('DocumentServer', () => {
  let server: DocumentServer;
  const port = 9999;
  const baseUrl = `http://localhost:${port}`;

  beforeAll(async () => {
    server = new DocumentServer({ port });
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('REST API', () => {
    it('should respond to health check', async () => {
      const response = await fetch(`${baseUrl}/health`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.status).toBe('ok');
      expect(data.timestamp).toBeDefined();
    });

    it('should return server stats', async () => {
      const response = await fetch(`${baseUrl}/stats`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.connections).toBeDefined();
      expect(data.activeRequests).toBeDefined();
      expect(data.uptime).toBeDefined();
    });

    it('should list available providers', async () => {
      const response = await fetch(`${baseUrl}/providers`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.providers).toContain('openai');
      expect(data.providers).toContain('anthropic');
      expect(data.providers).toContain('ollama');
    });
  });

  describe('Socket.io Connection', () => {
    it('should accept socket connections', async () => {
      const socket = io(baseUrl);

      await new Promise<void>((resolve, reject) => {
        socket.on('connect', () => {
          expect(socket.connected).toBe(true);
          socket.disconnect();
          resolve();
        });
        socket.on('connect_error', reject);
      });
    });

    it('should respond to ping events', async () => {
      const socket = io(baseUrl);

      await new Promise<void>((resolve) => {
        socket.on('connect', () => {
          socket.emit('ping');
        });

        socket.on('pong', (data: { timestamp: number }) => {
          expect(data.timestamp).toBeDefined();
          socket.disconnect();
          resolve();
        });
      });
    });
  });

  describe('Server Stats', () => {
    it('should track connection count', async () => {
      const socket1 = io(baseUrl);
      const socket2 = io(baseUrl);

      await Promise.all([
        new Promise<void>((resolve) => socket1.on('connect', resolve)),
        new Promise<void>((resolve) => socket2.on('connect', resolve)),
      ]);

      // Give server time to register connections
      await new Promise((r) => setTimeout(r, 50));

      const stats = server.getStats();
      expect(stats.connections).toBe(2);

      socket1.disconnect();
      socket2.disconnect();
    });
  });
});

describe('DocumentRequest Types', () => {
  it('should have correct structure', () => {
    const request: DocumentRequest = {
      requestId: 'test-1',
      prompt: 'Generate a document',
      aiConfig: {
        provider: 'openai',
        model: 'gpt-4',
      },
      mode: 'content',
    };

    expect(request.requestId).toBe('test-1');
    expect(request.aiConfig.provider).toBe('openai');
    expect(request.mode).toBe('content');
  });

  it('should support structure mode', () => {
    const request: DocumentRequest = {
      requestId: 'test-2',
      prompt: 'Generate document structure',
      aiConfig: {
        provider: 'anthropic',
        model: 'claude-3-opus-20240229',
      },
      mode: 'structure',
    };

    expect(request.mode).toBe('structure');
  });
});
