const { loadConfig } = require('./config');
const { startBridge } = require('./bridge/sync');
const { runSetup } = require('./setup');
const { createLogger } = require('./utils/logger');
const path = require('path');

/**
 * 应用入口
 */
async function main() {
  // Run interactive setup/checks only if not skipped
  if (process.env.SKIP_SETUP !== 'true') {
    await runSetup();
  }
  
  // Load config (setup ensures .env exists or handles it)
  const config = loadConfig();
  const version = require('../package.json').version;
  await startBridge(config, version);
}

main().catch(error => {
  const workingDir = process.env.WORKING_DIR ? path.resolve(process.env.WORKING_DIR) : process.cwd();
  try {
    const logger = createLogger(workingDir, { sync: true });
    logger.error({ err: error }, 'Startup failed');
  } catch (e) {
    console.error('Failed to write to log file:', e);
  }
  console.error('启动失败:', error);
  process.exit(1);
});
