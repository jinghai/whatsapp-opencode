const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const P = require('pino');

/**
 * 创建 WhatsApp 客户端
 */
async function createWhatsAppClient(options) {
  const { authDir, onConnectionUpdate, onMessagesUpsert } = options;
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    browser: ['OpenCode Bridge', 'Chrome', '1.0.0'],
    logger: P({ level: 'silent' })
  });

  sock.ev.on('connection.update', onConnectionUpdate);
  sock.ev.on('messages.upsert', onMessagesUpsert);
  sock.ev.on('creds.update', saveCreds);

  return sock;
}

module.exports = { createWhatsAppClient };
