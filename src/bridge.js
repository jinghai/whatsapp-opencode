const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage } = require('@whiskeysockets/baileys')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const P = require('pino')
const qrcode = require('qrcode-terminal')
const FormData = require('form-data')

const AUTH_DIR = path.join(__dirname, 'auth')
const LOGS_DIR = path.join(__dirname, 'logs')
const MEDIA_DIR = path.join(__dirname, 'media')
const DATA_DIR = path.join(__dirname, 'data')
const STATE_FILE = path.join(DATA_DIR, 'state.json')

const OPENCODE_LOCAL = 'http://127.0.0.1:4096'
const SILICONFLOW_API = 'https://api.siliconflow.cn/v1/audio/transcriptions'
const SILICONFLOW_KEY = 'sk-demo'

;[AUTH_DIR, LOGS_DIR, MEDIA_DIR, DATA_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true })
})

const logger = P({ level: 'info' }, P.destination(path.join(LOGS_DIR, 'wa-bridge.log')))

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
    }
  } catch (e) {}
  return { sessionId: null, lastIndex: -1 }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

async function getOrCreateSession(state) {
  if (state.sessionId) {
    try {
      const res = await axios.get(`${OPENCODE_LOCAL}/session/${state.sessionId}`)
      if (res.data?.id) return state.sessionId
    } catch (e) {
      console.log('Session无效，创建新session')
    }
  }
  
  const res = await axios.post(`${OPENCODE_LOCAL}/session`)
  console.log(`🆕 创建新Session: ${res.data.id}`)
  return res.data.id
}

async function downloadMediaToBuffer(sock, msg) {
  try {
    const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: P({ level: 'silent' }) })
    return buffer
  } catch (e) {
    console.error('下载媒体失败:', e.message)
    return null
  }
}

async function transcribeAudio(buffer, filename) {
  try {
    const tempFile = path.join(MEDIA_DIR, `temp_${Date.now()}.ogg`)
    fs.writeFileSync(tempFile, buffer)
    
    const form = new FormData()
    form.append('file', fs.createReadStream(tempFile), { filename: 'audio.ogg', contentType: 'audio/ogg' })
    form.append('model', 'FunAudioLLM/SenseVoiceSmall')
    
    const res = await axios.post(SILICONFLOW_API, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${SILICONFLOW_KEY}`
      },
      timeout: 30000
    })
    
    fs.unlinkSync(tempFile)
    return res.data.text || '[语音转文字失败]'
  } catch (e) {
    console.error('语音转文字错误:', e.response?.data || e.message)
    return '[语音转文字失败]'
  }
}

function isUserMessage(msg) {
  const parts = msg.parts || []
  return parts.length === 1 && parts[0]?.type === 'text'
}

function isAssistantMessage(msg) {
  const parts = msg.parts || []
  return parts.some(p => p.type === 'step-start' || p.type === 'reasoning')
}

function getTextFromMessage(msg) {
  for (const p of (msg.parts || [])) {
    if (p.type === 'text' && p.text) return p.text
  }
  return ''
}

async function startBridge() {
  const state = loadState()
  const sessionId = await getOrCreateSession(state)
  state.sessionId = sessionId
  
  const res = await axios.get(`${OPENCODE_LOCAL}/session/${sessionId}/message`)
  state.lastIndex = (res.data || []).length - 1
  saveState(state)
  
  console.log(`\n🔄 同步Session: ${sessionId}`)
  console.log(`📌 TUI 和 WhatsApp 双端同步已启动\n`)

  const { state: waState, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: waState,
    browser: ['OpenCode Bridge', 'Chrome', '1.0.0'],
    logger: P({ level: 'silent' })
  })

  let myJid = null
  let isProcessing = false
  const sentToWA = new Set()

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr) {
      console.log('\n========================================')
      console.log('请用 WhatsApp 扫描二维码:')
      console.log('========================================\n')
      qrcode.generate(qr, { small: true })
    }
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      if (shouldReconnect) startBridge()
    } else if (connection === 'open') {
      console.log('\n✅ WhatsApp 连接成功!')
      console.log('📌 双端同步运行中')
      console.log('📌 支持: 文本、图片、语音\n')
    }
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (isProcessing) return
    
    const msg = messages[0]
    if (!msg.message) return

    const sender = msg.key.remoteJid
    
    if (!myJid && msg.key.fromMe && sender) {
      myJid = sender
    }

    const isMessageToSelf = msg.key.fromMe && sender && myJid && sender === myJid
    if (msg.key.fromMe && !isMessageToSelf) return

    let text = ''

    if (msg.message.conversation) {
      text = msg.message.conversation
    } else if (msg.message.extendedTextMessage) {
      text = msg.message.extendedTextMessage.text
    } else if (msg.message.imageMessage) {
      const buffer = await downloadMediaToBuffer(sock, msg)
      if (buffer) {
        const filename = `img_${Date.now()}.jpg`
        const filepath = path.join(MEDIA_DIR, filename)
        fs.writeFileSync(filepath, buffer)
        text = `${msg.message.imageMessage.caption || '请描述这张图片'}\n\n[图片路径: ${filepath}]`
        console.log(`📷 收到图片，保存到: ${filepath}`)
      } else {
        text = '[图片下载失败]'
      }
    } else if (msg.message.audioMessage || msg.message.voiceMessage) {
      const buffer = await downloadMediaToBuffer(sock, msg)
      if (buffer) {
        console.log('🎤 正在转录语音...')
        text = await transcribeAudio(buffer, 'audio.ogg')
        console.log(`📝 转录结果: ${text.substring(0, 50)}...`)
      } else {
        text = '[语音消息下载失败]'
      }
    }

    if (!text) return
    if (sentToWA.has(text)) {
      sentToWA.delete(text)
      return
    }

    isProcessing = true
    console.log(`\n📩 [WhatsApp] ${text.substring(0, 50)}...`)

    try {
      await sock.sendPresenceUpdate('composing', sender)
      
      const parts = []
      parts.push({ type: 'text', text: text.startsWith('📱') ? text : `📱 ${text}` })

      const msgResBefore = await axios.get(`${OPENCODE_LOCAL}/session/${sessionId}/message`)
      const msgCountBefore = (msgResBefore.data || []).length

      await axios.post(
        `${OPENCODE_LOCAL}/session/${sessionId}/prompt_async`,
        { parts }
      )

      let reply = ''
      let lastMsgId = null
      let attempts = 0
      const maxAttempts = 120

      while (attempts < maxAttempts && !reply) {
        await new Promise(r => setTimeout(r, 1000))
        
        const msgRes = await axios.get(`${OPENCODE_LOCAL}/session/${sessionId}/message`)
        const msgs = msgRes.data || []
        
        for (let i = msgCountBefore; i < msgs.length; i++) {
          const m = msgs[i]
          if (m.info?.role === 'assistant') {
            const isFinished = m.info?.finish === 'stop' || (m.parts || []).some(p => p.type === 'step-finish')
            
            if (!isFinished) {
              lastMsgId = m.info?.id
              continue
            }
            
            for (const p of (m.parts || [])) {
              if (p.type === 'text' && p.text && p.text.length > 1) {
                reply = p.text
                break
              }
            }
            if (reply) break
          }
        }
        attempts++
      }

      if (reply) {
        sentToWA.add(reply)
        await sock.sendMessage(sender, { text: reply })
        console.log(`📤 已回复: ${reply.substring(0, 50)}...`)
      } else {
        await sock.sendMessage(sender, { text: '⏳ 回复超时，请稍后重试' })
        console.log(`⚠️ 回复超时`)
      }

      const msgResAfter = await axios.get(`${OPENCODE_LOCAL}/session/${sessionId}/message`)
      state.lastIndex = (msgResAfter.data || []).length - 1
      saveState(state)
      
    } catch (err) {
      console.error('❌ 错误:', err.message)
      try {
        await sock.sendMessage(sender, { text: `❌ 错误: ${err.message}` })
      } catch (e) {}
    } finally {
      isProcessing = false
    }
  })

  const syncTimer = setInterval(async () => {
    if (isProcessing || !myJid) return
    
    try {
      const res = await axios.get(`${OPENCODE_LOCAL}/session/${sessionId}/message`)
      const msgs = res.data || []
      
      for (let i = state.lastIndex + 1; i < msgs.length; i++) {
        const m = msgs[i]
        const text = getTextFromMessage(m)
        
        if (isUserMessage(m) && text && !text.startsWith('📱')) {
          const notify = `💻 [TUI端]\n${text}`
          sentToWA.add(text)
          await sock.sendMessage(myJid, { text: notify })
          console.log(`\n💬 [TUI→WA] ${text.substring(0, 30)}...`)
        } else if (isAssistantMessage(m) && text && text.length > 5) {
          const lastUserMsg = msgs.slice(0, i).reverse().find(isUserMessage)
          if (lastUserMsg && !getTextFromMessage(lastUserMsg).startsWith('📱')) {
            const notify = `🤖 [回复TUI]\n${text}`
            sentToWA.add(text)
            await sock.sendMessage(myJid, { text: notify })
            console.log(`\n🤖 [TUI回复→WA]`)
          }
        }
        
        state.lastIndex = i
        saveState(state)
      }
    } catch (e) {}
  }, 2000)

  process.on('SIGINT', () => {
    clearInterval(syncTimer)
    console.log('\n关闭中...')
    process.exit(0)
  })

  return sock
}

console.log('\n🚀 WhatsApp-OpenCode 双端同步 Bridge')
console.log('📌 支持: 文本、图片识别、语音转文字\n')
startBridge().catch(e => { console.error('启动失败:', e); process.exit(1) })
