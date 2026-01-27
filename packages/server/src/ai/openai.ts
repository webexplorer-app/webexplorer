/**
 * OpenAI Provider implementation.
 */

import { BaseAIProvider, type AIStreamChunk } from './base';
import type { AIModelConfig } from '../types';

export class OpenAIProvider extends BaseAIProvider {
  readonly name = 'openai';

  private getBaseUrl(config: AIModelConfig): string {
    return config.baseUrl || 'https://api.openai.com/v1';
  }

  async *streamGenerate(
    prompt: string,
    config: AIModelConfig,
    signal?: AbortSignal
  ): AsyncGenerator<AIStreamChunk> {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not provided');
    }

    const baseUrl = this.getBaseUrl(config);
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        ...config.options,
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
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
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));
            const content = data.choices?.[0]?.delta?.content || '';

            if (content) {
              yield { content, done: false };
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
    return super.validateConfig(config) && config.provider === 'openai';
  }
}
