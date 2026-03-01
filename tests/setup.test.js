const { runSetup } = require('../src/setup');
const inquirer = require('inquirer');
const { exec } = require('child_process');
const fs = require('fs');
const ora = require('ora');
const axios = require('axios');

jest.mock('inquirer');
jest.mock('child_process');
jest.mock('fs');
jest.mock('ora');
jest.mock('axios');

describe('Setup Wizard', () => {
  let mockSpinner;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock ora
    mockSpinner = {
      start: jest.fn().mockReturnThis(),
      succeed: jest.fn(),
      fail: jest.fn(),
      warn: jest.fn()
    };
    ora.mockReturnValue(mockSpinner);

    // Mock exec default success
    exec.mockImplementation((cmd, cb) => cb(null, 'stdout', 'stderr'));

    // Mock fs default
    fs.existsSync.mockReturnValue(false);
    fs.readFileSync.mockReturnValue('');
    fs.writeFileSync.mockReturnValue();
    
    // Mock axios default success
    axios.get.mockResolvedValue({ status: 200 });
  });

  test('如果 OpenCode 未安装，应提示安装', async () => {
    // Mock opencode --version failure
    exec.mockImplementation((cmd, cb) => {
      if (cmd.includes('--version')) cb(new Error('not found'));
      else cb(null, 'ok');
    });

    // Language selection
    inquirer.prompt.mockResolvedValueOnce({ lang: 'en' });
    // Install prompt
    inquirer.prompt.mockResolvedValueOnce({ install: true });
    // Config prompts (URL + hasKey)
    inquirer.prompt.mockResolvedValueOnce({ 
      opencodeUrl: 'http://localhost:3000',
      hasSiliconKey: true
    });
    // Config prompts (Key + Allowlist)
    inquirer.prompt.mockResolvedValueOnce({ 
      siliconflowKey: 'key',
      allowlist: ''
    });

    await runSetup();

    expect(inquirer.prompt).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'install' })])
    );
  });

  test('open 模块为默认导出时应可打开注册链接', async () => {
    const mockOpen = jest.fn().mockResolvedValue();
    let runSetup;
    let inquirerLocal;
    let axiosLocal;
    let oraLocal;
    let execLocal;
    let fsLocal;

    jest.isolateModules(() => {
      jest.doMock('open', () => ({ default: mockOpen }));
      inquirerLocal = require('inquirer');
      axiosLocal = require('axios');
      oraLocal = require('ora');
      execLocal = require('child_process').exec;
      fsLocal = require('fs');
      runSetup = require('../src/setup').runSetup;
    });

    const localSpinner = {
      start: jest.fn().mockReturnThis(),
      succeed: jest.fn(),
      fail: jest.fn(),
      warn: jest.fn()
    };
    oraLocal.mockReturnValue(localSpinner);
    execLocal.mockImplementation((cmd, cb) => cb(null, 'stdout', 'stderr'));
    fsLocal.existsSync.mockReturnValue(false);
    fsLocal.readFileSync.mockReturnValue('');
    fsLocal.writeFileSync.mockReturnValue();
    axiosLocal.get.mockResolvedValue({ status: 200 });

    inquirerLocal.prompt.mockResolvedValueOnce({ lang: 'en' });
    inquirerLocal.prompt.mockResolvedValueOnce({ 
      opencodeUrl: 'http://127.0.0.1:4096',
      hasSiliconKey: false
    });
    inquirerLocal.prompt.mockResolvedValueOnce({ 
      siliconflowKey: 'key',
      allowlist: ''
    });

    await runSetup();

    expect(mockOpen).toHaveBeenCalledWith('https://cloud.siliconflow.cn/i/ouQu1EpG');
    jest.dontMock('open');
  });

  test('如果服务未运行，应自动启动', async () => {
    // OpenCode installed
    exec.mockImplementation((cmd, cb) => cb(null, 'ok'));
    
    // Service check fails initially
    axios.get.mockRejectedValueOnce(new Error('Connection refused'));
    // Then succeeds after start
    axios.get.mockResolvedValue({ status: 200 });

    // Language
    inquirer.prompt.mockResolvedValueOnce({ lang: 'en' });
    // Config prompts
    inquirer.prompt.mockResolvedValueOnce({ 
      opencodeUrl: 'http://localhost:3000',
      hasSiliconKey: true
    });
    inquirer.prompt.mockResolvedValueOnce({ 
      siliconflowKey: 'key',
      allowlist: ''
    });
    
    await runSetup();

    expect(inquirer.prompt).not.toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'start' })])
    );
    expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/global/health');
    expect(exec.mock.calls.some(([cmd]) => cmd.includes('pm2 start "opencode serve --hostname 127.0.0.1 --port 3000" --name opencode-service'))).toBe(true);
  });

  test('启动后等待就绪时不重复提示不可达', async () => {
    jest.useFakeTimers();
    exec.mockImplementation((cmd, cb) => cb(null, 'ok'));

    axios.get
      .mockRejectedValueOnce(new Error('Connection refused'))
      .mockRejectedValueOnce(new Error('Not ready'))
      .mockResolvedValueOnce({ status: 200 })
      .mockResolvedValueOnce({ status: 200 });

    inquirer.prompt.mockResolvedValueOnce({ lang: 'en' });
    inquirer.prompt.mockResolvedValueOnce({ 
      opencodeUrl: 'http://localhost:3000',
      hasSiliconKey: true
    });
    inquirer.prompt.mockResolvedValueOnce({ 
      siliconflowKey: 'key',
      allowlist: ''
    });
    const setupPromise = runSetup();
    await jest.runAllTimersAsync();
    await setupPromise;

    expect(mockSpinner.warn).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  test('如果配置已存在且有效，应跳过配置提示', async () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('OPENCODE_URL=http://localhost:3000\nSILICONFLOW_KEY=key\nALLOWLIST=+8615800937529');
    
    // Language
    inquirer.prompt.mockResolvedValueOnce({ lang: 'en' });
    
    await runSetup();

    // Only language prompt should be shown
    expect(inquirer.prompt).toHaveBeenCalledTimes(1);
    expect(inquirer.prompt).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'lang' })])
    );
  });

  test('已有配置即使缺少白名单也应跳过重复配置', async () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('OPENCODE_URL=http://localhost:3000\nSILICONFLOW_KEY=key\nALLOWLIST=');
    inquirer.prompt.mockResolvedValueOnce({ lang: 'en' });

    await runSetup();

    expect(inquirer.prompt).toHaveBeenCalledTimes(1);
  });

  test('白名单输入应校验国际号码格式', async () => {
    exec.mockImplementation((cmd, cb) => cb(null, 'ok'));
    inquirer.prompt.mockResolvedValueOnce({ lang: 'en' });
    inquirer.prompt.mockResolvedValueOnce({ 
      opencodeUrl: 'http://localhost:3000',
      hasSiliconKey: true
    });
    inquirer.prompt.mockResolvedValueOnce({ 
      siliconflowKey: 'key',
      allowlist: ''
    });

    await runSetup();

    const allowlistPromptGroup = inquirer.prompt.mock.calls
      .map(call => call[0])
      .find(group => Array.isArray(group) && group.some(item => item.name === 'allowlist'));
    const allowlistPrompt = allowlistPromptGroup.find(item => item.name === 'allowlist');
    expect(allowlistPrompt.validate('+8615800937529')).toBe(true);
    expect(allowlistPrompt.validate('15800937529')).toBe(true);
    expect(allowlistPrompt.validate('+12 345')).not.toBe(true);
  });
});
