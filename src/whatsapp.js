import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers,
  isJidGroup,
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';

const logger = pino({ level: 'silent' });

// Starts the WhatsApp link and calls onMessages({ messages, type, sock }) for
// every incoming batch. Handles QR display and auto-reconnect.
export async function startWhatsApp({ authDir, onMessages, attempt = 0 }) {
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    browser: Browsers.appropriate('Chrome'),
    markOnlineOnConnect: false, // stay invisible — this is a background reader
  });

  // Tracks reconnect attempts for exponential backoff. Reset once connected,
  // so a laptop waking from sleep reconnects fast instead of after a long delay.
  let currentAttempt = attempt;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\nScan this QR with WhatsApp on your phone:');
      console.log('  Settings -> Linked Devices -> Link a Device\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      currentAttempt = 0;
      console.log('Connected. Listening for messages. Text yourself the summary command to get a digest.\n');
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.log('Logged out. Delete the auth folder and run again to re-link.');
        process.exit(1);
      }
      const delay = Math.min(30_000, 1000 * 2 ** currentAttempt);
      console.log(`Connection closed (code ${code ?? 'unknown'}). Reconnecting in ${Math.round(delay / 1000)}s...`);
      setTimeout(() => startWhatsApp({ authDir, onMessages, attempt: currentAttempt + 1 }), delay);
    }
  });

  sock.ev.on('messages.upsert', (payload) => {
    onMessages({ ...payload, sock });
  });

  return sock;
}

// Resolves a human-friendly chat name. Cached so we don't re-fetch group metadata.
export async function resolveChatLabel(sock, jid, cache) {
  if (cache.has(jid)) return cache.get(jid);
  let label = jid.split('@')[0];
  if (isJidGroup(jid)) {
    try {
      const meta = await sock.groupMetadata(jid);
      if (meta?.subject) label = meta.subject;
    } catch {
      // ignore — fall back to the raw id
    }
  }
  cache.set(jid, label);
  return label;
}

export { isJidGroup };
