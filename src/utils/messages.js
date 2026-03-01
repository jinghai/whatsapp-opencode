/**
 * 判断是否是用户文本消息
 */
function isUserMessage(msg) {
  const parts = msg.parts || [];
  return parts.length === 1 && parts[0]?.type === 'text';
}

/**
 * 判断是否是助手消息
 */
function isAssistantMessage(msg) {
  const parts = msg.parts || [];
  return parts.some(p => p.type === 'step-start' || p.type === 'reasoning');
}

/**
 * 从消息结构中提取文本
 */
function getTextFromMessage(msg) {
  for (const p of msg.parts || []) {
    if (p.type === 'text' && p.text) return p.text;
  }
  return '';
}

/**
 * 格式化任务进度信息
 */
function formatProgressInfo(msgs, msgCountBefore) {
  const lines = [];
  let currentTool = null;
  let reasoningText = '';

  for (let i = msgs.length - 1; i >= msgCountBefore; i--) {
    const m = msgs[i];
    if (m.info?.role === 'assistant') {
      const parts = m.parts || [];
      for (const p of parts) {
        if (p.type === 'reasoning' && p.text) {
          const trimmed = p.text.trim();
          if (trimmed.length > 200) {
            reasoningText = `${trimmed.slice(-200)}...`;
          } else {
            reasoningText = trimmed;
          }
        }
        if (p.type === 'tool') {
          const status = p.state?.status;
          const rawToolName = (p.tool || '').trim();
          const toolName = rawToolName ? rawToolName : 'unknown';
          const input = p.state?.input;
          if (status === 'running' && !currentTool) {
            const cmd = (input?.command || input?.query || '').trim();
            const shortCmd = cmd.length > 50 ? `${cmd.slice(0, 50)}...` : cmd;
            currentTool = `• 正在执行: ${toolName}${shortCmd ? ` - ${shortCmd}` : ''}`;
          }
        }
      }
    }
  }

  if (currentTool) lines.push(currentTool);
  if (reasoningText) lines.push(`💭 ${reasoningText}`);
  return lines.length > 0 ? lines.join('\n') : null;
}

/**
 * 构建进度提示文案
 */
function buildProgressMessage(attempts, msgs, msgCountBefore) {
  const elapsed = Math.floor(attempts / 60);
  const timeStr = elapsed >= 60 ? `${Math.floor(elapsed / 60)}小时${elapsed % 60}分钟` : `${elapsed}分钟`;
  const progressInfo = formatProgressInfo(msgs, msgCountBefore);
  if (progressInfo) {
    return `🔄 处理中 (${timeStr})\n\n📋 当前进度:\n${progressInfo}\n\n⏳ 对方正在输入... (已等待${timeStr})`;
  }
  return `🔄 正在处理中... (已等待${timeStr})\n\n⏳ 对方正在输入...`;
}

module.exports = {
  isUserMessage,
  isAssistantMessage,
  getTextFromMessage,
  formatProgressInfo,
  buildProgressMessage
};
