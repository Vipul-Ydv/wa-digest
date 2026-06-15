import Anthropic from '@anthropic-ai/sdk';

// Claude via the official Anthropic API (paid).
export function anthropicProvider(config) {
  const client = new Anthropic({ apiKey: config.anthropicApiKey });
  return {
    name: `anthropic:${config.model}`,
    async complete({ system, prompt, maxTokens }) {
      const res = await client.messages.create({
        model: config.model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: prompt }],
      });
      return res.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();
    },
  };
}
