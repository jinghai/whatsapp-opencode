const inquirer = require('inquirer');
const ora = require('ora');
const chalk = require('chalk');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

const { setLanguage, t } = require('../utils/i18n');
let openModule = null;
try {
  openModule = require('open');
} catch (e) {
  openModule = null;
}

const DEFAULT_OPENCODE_URL = 'http://127.0.0.1:4096';
const DEFAULT_PORT = 4096;
const DEFAULT_HOSTNAME = '127.0.0.1';

async function checkOpenCodeInstalled() {
  const spinner = ora(t('checkOpenCode')).start();
  try {
    await execAsync('opencode --version');
    spinner.succeed(t('openCodeInstalled'));
    return true;
  } catch (error) {
    spinner.fail(t('openCodeNotInstalled'));
    return false;
  }
}

async function installOpenCode() {
  const spinner = ora(t('installing')).start();
  try {
    await execAsync('npm install -g opencode');
    spinner.succeed(t('installSuccess'));
  } catch (error) {
    spinner.fail(t('installFail'));
    console.error(error);
    throw error;
  }
}

function buildServiceCheckUrl(url) {
  const base = url.replace(/\/+$/, '');
  return `${base}/global/health`;
}

function isLocalHost(hostname) {
  return hostname === '127.0.0.1' || hostname === 'localhost';
}

function normalizeLocalUrl(url) {
  try {
    const parsed = new URL(url);
    const port = parsed.port ? Number(parsed.port) : DEFAULT_PORT;
    if (!isLocalHost(parsed.hostname)) {
      return `http://${DEFAULT_HOSTNAME}:${port}`;
    }
    return url;
  } catch (e) {
    return DEFAULT_OPENCODE_URL;
  }
}

function getPortFromUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.port ? Number(parsed.port) : DEFAULT_PORT;
  } catch (e) {
    return DEFAULT_PORT;
  }
}

function resolveOpenFunction() {
  if (typeof openModule === 'function') return openModule;
  if (openModule && typeof openModule.default === 'function') return openModule.default;
  return null;
}

/**
 * 校验白名单号码输入，支持国际号码格式与多号码逗号分隔
 */
function validateAllowlistInput(input) {
  const items = String(input)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
  if (items.length === 0) {
    return t('allowlistRequired');
  }
  const invalid = items.find(item => !/^\+?\d{6,15}$/.test(item));
  if (invalid) {
    return t('allowlistInvalid', { value: invalid });
  }
  return true;
}

async function openUrl(url) {
  const openFn = resolveOpenFunction();
  if (openFn) {
    await openFn(url);
    return true;
  }
  try {
    if (process.platform === 'darwin') {
      await execAsync(`open "${url}"`);
      return true;
    }
    if (process.platform === 'win32') {
      await execAsync(`start "" "${url}"`);
      return true;
    }
    await execAsync(`xdg-open "${url}"`);
    return true;
  } catch (error) {
    void error;
    return false;
  }
}

async function checkOpenCodeRunning(url, options = {}) {
  const { silent = false } = options;
  const spinner = silent ? null : ora(t('checkService', { url })).start();
  try {
    const axios = require('axios');
    await axios.get(buildServiceCheckUrl(url));
    if (!silent) spinner.succeed(t('serviceRunning'));
    return true;
  } catch (error) {
    if (!silent) spinner.warn(t('serviceNotReachable'));
    return false;
  }
}

async function waitForOpenCodeReady(url, options = {}) {
  const { retries = 5, intervalMs = 2000 } = options;
  let remaining = retries;
  while (remaining > 0) {
    const isRunning = await checkOpenCodeRunning(url, { silent: true });
    if (isRunning) return true;
    remaining -= 1;
    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
  return false;
}

async function startOpenCodeService(opencodeUrl) {
  const spinner = ora(t('startingService')).start();
  try {
    const port = getPortFromUrl(opencodeUrl);
    // Try to start with pm2 if available
    try {
      await execAsync('pm2 --version');
      // Use 'opencode serve' which starts the server as per documentation
      await execAsync(`pm2 start "opencode serve --hostname ${DEFAULT_HOSTNAME} --port ${port}" --name opencode-service`);
      await execAsync('pm2 save');
      spinner.succeed(t('startedPm2'));
      
      return 'pm2';
    } catch (e) {
      // Fallback to background process
      const { spawn } = require('child_process');
      const child = spawn('opencode', ['serve', '--hostname', DEFAULT_HOSTNAME, '--port', String(port)], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
      spinner.succeed(t('startedBg'));
      return 'background';
    }
  } catch (error) {
    spinner.fail(t('startFail'));
    console.error(error);
    return false;
  }
}

async function setupConfig() {
  const envPath = path.resolve(process.cwd(), '.env');
  const currentConfig = {};
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) currentConfig[key.trim()] = value.trim();
    });
    
    // If config seems valid, ask if user wants to reconfigure
    if (currentConfig.OPENCODE_URL && currentConfig.SILICONFLOW_KEY && currentConfig.ALLOWLIST) {
      console.log(chalk.green(t('configFound')));
      return {
        opencodeUrl: currentConfig.OPENCODE_URL,
        siliconflowKey: currentConfig.SILICONFLOW_KEY,
        allowlist: (currentConfig.ALLOWLIST || '').split(',').map(s => s.trim())
      };
    }
  }

  console.log(chalk.blue(t('configTitle')));

  const answers1 = await inquirer.prompt([
    {
      type: 'input',
      name: 'opencodeUrl',
      message: t('enterUrl'),
      default: currentConfig.OPENCODE_URL || DEFAULT_OPENCODE_URL
    },
    {
      type: 'confirm',
      name: 'hasSiliconKey',
      message: t('hasSiliconKey'),
      default: !!currentConfig.SILICONFLOW_KEY
    }
  ]);

  const normalizedUrl = normalizeLocalUrl(answers1.opencodeUrl);
  if (normalizedUrl !== answers1.opencodeUrl) {
    console.log(chalk.yellow(t('nonLocalHost', { url: normalizedUrl })));
  }

  if (!answers1.hasSiliconKey) {
    console.log(chalk.yellow(t('getSiliconKey')));
    const opened = await openUrl('https://cloud.siliconflow.cn/i/ouQu1EpG');
    if (!opened) {
      console.log(chalk.yellow(t('openUrlFailed', { url: 'https://cloud.siliconflow.cn/i/ouQu1EpG' })));
    }
  }

  const answers2 = await inquirer.prompt([
    {
      type: 'input',
      name: 'siliconflowKey',
      message: t('enterSiliconKey'),
      default: currentConfig.SILICONFLOW_KEY,
      validate: input => input ? true : 'API Key is required'
    },
    {
      type: 'input',
      name: 'allowlist',
      message: t('enterAllowlist'),
      default: currentConfig.ALLOWLIST,
      validate: validateAllowlistInput
    }
  ]);

  const answers = { ...answers1, ...answers2, opencodeUrl: normalizedUrl };

  const newEnvContent = Object.entries({
    OPENCODE_URL: answers.opencodeUrl,
    SILICONFLOW_KEY: answers.siliconflowKey,
    ALLOWLIST: answers.allowlist,
    WORKING_DIR: currentConfig.WORKING_DIR || process.cwd(),
    DEBUG: currentConfig.DEBUG || 'false'
  }).map(([k, v]) => `${k}=${v}`).join('\n');

  fs.writeFileSync(envPath, newEnvContent);
  console.log(chalk.green(t('configSaved')));
  
  return {
    opencodeUrl: answers.opencodeUrl,
    siliconflowKey: answers.siliconflowKey,
    allowlist: answers.allowlist ? answers.allowlist.split(',').map(s => s.trim()) : []
  };
}

async function runSetup() {
  console.log(chalk.bold.cyan('\n🚀 WhatsApp-OpenCode Setup Wizard\n'));

  // 0. Language Selection
  const { lang } = await inquirer.prompt([{
    type: 'list',
    name: 'lang',
    message: 'Select Language / 选择语言',
    choices: [
      { name: 'English', value: 'en' },
      { name: '中文', value: 'zh' }
    ],
    default: 'en'
  }]);
  setLanguage(lang);
  console.log(chalk.bold.cyan(`\n${t('title')}\n`));

  // 1. Check OpenCode Installation
  const isInstalled = await checkOpenCodeInstalled();
  if (!isInstalled) {
    const { install } = await inquirer.prompt([{
      type: 'confirm',
      name: 'install',
      message: t('installOpenCode'),
      default: true
    }]);
    
    if (install) {
      await installOpenCode();
    } else {
      console.log(chalk.yellow(t('skipInstall')));
    }
  }

  // 2. Configure
  const config = await setupConfig();

  // 3. Check Service Status
  const isRunning = await checkOpenCodeRunning(config.opencodeUrl);
  if (!isRunning) {
    const mode = await startOpenCodeService(config.opencodeUrl);
    if (!mode) {
      console.log(chalk.red(t('cannotVerify')));
    } else {
      const isReady = await waitForOpenCodeReady(config.opencodeUrl, { retries: 5, intervalMs: 2000 });
      if (!isReady) {
        console.log(chalk.red(t('serviceStartedNotReachable')));
        const { abort } = await inquirer.prompt([{
          type: 'confirm',
          name: 'abort',
          message: t('abortSetup'),
          default: true
        }]);
        
        if (abort) {
          console.log(chalk.yellow(t('setupAborted')));
          process.exit(1);
        }
      } else {
        await checkOpenCodeRunning(config.opencodeUrl);
      }
    }
  }

  console.log(chalk.green(t('setupComplete')));
  return config;
}

module.exports = { runSetup };
