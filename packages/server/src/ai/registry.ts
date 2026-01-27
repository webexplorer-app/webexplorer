/**
 * AI Provider Registry - Factory for creating AI providers.
 */

import type { AIProvider } from './index';
import type { AIModelConfig, AIProvider as AIProviderType } from '../types';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { OllamaProvider } from './ollama';

/**
 * Registry for AI providers.
 */
export class AIProviderRegistry {
  private providers = new Map<AIProviderType, AIProvider>();

  constructor() {
    // Register default providers
    this.register('openai', new OpenAIProvider());
    this.register('anthropic', new AnthropicProvider());
    this.register('ollama', new OllamaProvider());
  }

  /**
   * Register a custom AI provider.
   */
  register(type: AIProviderType, provider: AIProvider): void {
    this.providers.set(type, provider);
  }

  /**
   * Get a provider by type.
   */
  get(type: AIProviderType): AIProvider | undefined {
    return this.providers.get(type);
  }

  /**
   * Get provider for a given configuration.
   */
  getForConfig(config: AIModelConfig): AIProvider {
    const provider = this.providers.get(config.provider);

    if (!provider) {
      throw new Error(`Unknown AI provider: ${config.provider}`);
    }

    if (!provider.validateConfig(config)) {
      throw new Error(`Invalid configuration for provider: ${config.provider}`);
    }

    return provider;
  }

  /**
   * List all registered provider types.
   */
  listProviders(): AIProviderType[] {
    return Array.from(this.providers.keys());
  }
}

// Default registry instance
const defaultRegistry = new AIProviderRegistry();

/**
 * Create an AI provider for the given configuration.
 */
export function createAIProvider(config: AIModelConfig): AIProvider {
  return defaultRegistry.getForConfig(config);
}

export { defaultRegistry };
