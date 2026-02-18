const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage } = require('@whiskeysockets/baileys')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const P = require('pino')
const qrcode = require('qrcode-terminal')
const FormData = require('form-data')

const VERSION = require('./package.json').version
const AUTH_DIR = path.join(__dirname, 'auth')
const LOGS_DIR = path.join(__dirname, 'logs')
const MEDIA_DIR = path.join(__dirname, 'media')
const DATA_DIR = path.join(__dirname, 'data')
const STATE_FILE = path.join(DATA_DIR, 'state.json')

const OPENCODE_LOCAL = 'http://127.0.0.1:4096'
const SILICONFLOW_API = 'https://api.siliconflow.cn/v1/audio/transcriptions'
const SILICONFLOW_KEY = 'sk-qlpzpxwgnpnclihjlhwvqhkxiknsblugeshuasdvcrwcjdec'

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

function getProgressInfo(msgs, msgCountBefore) {
  const lines = []
  let currentTool = null
  let reasoningText = ''
  
  // Get the latest assistant message
  for (let i = msgs.length - 1; i >= msgCountBefore; i--) {
    const m = msgs[i]
    if (m.info?.role === 'assistant') {
      const parts = m.parts || []
      
      // Check for reasoning/thinking
      for (const p of parts) {
        if (p.type === 'reasoning' && p.text) {
          reasoningText = p.text.slice(-200) // Last 200 chars
        }
        if (p.type === 'tool') {
          const status = p.state?.status
          const toolName = p.tool || 'unknown'
          const input = p.state?.input
          if (status === 'running') {
            const cmd = input?.command || input?.query || ''
            currentTool = `• 正在执行: ${toolName}${cmd ? ` - ${cmd.slice(0, 50)}` : ''}`
          }
        }
      }
      
      // Check step-start for plan info
      for (const p of parts) {
        if (p.type === 'step-start') {
          lines.push(`📌 当前步骤: ${p.reasoning || p.id || '处理中'}`)
        }
      }
    }
  }
  
  if (currentTool) {
    lines.push(currentTool)
  }
  
  if (reasoningText) {
    lines.push(`💭 ${reasoningText}`)
  }
  
  return lines.length > 0 ? lines.join('\n') : null
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

    // Handle commands
    const cmd = text.trim().toLowerCase()
    
    // /new - Create new session
    if (cmd === '/new' || cmd === '/reset') {
      try {
        const newSessionRes = await axios.post(`${OPENCODE_LOCAL}/session`)
        const newSessionId = newSessionRes.data.id
        state.sessionId = newSessionId
        state.lastIndex = -1
        saveState(state)
        await sock.sendMessage(sender, { text: `✅ 已创建新会话\n🆕 Session: ${newSessionId}` })
        console.log(`🆕 新Session: ${newSessionId}`)
      } catch (e) {
        await sock.sendMessage(sender, { text: `❌ 创建失败: ${e.message}` })
      }
      return
    }

    // /help - Show help
    if (cmd === '/help' || cmd === '/h') {
      const helpMsg = `📖 *WhatsApp OpenCode Bridge v${VERSION}*

🔧 *命令:*
/new - 创建新会话
/help - 显示帮助

📱 *功能:*
• 文本消息 - 直接发送
• 图片消息 - 自动识别
• 语音消息 - 自动转文字

🔗 *项目:*
github.com/jinghai/whatsapp-opencode`
      await sock.sendMessage(sender, { text: helpMsg })
      return
    }

    // Detect task type and add skill hints
    let enhancedText = text
    const skillKeywords = {
      'brainstorming': ['想法', '设计', '规划', 'brainstorm', 'idea', 'design', 'plan', '如何实现', '方案'],
      'debugging': ['错误', 'bug', '报错', 'debug', 'error', '问题', '不工作', '失败'],
      'tdd': ['测试', 'test', 'tdd', '单元测试', 'spec'],
      'code-review': ['审查', 'review', '检查代码', '优化'],
      'git': ['提交', 'commit', 'push', 'merge', 'pr', '分支']
    }
    
    // Check if task matches any skill
    const textLower = text.toLowerCase()
    for (const [skill, keywords] of Object.entries(skillKeywords)) {
      if (keywords.some(kw => textLower.includes(kw))) {
        enhancedText = `[检测到${skill}任务]\n${text}`
        console.log(`🎯 自动检测任务类型: ${skill}`)
        break
      }
    }

    isProcessing = true
    console.log(`\n📩 [WhatsApp] ${text.substring(0, 50)}...`)

    try {
      await sock.sendPresenceUpdate('composing', sender)
      
      const parts = []
      const msgText = enhancedText.startsWith('📱') ? enhancedText : `📱 ${enhancedText}`
      parts.push({ type: 'text', text: msgText })

      const msgResBefore = await axios.get(`${OPENCODE_LOCAL}/session/${sessionId}/message`)
      const msgCountBefore = (msgResBefore.data || []).length

      await axios.post(
        `${OPENCODE_LOCAL}/session/${sessionId}/prompt_async`,
        { parts }
      )

      let reply = ''
      let attempts = 0
      const maxAttempts = 600 // 10 minutes max
      const notifyInterval = 300 // Notify every 5 minutes
      let lastNotify = 0
      let stuckCount = 0

      while (!reply && attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 1000))
        
        const msgRes = await axios.get(`${OPENCODE_LOCAL}/session/${sessionId}/message`)
        const msgs = msgRes.data || []
        
        // Look for assistant messages with text
        for (let i = msgCountBefore; i < msgs.length; i++) {
          const m = msgs[i]
          if (m.info?.role === 'assistant') {
            const msgParts = m.parts || []
            const finish = m.info?.finish
            
            // Find text in this message
            let foundText = null
            for (const p of msgParts) {
              if (p.type === 'text' && p.text && p.text.length > 1) {
                foundText = p.text
                break
              }
            }
            
            if (foundText) {
              reply = foundText
              // If finish is 'stop', we're done
              if (finish === 'stop') {
                break
              }
              // If finish is None or tool-calls, check tools
              const tools = msgParts.filter(p => p.type === 'tool')
              const runningTools = tools.filter(p => p.state?.status === 'running')
              
              // If all tools done or no tools, use this reply
              if (runningTools.length === 0) {
                break
              }
              
              // Tools still running - increment stuck counter
              stuckCount++
              if (stuckCount > 30) {
                // Waited 30 seconds with running tools, use partial reply
                console.log('⚠️ 工具仍在运行，使用部分回复')
                break
              }
              // Reset reply to null to continue waiting
              reply = null
            } else {
              // No text, check for stuck tools
              const tools = msgParts.filter(p => p.type === 'tool')
              const runningTools = tools.filter(p => p.state?.status === 'running')
              
              if (runningTools.length > 0) {
                stuckCount++
                if (stuckCount > 60) {
                  // Stuck for 60 seconds, get tool output
                  console.log('⚠️ 检测到卡顿，获取工具输出')
                  for (const t of tools) {
                    if (t.state?.status === 'completed' && t.state?.output) {
                      const output = t.state.output
                      if (typeof output === 'string' && output.length > 10) {
                        reply = `📋 工具输出:\n\`\`\`\n${output.slice(0, 500)}\n\`\`\``
                        break
                      }
                    }
                  }
                  if (reply) break
                  stuckCount = 0
                }
              }
            }
          }
        }
        
        attempts++
        
        // Only show typing status after 10 seconds
        if (attempts >= 10) {
          if (attempts === 10) {
            await sock.sendPresenceUpdate('composing', sender)
          } else if (attempts % 30 === 0) {
            await sock.sendPresenceUpdate('composing', sender)
          }
          
          // Send progress update every 5 minutes
          if (attempts - lastNotify >= notifyInterval) {
            const elapsed = Math.floor(attempts / 60)
            const timeStr = elapsed >= 60 ? `${Math.floor(elapsed/60)}小时${elapsed%60}分钟` : `${elapsed}分钟`
            
            const progressInfo = getProgressInfo(msgs, msgCountBefore)
            const progressMsg = progressInfo 
              ? `🔄 处理中 (${timeStr})\n\n📋 当前进度:\n${progressInfo}\n\n⏳ 对方正在输入...`
              : `🔄 正在处理中... (已等待${timeStr})\n\n⏳ 对方正在输入...`
            
            await sock.sendMessage(sender, { text: progressMsg })
            console.log(`⏳ 进度通知: ${timeStr}`)
            lastNotify = attempts
          }
        }
      }

      // Stop typing status
      await sock.sendPresenceUpdate('paused', sender)

      if (reply) {
        sentToWA.add(reply)
        await sock.sendMessage(sender, { text: reply })
        console.log(`📤 已回复: ${reply.substring(0, 50)}...`)
      } else {
        // Timeout - create new session for next request
        console.log('⚠️ 处理超时，创建新session')
        try {
          const newSessionRes = await axios.post(`${OPENCODE_LOCAL}/session`)
          state.sessionId = newSessionRes.data.id
          state.lastIndex = -1
          saveState(state)
          await sock.sendMessage(sender, { text: '⏱️ 处理超时，任务可能还在继续。\n\n已创建新会话，请稍后发送新请求。' })
        } catch (e) {
          await sock.sendMessage(sender, { text: '⏱️ 处理超时，请重试。' })
        }
      }

      // 任务完成后停止输入状态
      await sock.sendPresenceUpdate('available', sender)

      const msgResAfter = await axios.get(`${OPENCODE_LOCAL}/session/${sessionId}/message`)
      state.lastIndex = (msgResAfter.data || []).length - 1
      saveState(state)
      
    } catch (err) {
      console.error('❌ 错误:', err.message)
      try {
        await sock.sendPresenceUpdate('paused', sender)
        await sock.sendMessage(sender, { text: `❌ 错误: ${err.message}` })
      } catch (e) {}
    } finally {
      try {
        await sock.sendPresenceUpdate('paused', sender)
      } catch (e) {}
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

console.log(`\n🚀 WhatsApp-OpenCode Bridge v${VERSION}`)
console.log('📌 支持: 文本、图片识别、语音转文字')
console.log('📌 项目: https://github.com/jinghai/whatsapp-opencode\n')
startBridge().catch(e => { console.error('启动失败:', e); process.exit(1) })
