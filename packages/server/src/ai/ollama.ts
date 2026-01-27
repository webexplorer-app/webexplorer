/**
 * Ollama Provider implementation (for local models).
 */

import { BaseAIProvider, type AIStreamChunk } from './base';
import type { AIModelConfig } from '../types';

export class OllamaProvider extends BaseAIProvider {
  readonly name = 'ollama';

  private getBaseUrl(config: AIModelConfig): string {
    return config.baseUrl || 'http://localhost:11434';
  }

  async *streamGenerate(
    prompt: string,
    config: AIModelConfig,
    signal?: AbortSignal
  ): AsyncGenerator<AIStreamChunk> {
    const baseUrl = this.getBaseUrl(config);

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        prompt,
        stream: true,
        ...config.options,
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          yield { content: '', done: true };
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const data = JSON.parse(trimmed);

            if (data.response) {
              yield { content: data.response, done: false };
            }

            if (data.done) {
              yield { content: '', done: true };
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  validateConfig(config: AIModelConfig): boolean {
    return super.validateConfig(config) && config.provider === 'ollama';
  }
}
