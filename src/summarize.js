// Builds the digest prompt and delegates the actual LLM call to whichever
// provider was selected (see src/providers/). Provider-agnostic.

const SYSTEM = `You summarize WhatsApp chats for someone who stepped away from their phone.
You are given the messages they missed, grouped by chat. Produce a short catch-up digest.

Rules:
- One short section per chat. Lead with the chat name.
- 1-3 lines per chat. Be tight. Group chats are casual — don't over-explain banter.
- Surface anything that needs a reply, a decision, or is time-sensitive, and mark it clearly.
- Skip chats that are pure noise (stickers, "ok", forwards) with a one-liner or omit them.
- Never invent details. Only use what's in the messages.
- Plain text only (this is sent back over WhatsApp). No markdown headers or tables.`;

function buildPrompt(chats, { hours }) {
  const blocks = chats.map((c) => {
    const lines = c.messages.map((m) => `${m.sender}: ${m.text}`).join('\n');
    const kind = c.isGroup ? 'group' : 'chat';
    return `=== ${c.label} (${kind}, ${c.messages.length} msgs) ===\n${lines}`;
  });
  return `Here are the messages I missed in the last ${hours}h, grouped by chat.\n\n${blocks.join('\n\n')}\n\nGive me the catch-up digest.`;
}

export async function summarize(chats, { provider, hours, maxTokens = 1024 }) {
  const prompt = buildPrompt(chats, { hours });
  return provider.complete({ system: SYSTEM, prompt, maxTokens });
}
