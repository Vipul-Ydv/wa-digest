// In-memory message buffer. This is the whole privacy story:
// messages live here only while the process runs, are pruned by age,
// and are dropped after each digest (when CLEAR_AFTER_SUMMARY=true).
// Nothing is ever written to disk.

export class MessageStore {
  constructor({ maxPerChat = 300 } = {}) {
    this.maxPerChat = maxPerChat;
    // Map<chatJid, { label, isGroup, messages: [{ sender, text, ts }] }>
    this.chats = new Map();
  }

  add(chatJid, { sender, text, ts, isGroup = false }) {
    if (!text) return;
    let chat = this.chats.get(chatJid);
    if (!chat) {
      chat = { label: sender || chatJid.split('@')[0], isGroup, messages: [] };
      this.chats.set(chatJid, chat);
    }
    // For 1:1 chats the label is just the contact's name.
    if (!isGroup && sender) chat.label = sender;
    chat.messages.push({ sender: sender || 'Unknown', text, ts });
    if (chat.messages.length > this.maxPerChat) {
      chat.messages.splice(0, chat.messages.length - this.maxPerChat);
    }
  }

  // Returns chats that have messages newer than `sinceMs`, with only those messages.
  window(sinceMs) {
    const out = [];
    for (const [jid, chat] of this.chats) {
      const msgs = chat.messages.filter((m) => m.ts >= sinceMs);
      if (msgs.length) out.push({ jid, label: chat.label, isGroup: chat.isGroup, messages: msgs });
    }
    return out;
  }

  // Set a friendlier label for a chat (e.g. a resolved group subject).
  setLabel(chatJid, label) {
    const chat = this.chats.get(chatJid);
    if (chat && label) chat.label = label;
  }

  // Drop everything at or before `ts` (used after a digest).
  clearBefore(ts) {
    for (const [jid, chat] of this.chats) {
      chat.messages = chat.messages.filter((m) => m.ts > ts);
      if (!chat.messages.length) this.chats.delete(jid);
    }
  }

  // Drop messages older than `olderThanMs` (periodic memory hygiene).
  prune(olderThanMs) {
    for (const [jid, chat] of this.chats) {
      chat.messages = chat.messages.filter((m) => m.ts >= olderThanMs);
      if (!chat.messages.length) this.chats.delete(jid);
    }
  }

  totalMessages() {
    let n = 0;
    for (const chat of this.chats.values()) n += chat.messages.length;
    return n;
  }
}
