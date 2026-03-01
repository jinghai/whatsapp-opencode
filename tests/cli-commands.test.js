jest.mock('../src/daemon/manager', () => ({
  start: jest.fn(),
  stop: jest.fn(),
  describe: jest.fn()
}));

jest.mock('../src/utils/i18n', () => ({
  setLanguageFromEnv: jest.fn(),
  t: jest.fn((key, params = {}) => {
    if (key === 'serviceStartFailed') return `start failed: ${params.message}`;
    if (key === 'serviceStopFailed') return `stop failed: ${params.message}`;
    if (key === 'serviceLogsTitle') return `logs ${params.lines}`;
    if (key === 'serviceLogsMissing') return `missing ${params.path}`;
    if (key === 'configTitleCli') return 'config';
    if (key === 'configMissing') return 'missing-config';
    if (key === 'serviceStatusRunning') return 'running';
    if (key === 'serviceStatusStopped') return 'stopped';
    if (key === 'serviceStatusUnknown') return 'unknown';
    if (key === 'serviceStarted') return 'started';
    if (key === 'serviceStopped') return 'stopped-ok';
    if (key === 'serviceStarting') return 'starting';
    if (key === 'serviceStopping') return 'stopping';
    return key;
  })
}));

jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn(),
    fail: jest.fn()
  }));
});

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}));

jest.mock('dotenv', () => ({
  config: jest.fn()
}));

const fs = require('fs');
const { start, stop, describe: describeDaemon } = require('../src/daemon/manager');

describe('CLI Commands', () => {
  const originalEnv = process.env;
  let logSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    process.env = originalEnv;
  });

  test('start command should start daemon', async () => {
    start.mockResolvedValue([]);
    const cmd = require('../src/cli/commands/start');
    await cmd();
    expect(start).toHaveBeenCalled();
  });

  test('stop command should stop daemon', async () => {
    stop.mockResolvedValue();
    const cmd = require('../src/cli/commands/stop');
    await cmd();
    expect(stop).toHaveBeenCalled();
  });

  test('status command should print running status', async () => {
    describeDaemon.mockResolvedValue([{ pm2_env: { status: 'online' } }]);
    const cmd = require('../src/cli/commands/status');
    await cmd();
    expect(logSpy).toHaveBeenCalledWith('running');
  });

  test('status command should print unknown when describe fails', async () => {
    describeDaemon.mockRejectedValue(new Error('boom'));
    const cmd = require('../src/cli/commands/status');
    await cmd();
    expect(logSpy).toHaveBeenCalledWith('unknown');
  });

  test('logs command should print log tail', async () => {
    describeDaemon.mockResolvedValue([
      { pm2_env: { out_log_path: '/tmp/out.log', err_log_path: '/tmp/err.log' } }
    ]);
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('a\nb\nc\n');

    const cmd = require('../src/cli/commands/logs');
    await cmd();

    expect(fs.readFileSync).toHaveBeenCalledTimes(2);
    expect(logSpy).toHaveBeenCalledWith('logs 200');
  });

  test('config command should print masked config', async () => {
    process.env.OPENCODE_URL = 'http://localhost:4096';
    process.env.SILICONFLOW_KEY = '1234567890';
    process.env.ALLOWLIST = '8613800138000';
    process.env.DEBUG = 'true';

    const cmd = require('../src/cli/commands/config');
    await cmd();

    const output = logSpy.mock.calls.map(call => String(call[0])).join('\n');
    expect(output).toContain('config');
    expect(output).toContain('SILICONFLOW_KEY=1234****7890');
  });
});
