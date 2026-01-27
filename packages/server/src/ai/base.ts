/**
 * Base AI Provider implementation.
 */

import type { AIModelConfig, DocumentRequest } from '../types';

/**
 * Streaming chunk from AI provider.
 */
export interface AIStreamChunk {
  /** The text content of this chunk */
  content: string;

  /** Whether this is the final chunk */
  done: boolean;

  /** Token usage (if available) */
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
  };
}

/**
 * Abstract AI provider interface.
 */
export interface AIProvider {
  /** Provider name */
  readonly name: string;

  /**
   * Generate a streaming response.
   * @param prompt - The prompt to send
   * @param config - Model configuration
   * @param signal - Abort signal for cancellation
   * @returns Async generator of chunks
   */
  streamGenerate(
    prompt: string,
    config: AIModelConfig,
    signal?: AbortSignal
  ): AsyncGenerator<AIStreamChunk>;

  /**
   * Validate the configuration for this provider.
   */
  validateConfig(config: AIModelConfig): boolean;
}

/**
 * Base class for AI providers with common functionality.
 */
export abstract class BaseAIProvider implements AIProvider {
  abstract readonly name: string;

  abstract streamGenerate(
    prompt: string,
    config: AIModelConfig,
    signal?: AbortSignal
  ): AsyncGenerator<AIStreamChunk>;

  validateConfig(config: AIModelConfig): boolean {
    return !!config.model;
  }

  /**
   * Build the system prompt for document generation.
   */
  protected buildSystemPrompt(request: DocumentRequest): string {
    const mode = request.mode === 'structure'
      ? 'Generate a document structure with preview metadata only (no actual content).'
      : 'Generate a complete document with full content.';

    return `You are a document generation assistant. ${mode}

Output the document as a series of JSON parts following this hierarchy:
- Document (root)
- Pages (within document)
- Sections (within pages)
- Rows (within sections)
- Columns (within rows)
- Cells (within columns, contain actual content)

Each part should be valid JSON matching the document schema.
${request.template ? `\nFollow this template: ${request.template}` : ''}
${request.context?.length ? `\nContext:\n${request.context.join('\n')}` : ''}`;
  }
}
