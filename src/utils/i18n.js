const messages = {
  en: {
    title: '🚀 WhatsApp-OpenCode Setup Wizard',
    checkOpenCode: 'Checking OpenCode installation...',
    openCodeInstalled: 'OpenCode is installed.',
    openCodeNotInstalled: 'OpenCode is not installed.',
    installOpenCode: 'OpenCode is not installed. Do you want to install it now?',
    skipInstall: 'Skipping OpenCode installation. Please install it manually.',
    installing: 'Installing OpenCode...',
    installSuccess: 'OpenCode installed successfully.',
    installFail: 'Failed to install OpenCode.',
    checkService: 'Checking if OpenCode is running at {url}...',
    serviceRunning: 'OpenCode service is running.',
    serviceNotReachable: 'OpenCode service is not reachable.',
    startService: 'OpenCode service does not seem to be running. Do you want to start it?',
    startingService: 'Starting OpenCode service...',
    startedPm2: 'OpenCode started with pm2.',
    startedBg: 'OpenCode started in background.',
    startFail: 'Failed to start OpenCode service.',
    configTitle: '\n--- Configuration Setup ---',
    configFound: 'Configuration found in .env',
    enterUrl: 'Enter OpenCode URL:',
    hasSiliconKey: 'Do you have a SiliconFlow API Key?',
    enterSiliconKey: 'Enter SiliconFlow API Key:',
    getSiliconKey: 'Opening invitation link... Please register and get your API Key.',
    enterAllowlist: 'Enter allowed WhatsApp numbers (comma separated, e.g. +8615800937529):',
    allowlistRequired: 'Allowlist is required. Use E.164 like +8615800937529.',
    allowlistInvalid: 'Invalid allowlist number format: {value}. Use E.164 like +8615800937529.',
    configSaved: 'Configuration saved to .env',
    cannotVerify: 'Cannot verify OpenCode service. Please ensure it is running manually with "opencode serve".',
    serviceStartedNotReachable: '⚠️  OpenCode service started but is not reachable yet. Please check "opencode serve" logs.',
    nonLocalHost: 'OpenCode URL is forced to local for safety: {url}',
    openUrlFailed: 'Failed to open browser. Please open manually: {url}',
    bridgeStarting: 'Starting WhatsApp Bridge...',
    bridgeScanQr: 'Please scan the QR code when it appears. Press Ctrl+C to stop after login.',
    greetingSent: 'Greeting sent to {target}.',
    greetingFailed: 'Failed to send greeting to {target}: {error}',
    bridgeStartFailed: 'Failed to start bridge:',
    qrReady: 'QR code generated. Please scan to login.',
    connected: 'WhatsApp connected successfully!',
    connectionClosed: 'WhatsApp connection closed.',
    connectionClosedWithReason: 'WhatsApp connection closed. Reason: {reason}',
    loggedOutRescan: 'Logged out. Clearing auth and regenerating QR...',
    reconnecting: 'Reconnecting to WhatsApp...',
    serviceStartGreeting: 'wao service started successfully.',
    connectionGreeting: 'WhatsApp connection is ready. Welcome!',
    serviceStarting: 'Starting background service...',
    serviceStarted: 'Service started successfully.',
    serviceStartFailed: 'Failed to start service: {message}',
    serviceStopping: 'Stopping background service...',
    serviceStopped: 'Service stopped successfully.',
    serviceStopFailed: 'Failed to stop service: {message}',
    serviceStatusRunning: 'Service is running.',
    serviceStatusStopped: 'Service is not running.',
    serviceStatusUnknown: 'Service status is unknown.',
    serviceLogsTitle: 'Service logs (last {lines} lines):',
    serviceLogsMissing: 'Log file not found: {path}',
    configTitleCli: 'Current configuration:',
    configMissing: 'Configuration is missing. Please run "wao setup" first.',
    abortSetup: 'OpenCode is not reachable. Abort setup?',
    setupAborted: 'Setup aborted. Please fix OpenCode service and try again.',
    setupComplete: '\n✅ Setup completed!\n'
  },
  zh: {
    title: '🚀 WhatsApp-OpenCode 配置向导',
    checkOpenCode: '正在检查 OpenCode 安装...',
    openCodeInstalled: 'OpenCode 已安装。',
    openCodeNotInstalled: 'OpenCode 未安装。',
    installOpenCode: '检测到未安装 OpenCode。是否立即安装？',
    skipInstall: '跳过安装。请稍后手动安装 OpenCode。',
    installing: '正在安装 OpenCode...',
    installSuccess: 'OpenCode 安装成功。',
    installFail: 'OpenCode 安装失败。',
    checkService: '正在检查 OpenCode 服务状态 ({url})...',
    serviceRunning: 'OpenCode 服务运行正常。',
    serviceNotReachable: '无法连接到 OpenCode 服务。',
    startService: 'OpenCode 服务未运行。是否立即启动？',
    startingService: '正在启动 OpenCode 服务...',
    startedPm2: 'OpenCode 已通过 PM2 启动。',
    startedBg: 'OpenCode 已在后台启动。',
    startFail: '启动 OpenCode 服务失败。',
    configTitle: '\n--- 配置设置 ---',
    configFound: '检测到现有配置 (.env)',
    enterUrl: '请输入 OpenCode API 地址:',
    hasSiliconKey: '您是否有硅基流动 (SiliconFlow) 的 API Key？',
    enterSiliconKey: '请输入硅基流动 API Key:',
    getSiliconKey: '正在打开邀请链接... 请注册并获取您的 API Key。',
    enterAllowlist: '请输入允许使用的 WhatsApp 号码 (逗号分隔，例如 +8615800937529):',
    allowlistRequired: '必须配置白名单号码，请使用国际号码格式，例如 +8615800937529。',
    allowlistInvalid: '白名单号码格式不正确: {value}，请使用国际号码格式，例如 +8615800937529。',
    configSaved: '配置已保存到 .env',
    cannotVerify: '无法验证 OpenCode 服务。请手动运行 "opencode serve" 检查。',
    serviceStartedNotReachable: '⚠️  OpenCode 服务已启动但暂时无法连接。请检查日志。',
    nonLocalHost: '为安全起见，已强制使用本地 OpenCode 地址: {url}',
    openUrlFailed: '无法自动打开浏览器，请手动访问: {url}',
    bridgeStarting: '正在启动 WhatsApp Bridge...',
    bridgeScanQr: '二维码出现后请扫码登录，登录完成后可按 Ctrl+C 退出。',
    greetingSent: '已发送问候消息给 {target}。',
    greetingFailed: '发送问候消息给 {target} 失败: {error}',
    bridgeStartFailed: '启动 Bridge 失败:',
    qrReady: '二维码已生成，请扫码登录。',
    connected: 'WhatsApp 已连接成功！',
    connectionClosed: 'WhatsApp 连接已断开。',
    connectionClosedWithReason: 'WhatsApp 连接已断开（原因: {reason}）。',
    loggedOutRescan: '登录已失效，正在清理认证并重新生成二维码...',
    reconnecting: '正在尝试重连 WhatsApp...',
    serviceStartGreeting: 'wao 服务启动成功，可以开始使用了。',
    connectionGreeting: 'WhatsApp 已连接成功，欢迎使用 wao。',
    serviceStarting: '正在启动后台服务...',
    serviceStarted: '后台服务启动成功。',
    serviceStartFailed: '后台服务启动失败: {message}',
    serviceStopping: '正在停止后台服务...',
    serviceStopped: '后台服务已停止。',
    serviceStopFailed: '后台服务停止失败: {message}',
    serviceStatusRunning: '服务正在运行。',
    serviceStatusStopped: '服务未运行。',
    serviceStatusUnknown: '无法确定服务状态。',
    serviceLogsTitle: '服务日志（最近 {lines} 行）:',
    serviceLogsMissing: '日志文件不存在: {path}',
    configTitleCli: '当前配置:',
    configMissing: '未找到配置，请先运行 "wao setup"。',
    abortSetup: 'OpenCode 服务不可用。是否终止设置？',
    setupAborted: '设置已终止。请修复 OpenCode 服务后重试。',
    setupComplete: '\n✅ 设置完成！\n'
  }
};

let currentLang = 'en';

function setLanguage(lang) {
  if (messages[lang]) {
    currentLang = lang;
  }
}

function setLanguageFromEnv() {
  const env = `${process.env.LC_ALL || ''} ${process.env.LANG || ''}`.toLowerCase();
  if (env.includes('zh')) {
    setLanguage('zh');
  }
}

function t(key, params = {}) {
  let msg = messages[currentLang][key] || messages['en'][key] || key;
  Object.keys(params).forEach(k => {
    msg = msg.replace(`{${k}}`, params[k]);
  });
  return msg;
}

module.exports = { setLanguage, setLanguageFromEnv, t };
