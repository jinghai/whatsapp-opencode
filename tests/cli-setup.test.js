jest.mock('../src/setup', () => ({
  runSetup: jest.fn().mockResolvedValue()
}));

jest.mock('../src/config', () => ({
  loadConfig: jest.fn().mockReturnValue({
    opencodeUrl: 'http://localhost:3000',
    siliconflowKey: 'sk-test',
    allowlist: [],
    workingDir: '/tmp/wa-bridge',
    debug: false
  })
}));

jest.mock('../src/bridge/sync', () => ({
  startBridge: jest.fn()
}));

jest.mock('../src/daemon/manager', () => ({
  start: jest.fn().mockResolvedValue()
}));

const { runSetup } = require('../src/setup');
const { loadConfig } = require('../src/config');
const { startBridge } = require('../src/bridge/sync');
const { start } = require('../src/daemon/manager');

describe('CLI setup command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('连接成功后应启动后台服务并退出', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const stopMock = jest.fn();
    let capturedOnConnected;
    startBridge.mockImplementation(async (config, version, options) => {
      capturedOnConnected = options?.onConnected;
      return { stop: stopMock };
    });

    const setupCommand = require('../src/cli/commands/setup');
    await setupCommand();
    await capturedOnConnected();

    expect(runSetup).toHaveBeenCalled();
    expect(loadConfig).toHaveBeenCalled();
    expect(start).toHaveBeenCalled();
    expect(stopMock).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
    exitSpy.mockRestore();
  });

  test('后台服务启动失败时应退出并停止桥接', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    const stopMock = jest.fn();
    start.mockRejectedValueOnce(new Error('start failed'));
    let capturedOnConnected;
    startBridge.mockImplementation(async (config, version, options) => {
      capturedOnConnected = options?.onConnected;
      return { stop: stopMock };
    });

    const setupCommand = require('../src/cli/commands/setup');
    await setupCommand();
    await capturedOnConnected();

    expect(start).toHaveBeenCalled();
    expect(stopMock).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
