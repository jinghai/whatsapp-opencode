const pm2 = require('pm2');
const path = require('path');
const { start, stop } = require('../src/daemon/manager');

jest.mock('pm2');

describe('Daemon Manager', () => {
  test('start should call pm2.start', async () => {
    pm2.connect.mockImplementation((cb) => cb(null));
    pm2.start.mockImplementation((opts, cb) => cb(null, []));
    pm2.disconnect.mockImplementation(() => {});

    await start();
    expect(pm2.start).toHaveBeenCalled();
  });

  test('start should use src/index.js script', async () => {
    pm2.connect.mockImplementation((cb) => cb(null));
    pm2.start.mockImplementation((opts, cb) => cb(null, []));
    pm2.disconnect.mockImplementation(() => {});

    await start();
    const callArgs = pm2.start.mock.calls[0][0];
    expect(callArgs.script).toBe(path.resolve(__dirname, '../src/index.js'));
  });

  test('start should set cwd to current working directory', async () => {
    pm2.connect.mockImplementation((cb) => cb(null));
    pm2.start.mockImplementation((opts, cb) => cb(null, []));
    pm2.disconnect.mockImplementation(() => {});

    await start();
    const callArgs = pm2.start.mock.calls[0][0];
    expect(callArgs.cwd).toBe(process.cwd());
  });

  test('start should skip interactive setup in daemon mode', async () => {
    pm2.connect.mockImplementation((cb) => cb(null));
    pm2.start.mockImplementation((opts, cb) => cb(null, []));
    pm2.disconnect.mockImplementation(() => {});

    await start();
    const callArgs = pm2.start.mock.calls[0][0];
    expect(callArgs.env).toMatchObject({ SKIP_SETUP: 'true' });
  });

  test('stop should call pm2.stop', async () => {
    pm2.connect.mockImplementation((cb) => cb(null));
    pm2.stop.mockImplementation((name, cb) => cb(null));
    pm2.disconnect.mockImplementation(() => {});

    await stop();
    expect(pm2.stop).toHaveBeenCalledWith('whatsapp-opencode', expect.anything());
  });
});
