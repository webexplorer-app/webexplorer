/**
 * Anthropic Provider implementation.
 */

import { BaseAIProvider, type AIStreamChunk } from './base';
import type { AIModelConfig } from '../types';

export class AnthropicProvider extends BaseAIProvider {
  readonly name = 'anthropic';

  private getBaseUrl(config: AIModelConfig): string {
    return config.baseUrl || 'https://api.anthropic.com';
  }

  async *streamGenerate(
    prompt: string,
    config: AIModelConfig,
    signal?: AbortSignal
  ): AsyncGenerator<AIStreamChunk> {
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('Anthropic API key not provided');
    }

    const baseUrl = this.getBaseUrl(config);
    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.options?.maxTokens || 4096,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        ...config.options,
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
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
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));

            if (data.type === 'content_block_delta') {
              const content = data.delta?.text || '';
              if (content) {
                yield { content, done: false };
              }
            } else if (data.type === 'message_stop') {
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
    return super.validateConfig(config) && config.provider === 'anthropic';
  }
}
