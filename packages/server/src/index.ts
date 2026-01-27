/**
 * @webexplorer/server
 *
 * WebSocket server for AI-powered document generation.
 *
 * Architecture:
 * - Client connects via WebSocket
 * - Client sends a DocumentRequest with prompt and AI model configuration
 * - Server streams document parts back using multipart protocol
 * - Supports multiple AI providers (OpenAI, Anthropic, Azure, etc.)
 */

export * from './types';
export { OpenAIProvider, AnthropicProvider, OllamaProvider, createAIProvider, AIProviderRegistry, BaseAIProvider } from './ai/index';
export type { AIProvider as AIProviderInterface, AIStreamChunk } from './ai/index';
export * from './server';
export * from './handlers';

// Start server when run directly
import { createServer } from './server';

const port = parseInt(process.env.PORT ?? '8080', 10);

createServer({ port }).then(() => {
  console.log(`🚀 Document generation server running on http://localhost:${port}`);
}).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
