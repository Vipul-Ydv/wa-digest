#!/usr/bin/env node
import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { config, assertConfig } from './config.js';
import { MessageStore } from './store.js';
import { messageToText } from './message.js';
import { summarize } from './summarize.js';
import { getProvider } from './providers/index.js';
import { startWhatsApp, resolveChatLabel, isJidGroup } from './whatsapp.js';

assertConfig();

const provider = getProvider(config);
const store = new MessageStore({ maxPerChat: config.maxPerChat });
const labelCache = new Map();

function parseHours(text) {
  const m = text.trim().match(/(\d+(?:\.\d+)?)/);
  if (!m) return config.defaultHours;
  const h = Number(m[1]);
  return h > 0 && h <= 168 ? h : config.defaultHours;
}

async function runDigest(sock, replyJid, hours) {
  const sinceMs = Date.now() - hours * 3600_000;
  const chats = store.window(sinceMs);

  if (!chats.length) {
    await sock.sendMessage(replyJid, { text: `Nothing new to catch up on in the last ${hours}h.` });
    return;
  }

  // Resolve friendly names for groups (1:1 chats already carry the contact name).
  for (const c of chats) {
    if (c.isGroup) c.label = await resolveChatLabel(sock, c.jid, labelCache);
  }

  const total = chats.reduce((n, c) => n + c.messages.length, 0);
  await sock.sendMessage(replyJid, {
    text: `Summarizing ${total} message${total === 1 ? '' : 's'} across ${chats.length} chat${chats.length === 1 ? '' : 's'}...`,
  });

  try {
    const digest = await summarize(chats, {
      provider,
      hours,
      maxTokens: config.maxTokens,
    });
    await sock.sendMessage(replyJid, { text: digest || 'No summary produced.' });

    if (config.clearAfterSummary) store.clearBefore(Date.now());
  } catch (err) {
    console.error('Summarize failed:', err?.message || err);
    await sock.sendMessage(replyJid, { text: `Could not generate the summary: ${err?.message || 'unknown error'}` });
  }
}

function onMessages({ messages, type, sock }) {
  if (type !== 'notify') return; // ignore history sync, only react to live messages

  const me = sock.user?.id ? jidNormalizedUser(sock.user.id) : null;

  for (const m of messages) {
    const jid = m.key?.remoteJid;
    if (!jid || jid === 'status@broadcast') continue;

    const text = messageToText(m.message);

    // Command: only honored when YOU send it in YOUR OWN self-chat.
    // This guarantees a digest can never be posted into a group or someone else's chat.
    const isSelfChat = me && jidNormalizedUser(jid) === me;
    if (m.key.fromMe && isSelfChat && text && text.trim().toLowerCase().startsWith(config.summaryCommand)) {
      const rest = text.trim().slice(config.summaryCommand.length);
      runDigest(sock, jid, parseHours(rest));
      continue;
    }

    if (m.key.fromMe) continue; // don't buffer our own messages

    // Buffer incoming messages from others.
    const group = isJidGroup(jid);
    const sender = m.pushName || (group ? m.key.participant?.split('@')[0] : jid.split('@')[0]) || 'Unknown';
    store.add(jid, {
      sender,
      text,
      ts: Number(m.messageTimestamp) * 1000 || Date.now(),
      isGroup: group,
    });
  }
}

// Memory hygiene: drop anything older than the buffer window every 30 minutes.
setInterval(() => store.prune(Date.now() - config.bufferHours * 3600_000), 30 * 60_000);

console.log('Starting wa-digest...');
console.log(`Provider: ${config.provider} | Model: ${config.model} | Command: "${config.summaryCommand}" (send to yourself) | Default window: ${config.defaultHours}h\n`);

startWhatsApp({ authDir: config.authDir, onMessages });
