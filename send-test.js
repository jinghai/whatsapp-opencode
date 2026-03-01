const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const P = require('pino');
const path = require('path');
const dotenv = require('dotenv');

/**
 * 发送测试消息
 */
async function sendTest() {
  dotenv.config();
  const jid = process.env.TEST_JID;
  if (!jid) {
    console.error('❌ 缺少 TEST_JID，请在 .env 中配置');
    process.exit(1);
  }

  const workingDir = process.env.WORKING_DIR ? path.resolve(process.env.WORKING_DIR) : __dirname;
  const authDir = path.join(workingDir, 'auth');
  const { state } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    browser: ['OpenCode Bridge', 'Chrome', '1.0.0'],
    logger: P({ level: 'silent' })
  });

  sock.ev.on('connection.update', async update => {
    const { connection } = update;
    if (connection === 'open') {
      try {
        await sock.sendMessage(jid, {
          text: '🎉 你好！这是来自 OpenCode 的测试消息。\n\n你现在可以通过 WhatsApp 直接和我对话了！\n\n试试发送：你好'
        });
        console.log(`✅ 测试消息已发送到 ${jid}`);
      } catch (error) {
        console.error('❌ 发送失败:', error.message);
      }
      process.exit(0);
    }
  });
}

sendTest();
