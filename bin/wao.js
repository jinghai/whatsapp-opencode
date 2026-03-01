#!/usr/bin/env node
const { program } = require('commander');
const { version } = require('../package.json');
const setupCommand = require('../src/cli/commands/setup');
const startCommand = require('../src/cli/commands/start');
const stopCommand = require('../src/cli/commands/stop');
const statusCommand = require('../src/cli/commands/status');
const logsCommand = require('../src/cli/commands/logs');
const configCommand = require('../src/cli/commands/config');

program
  .name('wao')
  .description('WhatsApp OpenCode Bridge CLI')
  .version(version);

program
  .command('setup')
  .description('Run interactive setup wizard')
  .action(setupCommand);

program
  .command('start')
  .description('Start the background service')
  .action(startCommand);

program
  .command('stop')
  .description('Stop the background service')
  .action(stopCommand);

program
  .command('status')
  .description('Show service status')
  .action(statusCommand);

program
  .command('logs')
  .description('Show service logs')
  .action(logsCommand);

program
  .command('config')
  .description('Show current configuration')
  .action(configCommand);

program.parse(process.argv);
