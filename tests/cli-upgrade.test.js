const upgradeCommand = require('../src/cli/commands/upgrade');
const { stopDaemon, startDaemon } = require('../src/daemon/manager');
const child_process = require('child_process');
const fs = require('fs');
const ora = require('ora');

// Mocks
jest.mock('../src/daemon/manager', () => ({
  stopDaemon: jest.fn(),
  startDaemon: jest.fn()
}));
jest.mock('child_process');
jest.mock('fs');
jest.mock('ora', () => {
  const spinner = {
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    text: ''
  };
  return jest.fn(() => spinner);
});

describe('CLI upgrade command', () => {
  let mockExit;

  beforeAll(() => {
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterAll(() => {
    mockExit.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should upgrade via git when in a git repo', async () => {
    // Mock git repo check
    fs.existsSync.mockReturnValue(true);
    
    await upgradeCommand();

    expect(stopDaemon).toHaveBeenCalled();
    expect(child_process.execSync).toHaveBeenCalledWith('git pull origin main', expect.anything());
    expect(child_process.execSync).toHaveBeenCalledWith('npm install', expect.anything());
    expect(startDaemon).toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();
  });

  test('should upgrade via npm when not in a git repo', async () => {
    // Mock no git repo
    fs.existsSync.mockReturnValue(false);
    
    await upgradeCommand();

    expect(stopDaemon).toHaveBeenCalled();
    expect(child_process.execSync).toHaveBeenCalledWith('npm install -g whatsapp-opencode@latest', expect.anything());
    expect(startDaemon).toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();
  });

  test('should handle stopDaemon failure gracefully', async () => {
    fs.existsSync.mockReturnValue(false);
    stopDaemon.mockRejectedValue(new Error('Stop failed'));

    await upgradeCommand();

    // Should continue despite stop failure
    expect(child_process.execSync).toHaveBeenCalled();
    expect(startDaemon).toHaveBeenCalled();
  });

  test('should exit on upgrade failure', async () => {
    fs.existsSync.mockReturnValue(false);
    
    // We need to make the first execSync throw.
    // However, the function calls execSync.
    // Let's use mockImplementationOnce
    
    // Need to require the module to mock execSync properly?
    // The module is already required in the test file, but `upgradeCommand`
    // uses the destructured `execSync` from `child_process`.
    // Since we mocked `child_process`, it should work.
    
    const execSyncMock = child_process.execSync;
    execSyncMock.mockImplementation(() => {
        throw new Error('Upgrade failed');
    });

    await upgradeCommand();

    expect(mockExit).toHaveBeenCalledWith(1);
    // startDaemon should NOT be called if upgrade failed
    expect(startDaemon).not.toHaveBeenCalled();
  });
});
