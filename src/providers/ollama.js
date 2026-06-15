// Free, local models via Ollama (https://ollama.com).
// No API key, no cost, and nothing leaves your machine.
// Requires Ollama running locally and the model pulled, e.g.:
//   ollama pull llama3.2
export function ollamaProvider(config) {
  const base = config.ollamaBaseUrl;
  return {
    name: `ollama:${config.model}`,
    async complete({ system, prompt, maxTokens }) {
      let res;
      try {
        res = await fetch(`${base}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.model,
            stream: false,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: prompt },
            ],
            options: { num_predict: maxTokens },
          }),
        });
      } catch (e) {
        throw new Error(`Can't reach Ollama at ${base}. Is it running? (try: ollama serve) — ${e.message}`);
      }
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Ollama error ${res.status}: ${body.slice(0, 200)}`);
      }
      const data = await res.json();
      return (data.message?.content || '').trim();
    },
  };
}
