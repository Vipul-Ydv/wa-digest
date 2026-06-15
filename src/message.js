import { getContentType } from '@whiskeysockets/baileys';

// Content types we never want to buffer (no human-readable content).
const SKIP = new Set([
  'protocolMessage',
  'senderKeyDistributionMessage',
  'reactionMessage',
  'pollUpdateMessage',
]);

const MEDIA_LABEL = {
  imageMessage: '[photo]',
  videoMessage: '[video]',
  audioMessage: '[voice message]',
  stickerMessage: '[sticker]',
  documentMessage: '[document]',
  contactMessage: '[contact]',
  contactsArrayMessage: '[contacts]',
  locationMessage: '[location]',
  liveLocationMessage: '[live location]',
  pollCreationMessage: '[poll]',
};

// Returns a string to store, or null if the message has nothing worth keeping.
export function messageToText(message) {
  if (!message) return null;
  const type = getContentType(message);
  if (!type || SKIP.has(type)) return null;

  if (type === 'conversation') return message.conversation || null;
  if (type === 'extendedTextMessage') return message.extendedTextMessage?.text || null;

  // Media with a caption: keep the caption, prefixed so context is clear.
  const captioned = message[type];
  const caption = captioned?.caption;
  if (caption) return `${MEDIA_LABEL[type] || '[media]'} ${caption}`;

  return MEDIA_LABEL[type] || null;
}
