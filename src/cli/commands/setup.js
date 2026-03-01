const chalk = require('chalk');
const { runSetup } = require('../../setup');
const { loadConfig } = require('../../config');
const { startBridge } = require('../../bridge/sync');
const { start } = require('../../daemon/manager');
const { version } = require('../../../package.json');
const { t } = require('../../utils/i18n');

async function startWithTimeout() {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('start timeout')), 15000);
  });
  try {
    await Promise.race([start(), timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function setup() {
  // runSetup will exit(1) if verification fails
  await runSetup();
  
  // If we reach here, setup is complete and services are verified
  try {
    console.log(chalk.cyan(`\n${t('bridgeStarting')}`));
    console.log(chalk.yellow(`${t('bridgeScanQr')}\n`));
    
    // Load config (setup ensures .env exists)
    const config = loadConfig();
    let started = false;
    const { stop } = await startBridge(config, version, {
      skipGreeting: true,
      onConnected: async () => {
        if (started) return;
        started = true;
        let exitCode = 0;
        try {
          await startWithTimeout();
        } catch (error) {
          exitCode = 1;
          console.error(chalk.red(t('serviceStartFailed')), error.message);
        } finally {
          stop();
          process.exit(exitCode);
        }
      }
    });
  } catch (error) {
    console.error(chalk.red(t('bridgeStartFailed')), error.message);
  }
}

module.exports = setup;
