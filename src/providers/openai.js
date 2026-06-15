// Any OpenAI-compatible chat endpoint. Set OPENAI_BASE_URL to point it at:
//   - OpenAI         https://api.openai.com/v1
//   - Groq           https://api.groq.com/openai/v1   (has a free tier)
//   - OpenRouter     https://openrouter.ai/api/v1     (some free models)
//   - LM Studio      http://localhost:1234/v1         (local, free)
//   - llama.cpp      http://localhost:8080/v1         (local, free)
// The API key is optional — local servers usually don't need one.
export function openaiProvider(config) {
  const base = config.openaiBaseUrl;
  return {
    name: `openai:${config.model}`,
    async complete({ system, prompt, maxTokens }) {
      const headers = { 'Content-Type': 'application/json' };
      if (config.openaiApiKey) headers.Authorization = `Bearer ${config.openaiApiKey}`;

      let res;
      try {
        res = await fetch(`${base}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: config.model,
            max_tokens: maxTokens,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: prompt },
            ],
          }),
        });
      } catch (e) {
        throw new Error(`Can't reach the API at ${base}. — ${e.message}`);
      }
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`API error ${res.status}: ${body.slice(0, 200)}`);
      }
      const data = await res.json();
      return (data.choices?.[0]?.message?.content || '').trim();
    },
  };
}
