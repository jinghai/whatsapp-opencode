const fs = require('fs');
const path = require('path');
const P = require('pino');
const qrcode = require('qrcode-terminal');
const { DisconnectReason, downloadMediaMessage } = require('@whiskeysockets/baileys');
const { ensureDir, readJson, writeJson } = require('../utils/filesystem');
const { isUserMessage, isAssistantMessage, getTextFromMessage, buildProgressMessage } = require('../utils/messages');
const { createOpenCodeClient } = require('../services/opencodeClient');
const { transcribeAudio } = require('../services/transcriber');
const { createWhatsAppClient } = require('../services/whatsappClient');
const { parseCommand, enrichTextWithSkillHint, buildHelpMessage, isSenderAllowed } = require('./handlers');
const { createLogger } = require('../utils/logger');
const { t } = require('../utils/i18n');

let sigintHandler = null;

/**
 * 解析工作目录结构
 */
function resolveDirs(workingDir) {
  const authDir = path.join(workingDir, 'auth');
  const logsDir = path.join(workingDir, 'logs');
  const mediaDir = path.join(workingDir, 'media');
  const dataDir = path.join(workingDir, 'data');
  return { authDir, logsDir, mediaDir, dataDir };
}

/**
 * 读取运行状态
 */
function loadState(stateFile) {
  return readJson(stateFile, { users: {} });
}

/**
 * 写入运行状态
 */
function saveState(stateFile, state) {
  writeJson(stateFile, state);
}

function validateConfig(config) {
  if (!config?.workingDir || !config?.opencodeUrl) {
    throw new Error('缺少必要配置: workingDir 或 opencodeUrl');
  }
}

function resolveDisconnectReason(statusCode) {
  if (statusCode === undefined || statusCode === null) return 'unknown';
  const match = Object.entries(DisconnectReason).find(([, code]) => code === statusCode);
  return match ? match[0] : String(statusCode);
}

function clearAuthState(authDir) {
  if (fs.existsSync(authDir)) {
    fs.rmSync(authDir, { recursive: true, force: true });
  }
}

function normalizeJid(value) {
  if (!value) return null;
  if (value.includes('@')) return value;
  const digits = value.replace(/[^\d]/g, '');
  if (!digits) return null;
  const normalized = digits.length === 11 && digits.startsWith('1') ? `86${digits}` : digits;
  return `${normalized}@s.whatsapp.net`;
}

function resolveGreetingTargets(allowlist, sock) {
  if (Array.isArray(allowlist) && allowlist.length > 0) {
    return allowlist.map(normalizeJid).filter(Boolean);
  }
  const selfJid = sock?.user?.id;
  return selfJid ? [selfJid] : [];
}

/**
 * 获取或创建 OpenCode 会话
 */
async function getOrCreateSession(client, state, jid) {
  if (!state.users) {
    state.users = {};
  }
  if (!state.users[jid]) {
    state.users[jid] = { sessionId: null, lastIndex: -1 };
  }
  
  const userState = state.users[jid];
  // Update last activity
  userState.lastActivity = Date.now();
  
  if (userState.sessionId) {
    try {
      const res = await client.getSession(userState.sessionId);
      if (res?.id) return userState.sessionId;
    } catch (error) {
      void error;
    }
  }
  const res = await client.createSession();
  userState.sessionId = res.id;
  userState.lastIndex = -1; // New session, reset index
  return res.id;
}

/**
 * 下载媒体消息为内存缓冲区
 */
async function downloadMediaToBuffer(sock, msg) {
  try {
    const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: P({ level: 'silent' }) });
    return buffer;
  } catch {
    return null;
  }
}

/**
 * 启动 WhatsApp 与 OpenCode 同步桥接
 */
async function startBridge(config, version, options = {}) {
  validateConfig(config);
  const dirs = resolveDirs(config.workingDir);
  Object.values(dirs).forEach(ensureDir);
  const stateFile = path.join(dirs.dataDir, 'state.json');
  // Use a factory function or DI for logger if needed, but here we just create it.
  // We mock pino in tests to avoid file creation issues.
  const logger = createLogger(config.workingDir, config.debug);
  const client = createOpenCodeClient(config.opencodeUrl);
  const state = loadState(stateFile);
  // const sessionId = await getOrCreateSession(client, state);
  // state.sessionId = sessionId;
  // const initialMessages = await client.listMessages(sessionId);
  // state.lastIndex = (initialMessages || []).length - 1;
  // saveState(stateFile, state);
  // logger.info({ sessionId }, 'bridge started');
  logger.info({}, 'bridge started');

  const { authDir, mediaDir } = dirs;
  let myJid = null;
  const sentToWA = new Set();
  let syncTimer = null;
  let connectedHandled = false;

  // 定义停止函数
  const stop = () => {
    if (syncTimer) {
      clearInterval(syncTimer);
      syncTimer = null;
    }
  };

  if (sigintHandler) {
    process.removeListener('SIGINT', sigintHandler);
  }
  sigintHandler = () => {
    stop();
    process.exit(0);
  };
  process.on('SIGINT', sigintHandler);

  const sock = await createWhatsAppClient({
    authDir,
    onConnectionUpdate: async update => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        logger.info('qr received');
        qrcode.generate(qr, { small: true });
        console.log(t('qrReady'));
      }
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const reason = resolveDisconnectReason(statusCode);
        logger.warn({ statusCode, reason }, 'connection closed');
        console.log(t('connectionClosedWithReason', { reason }));
        stop(); // Stop the timer for this instance
        if (statusCode === DisconnectReason.loggedOut) {
          clearAuthState(authDir);
          console.log(t('loggedOutRescan'));
          startBridge(config, version).catch(err => logger.error({ err }, 'Restart failed'));
          return;
        }
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          console.log(t('reconnecting'));
          // Restart bridge
          startBridge(config, version).catch(err => logger.error({ err }, 'Restart failed'));
        }
      } else if (connection === 'open') {
        logger.info('WhatsApp 连接成功');
        console.log(t('connected'));
        if (!options.skipGreeting) {
          let targets = resolveGreetingTargets(config.allowlist, sock);
          const selfJid = sock?.user?.id;
          if (targets.length === 0 && selfJid) {
            logger.warn({ allowlist: config.allowlist }, 'greeting target empty, fallback to self');
            targets = [selfJid];
          }
          if (selfJid && !targets.includes(selfJid) && targets.length > 0) {
            logger.warn(
              { allowlist: config.allowlist, selfJid },
              'greeting allowlist missing self, add self'
            );
            targets = [...targets, selfJid];
          }
          for (const target of targets) {
            try {
              await sock.sendMessage(target, { text: t('serviceStartGreeting') });
              logger.info({ target }, 'send greeting success');
              console.log(t('greetingSent', { target }));
            } catch (error) {
              logger.warn({ error: error?.message, target }, 'send greeting failed');
              console.error(t('greetingFailed', { target, error: error?.message }));
            }
          }
        }
        if (options.onConnected && !connectedHandled) {
          connectedHandled = true;
          try {
            await options.onConnected(sock);
          } catch (error) {
            logger.warn({ error }, 'onConnected failed');
          }
        }
      }
    },
    onMessagesUpsert: async ({ messages }) => {
      // if (isProcessing) return;
      const msg = messages[0];
      if (!msg?.message) return;

      const sender = msg.key.remoteJid;
      if (!myJid && msg.key.fromMe && sender) {
        myJid = sender;
      }

      const isMessageToSelf = msg.key.fromMe && sender && myJid && sender === myJid;
      if (msg.key.fromMe && !isMessageToSelf) return;
      if (!msg.key.fromMe && !isSenderAllowed(sender, config.allowlist)) return;

      // Check per-user processing state
      if (!state.processingUsers) state.processingUsers = new Set();
      if (state.processingUsers.has(sender)) return;

      let text = '';

      if (msg.message.conversation) {
        text = msg.message.conversation;
      } else if (msg.message.extendedTextMessage) {
        text = msg.message.extendedTextMessage.text;
      } else if (msg.message.imageMessage) {
        const buffer = await downloadMediaToBuffer(sock, msg);
        if (buffer) {
          const filename = `img_${Date.now()}.jpg`;
          const filepath = path.join(mediaDir, filename);
          fs.writeFileSync(filepath, buffer);
          text = `${msg.message.imageMessage.caption || '请描述这张图片'}\n\n[图片路径: ${filepath}]`;
        } else {
          text = '[图片下载失败]';
        }
      } else if (msg.message.audioMessage || msg.message.voiceMessage) {
        const buffer = await downloadMediaToBuffer(sock, msg);
        if (buffer) {
          text = await transcribeAudio({
            buffer,
            mediaDir,
            apiKey: config.siliconflowKey
          });
        } else {
          text = '[语音消息下载失败]';
        }
      }

      if (!text) return;
      if (sentToWA.has(text)) {
        sentToWA.delete(text);
        return;
      }

      const command = parseCommand(text);
      
      // Retrieve session for user
      await getOrCreateSession(client, state, sender);
      saveState(stateFile, state);

      if (command === 'new') {
        try {
          const newSession = await client.createSession();
          state.users[sender].sessionId = newSession.id;
          state.users[sender].lastIndex = -1;
          saveState(stateFile, state);
          logger.info({ sessionId: newSession.id, user: sender }, 'new session created');
          await sock.sendMessage(sender, { text: `✅ 已创建新会话\n🆕 Session: ${newSession.id}` });
        } catch (error) {
          logger.error({ error: error.message, user: sender }, 'create session failed');
          await sock.sendMessage(sender, { text: `❌ 创建失败: ${error.message}` });
        }
        return;
      }

      if (command === 'help') {
        await sock.sendMessage(sender, { text: buildHelpMessage(version) });
        return;
      }

      state.processingUsers.add(sender);
      try {
        await sock.sendPresenceUpdate('composing', sender);
        const enhancedText = enrichTextWithSkillHint(text);
        const parts = [{ type: 'text', text: enhancedText.startsWith('📱') ? enhancedText : `📱 ${enhancedText}` }];
        
        // Use user's sessionId
        const currentSessionId = state.users[sender].sessionId;
        const msgCountBefore = (await client.listMessages(currentSessionId)).length;
        await client.sendPromptAsync(currentSessionId, parts);

        let reply = '';
        let attempts = 0;
        const maxAttempts = 600;
        const notifyInterval = 300;
        let lastNotify = 0;
        let stuckCount = 0;
        
        // Streaming state
        let lastStreamedIndex = msgCountBefore;
        let lastStreamedLength = 0;
        let hasStreamed = false;

        while (attempts < maxAttempts) {
          await new Promise(r => setTimeout(r, 1000));
          const msgs = await client.listMessages(currentSessionId);
          
          let currentReply = null;

          for (let i = lastStreamedIndex; i < msgs.length; i++) {
            const m = msgs[i];
            
            // Only process Assistant messages for reply/streaming
            if (m.info?.role === 'assistant') {
              const msgParts = m.parts || [];
              const finish = m.info?.finish;
              
              // Extract text
              let fullText = '';
              for (const p of msgParts) {
                if (p.type === 'text' && p.text) {
                  fullText += p.text;
                }
              }

              // Streaming Logic
              if (fullText.length > lastStreamedLength) {
                const chunk = fullText.slice(lastStreamedLength);
                // Send chunk if large enough or finished
                if (chunk.length > 20 || (finish === 'stop' && chunk.length > 0)) {
                  await sock.sendMessage(sender, { text: chunk });
                  lastStreamedLength = fullText.length;
                  sentToWA.add(fullText); // Avoid pollMessages duplicates
                  hasStreamed = true;
                }
              }
              
              if (finish === 'stop') {
                // This message is fully done
                currentReply = fullText;
                // Move to next message
                lastStreamedIndex = i + 1;
                lastStreamedLength = 0;
              } else {
                // Not finished, check tools
                const tools = msgParts.filter(p => p.type === 'tool');
                // Check for tools requiring approval
                const approvalTools = tools.filter(p => p.state?.status === 'requires_approval' || p.state?.status === 'requires_action');
                
                if (approvalTools.length > 0) {
                  const t = approvalTools[0];
                  const command = t.args?.command || t.tool_name || 'unknown command';
                  const approvalMsg = `⚠️ OpenCode 请求执行命令/操作:\n\`\`\`\n${command}\n\`\`\`\n请回复任何内容以继续 (通常 OpenCode 会在后续对话中询问 Yes/No，您可以直接回复 Yes 或 No)。`;
                  
                  // Only send if we haven't sent this approval request yet
                  if (!sentToWA.has(approvalMsg)) {
                    await sock.sendMessage(sender, { text: approvalMsg });
                    sentToWA.add(approvalMsg);
                    
                    // We must BREAK the loop to allow the User to send a message.
                    // Mark as "streamed" so we don't trigger timeout logic.
                    reply = null; 
                    hasStreamed = true; 
                    
                    // Also ensure we don't get stuck in the loop
                    break; 
                  } else {
                    // Already sent, just break to avoid waiting forever
                    reply = null;
                    hasStreamed = true;
                    break;
                  }
                }

                const runningTools = tools.filter(p => p.state?.status === 'running');
                
                if (runningTools.length > 0) {
                  stuckCount++;
                  // Handle tool timeout/stuck logic if needed
                  if (stuckCount > 60) {
                    // Check for tool output if stuck too long
                    for (const t of tools) {
                      if (t.state?.status === 'completed' && t.state?.output) {
                        const output = t.state.output;
                        if (typeof output === 'string' && output.length > 10) {
                          const toolOutput = `📋 工具输出:\n\`\`\`\n${output.slice(0, 500)}\n\`\`\``;
                          await sock.sendMessage(sender, { text: toolOutput });
                          sentToWA.add(toolOutput);
                          // Consider this "progress" and reset stuck
                          stuckCount = 0;
                        }
                      }
                    }
                  }
                  break; // Wait for tools
                } else {
                  // No tools running, just generating text?
                  break; // Wait for text generation
                }
              }
            } else {
              // Skip non-assistant messages (user prompts, etc.)
              lastStreamedIndex = i + 1;
              lastStreamedLength = 0;
            }
          }
          
          // If we processed past all messages and the last one was finished
          if (lastStreamedIndex >= msgs.length) {
            // If we haven't streamed anything but we found a reply (e.g. short reply), set it.
            if (!hasStreamed && currentReply) {
              reply = currentReply;
            }
            // If we streamed everything, we are done.
            if (hasStreamed || reply) {
              break;
            }
            // If msgs.length == msgCountBefore (no new messages yet), continue waiting
          }

          attempts++;
          if (attempts >= 10) {
            if (attempts === 10 || attempts % 30 === 0) {
              await sock.sendPresenceUpdate('composing', sender);
            }
            if (attempts - lastNotify >= notifyInterval) {
              const progressMsg = buildProgressMessage(attempts, msgs, msgCountBefore);
              await sock.sendMessage(sender, { text: progressMsg });
              lastNotify = attempts;
            }
          }
        }

        await sock.sendPresenceUpdate('paused', sender);
        
        // Final send if not streamed
        if (reply && !hasStreamed) {
          sentToWA.add(reply);
          await sock.sendMessage(sender, { text: reply });
        } else if (!reply && !hasStreamed) {
          // Timeout logic
          logger.warn({ user: sender }, 'reply timeout');
          try {
            const newSession = await client.createSession();
            state.users[sender].sessionId = newSession.id;
            state.users[sender].lastIndex = -1;
            saveState(stateFile, state);
            await sock.sendMessage(sender, { text: '⏱️ 处理超时，任务可能还在继续。\n\n已创建新会话，请稍后发送新请求。' });
          } catch (error) {
            logger.error({ error: error.message, user: sender }, 'create session failed on timeout');
            await sock.sendMessage(sender, { text: '⏱️ 处理超时，请重试。' });
          }
        }

        await sock.sendPresenceUpdate('available', sender);
        const msgResAfter = await client.listMessages(currentSessionId);
        state.users[sender].lastIndex = msgResAfter.length - 1;
        saveState(stateFile, state);
      } catch (error) {
        logger.error({ error: error.message, user: sender }, 'processing error');
        try {
          await sock.sendPresenceUpdate('paused', sender);
          await sock.sendMessage(sender, { text: `❌ 错误: ${error.message}` });
        } catch (error) {
          void error;
        }
      } finally {
        try {
          await sock.sendPresenceUpdate('paused', sender);
        } catch (error) {
          void error;
        }
        if (state.processingUsers) state.processingUsers.delete(sender);
      }
    }
  });

  // 定义轮询函数
  const pollMessages = async () => {
    // Session expiry check (1 hour)
    const SESSION_EXPIRY_MS = 60 * 60 * 1000;
    const now = Date.now();
    
    if (state.users) {
      for (const jid of Object.keys(state.users)) {
        const user = state.users[jid];
        if (user.lastActivity && (now - user.lastActivity > SESSION_EXPIRY_MS)) {
          logger.info({ user: jid }, 'session expired');
          delete state.users[jid];
          saveState(stateFile, state);
        }
      }
    }

    // Iterate over all users
    const users = Object.keys(state.users || {});
    for (const userJid of users) {
      if (state.processingUsers && state.processingUsers.has(userJid)) continue;
      
      const userState = state.users[userJid];
      if (!userState || !userState.sessionId) continue;

      try {
        const msgs = await client.listMessages(userState.sessionId);
        for (let i = userState.lastIndex + 1; i < msgs.length; i++) {
          const m = msgs[i];
          const text = getTextFromMessage(m);
          if (isUserMessage(m) && text && !text.startsWith('📱')) {
            const notify = `💻 [TUI端]\n${text}`;
            sentToWA.add(text);
            await sock.sendMessage(userJid, { text: notify });
          } else if (isAssistantMessage(m) && text && text.length > 5) {
            const lastUserMsg = msgs.slice(0, i).reverse().find(isUserMessage);
            if (lastUserMsg && !getTextFromMessage(lastUserMsg).startsWith('📱')) {
              const notify = `🤖 [回复TUI]\n${text}`;
              sentToWA.add(text);
              await sock.sendMessage(userJid, { text: notify });
            }
          }
          userState.lastIndex = i;
          saveState(stateFile, state);
        }
      } catch (error) {
        void error;
      }
    }
  };

  syncTimer = setInterval(pollMessages, 2000);

  return { sock, stop, pollMessages };
}

module.exports = { startBridge };
