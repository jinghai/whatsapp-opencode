/**
 * 解析命令
 */
function parseCommand(text) {
  const cmd = text.trim().toLowerCase();
  if (cmd === '/new' || cmd === '/reset') return 'new';
  if (cmd === '/help' || cmd === '/h') return 'help';
  return null;
}

/**
 * 识别任务类型
 */
function detectTaskType(text) {
  const skillKeywords = {
    brainstorming: ['想法', '设计', '规划', 'brainstorm', 'idea', 'design', 'plan', '如何实现', '方案'],
    debugging: ['错误', 'bug', '报错', 'debug', 'error', '问题', '不工作', '失败'],
    tdd: ['测试', 'test', 'tdd', '单元测试', 'spec'],
    'code-review': ['审查', 'review', '检查代码', '优化'],
    git: ['提交', 'commit', 'push', 'merge', 'pr', '分支']
  };
  const textLower = text.toLowerCase();
  for (const [skill, keywords] of Object.entries(skillKeywords)) {
    if (keywords.some(kw => textLower.includes(kw))) {
      return skill;
    }
  }
  return null;
}

/**
 * 在文本中追加技能提示
 */
function enrichTextWithSkillHint(text) {
  const detected = detectTaskType(text);
  if (!detected) return text;
  return `[检测到${detected}任务]\n${text}`;
}

/**
 * 构建帮助信息
 */
function buildHelpMessage(version) {
  return `📖 *WhatsApp OpenCode Bridge v${version}*

🔧 *命令:*
/new - 创建新会话
/help - 显示帮助

📱 *功能:*
• 文本消息 - 直接发送
• 图片消息 - 自动识别
• 语音消息 - 自动转文字

🔗 *项目:*
github.com/jinghai/whatsapp-opencode`;
}

/**
 * 规范化电话号码（用于白名单匹配）
 * - 去除 JID 中的域名与设备后缀（如 ":8"）
 * - 仅保留数字字符
 * - 将 11 位以 1 开头的本地手机号归一化为中国区号前缀（86）
 */
function normalizePhoneNumber(value) {
  if (!value) return '';
  let raw = String(value);
  // 去除 JID 域名部分
  raw = raw.split('@')[0];
  // 去除 WhatsApp 多设备标识（如 :8）
  raw = raw.split(':')[0];
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.length === 11 && digits.startsWith('1')) {
    return `86${digits}`;
  }
  return digits;
}

/**
 * 校验发送者是否在白名单内
 */
function isSenderAllowed(sender, allowlist) {
  if (!allowlist || allowlist.length === 0) return true;
  if (!sender) return false;
  const number = normalizePhoneNumber(sender.split('@')[0]);
  const normalizedAllowlist = allowlist.map(normalizePhoneNumber).filter(Boolean);
  return normalizedAllowlist.includes(number);
}

module.exports = {
  parseCommand,
  detectTaskType,
  enrichTextWithSkillHint,
  buildHelpMessage,
  isSenderAllowed
};
