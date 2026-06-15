// Picks the LLM backend based on config.provider.
// Every provider exposes the same interface:
//   { name, async complete({ system, prompt, maxTokens }) => string }

import { anthropicProvider } from './anthropic.js';
import { ollamaProvider } from './ollama.js';
import { openaiProvider } from './openai.js';

export function getProvider(config) {
  switch (config.provider) {
    case 'anthropic':
      return anthropicProvider(config);
    case 'ollama':
      return ollamaProvider(config);
    case 'openai':
      return openaiProvider(config);
    default:
      throw new Error(`Unknown provider "${config.provider}". Use: anthropic, ollama, or openai.`);
  }
}
