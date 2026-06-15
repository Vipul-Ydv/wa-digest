import 'dotenv/config';

function bool(v, fallback) {
  if (v === undefined) return fallback;
  return String(v).toLowerCase() === 'true';
}
function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// Default model per provider, used when MODEL is not set.
const DEFAULT_MODELS = {
  anthropic: 'claude-haiku-4-5-20251001',
  ollama: 'llama3.2',
  openai: 'gpt-4o-mini',
};

const provider = (process.env.PROVIDER || 'anthropic').toLowerCase();

export const config = {
  provider,
  model: process.env.MODEL || DEFAULT_MODELS[provider] || '',
  maxTokens: num(process.env.MAX_TOKENS, 1024),

  // anthropic (paid)
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,

  // openai-compatible: OpenAI, Groq, OpenRouter, LM Studio, llama.cpp server, ...
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiBaseUrl: (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),

  // ollama (free, local)
  ollamaBaseUrl: (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/+$/, ''),

  // whatsapp + buffering
  summaryCommand: (process.env.SUMMARY_COMMAND || '/summary').toLowerCase(),
  defaultHours: num(process.env.DEFAULT_HOURS, 12),
  bufferHours: num(process.env.BUFFER_HOURS, 24),
  maxPerChat: num(process.env.MAX_PER_CHAT, 300),
  clearAfterSummary: bool(process.env.CLEAR_AFTER_SUMMARY, true),
  authDir: process.env.AUTH_DIR || 'auth_info',
};

export function assertConfig() {
  const valid = ['anthropic', 'ollama', 'openai'];
  if (!valid.includes(config.provider)) {
    console.error(`\nUnknown PROVIDER "${config.provider}". Set PROVIDER to one of: ${valid.join(', ')}.\n`);
    process.exit(1);
  }
  if (config.provider === 'anthropic' && !config.anthropicApiKey) {
    console.error('\nPROVIDER=anthropic needs ANTHROPIC_API_KEY in .env.');
    console.error('No paid key? Set PROVIDER=ollama to run a free local model instead (see README).\n');
    process.exit(1);
  }
  if (config.provider === 'openai' && !config.openaiApiKey && config.openaiBaseUrl.includes('api.openai.com')) {
    console.error('\nPROVIDER=openai with the official OpenAI endpoint needs OPENAI_API_KEY in .env.\n');
    process.exit(1);
  }
}
