const path = require('path');
const dotenv = require('dotenv');

/**
 * 加载并校验运行时配置
 */
function loadConfig() {
  if (process.env.NODE_ENV !== 'test') {
    dotenv.config();
  }
  const opencodeUrl = process.env.OPENCODE_URL;
  const siliconflowKey = process.env.SILICONFLOW_KEY;
  const allowlist = (process.env.ALLOWLIST || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
  const workingDir = process.env.WORKING_DIR ? path.resolve(process.env.WORKING_DIR) : process.cwd();
  const debug = String(process.env.DEBUG).toLowerCase() === 'true';

  if (!opencodeUrl) {
    throw new Error('缺少必要配置: OPENCODE_URL');
  }
  
  if (!siliconflowKey) {
    console.warn('警告: 未配置 SILICONFLOW_KEY，语音转录功能将不可用');
  }
  
  if (!allowlist || allowlist.length === 0) {
    throw new Error('缺少必要配置: ALLOWLIST');
  }

  return {
    opencodeUrl,
    siliconflowKey,
    allowlist,
    workingDir,
    debug
  };
}

module.exports = { loadConfig };
