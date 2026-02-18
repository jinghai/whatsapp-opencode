const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const P = require('pino')
const path = require('path')

async function sendTest() {
  const AUTH_DIR = path.join(__dirname, 'auth')
  const { state } = await useMultiFileAuthState(AUTH_DIR)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    browser: ['OpenCode Bridge', 'Chrome', '1.0.0'],
    logger: P({ level: 'silent' })
  })

  sock.ev.on('connection.update', async (update) => {
    const { connection } = update
    
    if (connection === 'open') {
      const jid = '8615800937529@s.whatsapp.net'
      try {
        await sock.sendMessage(jid, { 
          text: '🎉 你好！这是来自 OpenCode 的测试消息。\n\n你现在可以通过 WhatsApp 直接和我对话了！\n\n试试发送：你好' 
        })
        console.log('✅ 测试消息已发送到 8615800937529')
      } catch (err) {
        console.error('❌ 发送失败:', err.message)
      }
      process.exit(0)
    }
  })
}

sendTest()
