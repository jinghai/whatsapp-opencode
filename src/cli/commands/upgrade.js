const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const ora = require('ora');
const chalk = require('chalk');
const { stopDaemon, startDaemon } = require('../../daemon/manager');

async function upgradeCommand() {
  const spinner = ora('Checking for updates...').start();
  
  try {
    const projectRoot = path.resolve(__dirname, '../../..');
    const isGitRepo = fs.existsSync(path.join(projectRoot, '.git'));
    
    // Stop service before upgrade
    try {
      spinner.text = 'Stopping service...';
      await stopDaemon();
    } catch (e) {
      // Ignore if not running
    }

    if (isGitRepo) {
      spinner.text = 'Pulling latest changes from git...';
      execSync('git pull origin main', { cwd: projectRoot, stdio: 'ignore' });
      spinner.text = 'Installing dependencies...';
      execSync('npm install', { cwd: projectRoot, stdio: 'ignore' });
    } else {
      spinner.text = 'Upgrading via npm...';
      execSync('npm install -g whatsapp-opencode@latest', { stdio: 'ignore' });
    }

    spinner.succeed(chalk.green('Upgrade completed successfully!'));
    
    // Restart service
    spinner.start('Restarting service...');
    await startDaemon();
    spinner.succeed(chalk.green('Service restarted.'));
    
  } catch (error) {
    spinner.fail(chalk.red(`Upgrade failed: ${error.message}`));
    process.exit(1);
  }
}

module.exports = upgradeCommand;
