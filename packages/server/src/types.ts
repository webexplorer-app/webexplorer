/**
 * Type definitions for the document generation server.
 */

/**
 * Supported AI providers.
 */
export type AIProvider = 'openai' | 'anthropic' | 'azure' | 'ollama' | 'custom';

/**
 * AI model configuration from the client.
 */
export interface AIModelConfig {
  /** AI provider to use */
  provider: AIProvider;

  /** Model identifier (e.g., 'gpt-4', 'claude-3-opus', 'llama2') */
  model: string;

  /** API key (if not using server-side configuration) */
  apiKey?: string;

  /** Base URL for the AI service (for custom/self-hosted) */
  baseUrl?: string;

  /** Additional provider-specific options */
  options?: Record<string, unknown>;
}

/**
 * Document generation request from client.
 */
export interface DocumentRequest {
  /** Unique request identifier */
  requestId: string;

  /** The prompt/instruction for document generation */
  prompt: string;

  /** AI model configuration */
  aiConfig: AIModelConfig;

  /** Document mode: 'structure' for preview, 'content' for full content */
  mode: 'structure' | 'content';

  /** Optional template or schema to follow */
  template?: string;

  /** Additional context or reference documents */
  context?: string[];

  /** Maximum tokens/length for the response */
  maxTokens?: number;
}

/**
 * Server response types.
 */
export type ServerMessageType =
  | 'ack'           // Request acknowledged
  | 'part'          // Document part
  | 'progress'      // Progress update
  | 'error'         // Error occurred
  | 'complete';     // Generation complete

/**
 * Base server message.
 */
export interface ServerMessage {
  type: ServerMessageType;
  requestId: string;
  timestamp: number;
}

/**
 * Acknowledgment message.
 */
export interface AckMessage extends ServerMessage {
  type: 'ack';
  boundary: string;
}

/**
 * Document part message - contains a single multipart part.
 */
export interface PartMessage extends ServerMessage {
  type: 'part';
  /** The raw part content (headers + body) */
  part: string;
  /** Part index in the sequence */
  index: number;
}

/**
 * Progress update message.
 */
export interface ProgressMessage extends ServerMessage {
  type: 'progress';
  /** Number of parts generated so far */
  partsGenerated: number;
  /** Estimated total parts (if known) */
  estimatedTotal?: number;
  /** Current operation description */
  status: string;
}

/**
 * Error message.
 */
export interface ErrorMessage extends ServerMessage {
  type: 'error';
  code: string;
  message: string;
  recoverable: boolean;
}

/**
 * Completion message.
 */
export interface CompleteMessage extends ServerMessage {
  type: 'complete';
  totalParts: number;
  /** Final multipart terminator */
  terminator: string;
}

/**
 * Client message types.
 */
export type ClientMessageType =
  | 'generate'      // Start document generation
  | 'cancel'        // Cancel ongoing generation
  | 'ping';         // Keep-alive ping

/**
 * Base client message.
 */
export interface ClientMessage {
  type: ClientMessageType;
}

/**
 * Generate document request.
 */
export interface GenerateMessage extends ClientMessage {
  type: 'generate';
  request: DocumentRequest;
}

/**
 * Cancel request.
 */
export interface CancelMessage extends ClientMessage {
  type: 'cancel';
  requestId: string;
}

/**
 * Ping message.
 */
export interface PingMessage extends ClientMessage {
  type: 'ping';
}

/**
 * Connection state.
 */
export interface ConnectionState {
  id: string;
  connectedAt: number;
  activeRequests: Map<string, AbortController>;
}
