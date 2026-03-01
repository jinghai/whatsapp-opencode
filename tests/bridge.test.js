const fs = require('fs');
const path = require('path');
const { parseCommand, detectTaskType, isSenderAllowed } = require('../src/bridge/handlers');
const { loadConfig } = require('../src/config');
const { formatProgressInfo, buildProgressMessage } = require('../src/utils/messages');

describe('命令解析', () => {
  test('解析 /new', () => {
    expect(parseCommand('/new')).toBe('new');
    expect(parseCommand('/NEW')).toBe('new');
    expect(parseCommand('  /new  ')).toBe('new');
  });

  test('解析 /help', () => {
    expect(parseCommand('/help')).toBe('help');
    expect(parseCommand('/h')).toBe('help');
  });

  test('普通文本', () => {
    expect(parseCommand('你好')).toBeNull();
    expect(parseCommand('帮我写代码')).toBeNull();
  });
});

describe('任务检测', () => {
  test('debugging', () => {
    expect(detectTaskType('帮我修复这个bug')).toBe('debugging');
    expect(detectTaskType('这里有错误')).toBe('debugging');
    expect(detectTaskType('debug this')).toBe('debugging');
  });

  test('brainstorming', () => {
    expect(detectTaskType('帮我设计一个方案')).toBe('brainstorming');
    expect(detectTaskType('如何实现这个功能')).toBe('brainstorming');
    expect(detectTaskType('plan this feature')).toBe('brainstorming');
  });

  test('tdd', () => {
    expect(detectTaskType('写单元测试')).toBe('tdd');
    expect(detectTaskType('test this')).toBe('tdd');
  });

  test('git', () => {
    expect(detectTaskType('帮我提交代码')).toBe('git');
    expect(detectTaskType('commit changes')).toBe('git');
  });

  test('普通文本', () => {
    expect(detectTaskType('你好')).toBeNull();
    expect(detectTaskType('what is this')).toBeNull();
  });
});

describe('配置加载', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('缺少必填项时报错', () => {
    delete process.env.OPENCODE_URL;
    delete process.env.SILICONFLOW_KEY;
    expect(() => loadConfig()).toThrow();
  });

  test('缺少白名单时报错', () => {
    process.env.OPENCODE_URL = 'http://127.0.0.1:4096';
    process.env.SILICONFLOW_KEY = 'test_key';
    process.env.ALLOWLIST = '';
    expect(() => loadConfig()).not.toThrow();
    const config = loadConfig();
    expect(config.allowlist).toEqual([]);
  });

  test('加载成功返回配置', () => {
    process.env.OPENCODE_URL = 'http://127.0.0.1:4096';
    process.env.SILICONFLOW_KEY = 'test_key';
    process.env.ALLOWLIST = '8613800138000,8613900139000';
    process.env.OPENCODE_IMAGE_CAPABILITY = 'direct';
    process.env.WORKING_DIR = '/tmp';
    process.env.DEBUG = 'true';
    const config = loadConfig();
    expect(config.opencodeUrl).toBe('http://127.0.0.1:4096');
    expect(config.siliconflowKey).toBe('test_key');
    expect(config.allowlist).toEqual(['8613800138000', '8613900139000']);
    expect(config.imageCapability).toBe('direct');
    expect(config.workingDir).toBe(path.resolve('/tmp'));
    expect(config.debug).toBe(true);
  });

  test('未配置图片能力时默认 auto', () => {
    process.env.OPENCODE_URL = 'http://127.0.0.1:4096';
    process.env.SILICONFLOW_KEY = 'test_key';
    process.env.ALLOWLIST = '';
    delete process.env.OPENCODE_IMAGE_CAPABILITY;
    const config = loadConfig();
    expect(config.imageCapability).toBe('auto');
  });

  test('图片能力配置非法时报错', () => {
    process.env.OPENCODE_URL = 'http://127.0.0.1:4096';
    process.env.SILICONFLOW_KEY = 'test_key';
    process.env.ALLOWLIST = '';
    process.env.OPENCODE_IMAGE_CAPABILITY = 'invalid';
    expect(() => loadConfig()).toThrow('OPENCODE_IMAGE_CAPABILITY');
  });
});

describe('白名单校验', () => {
  test('白名单仅填本地号也能匹配带区号发送者', () => {
    expect(isSenderAllowed('8615800937529@s.whatsapp.net', ['15800937529'])).toBe(true);
  });

  test('白名单带 + 号也能匹配发送者', () => {
    expect(isSenderAllowed('8615800937529@s.whatsapp.net', ['+8615800937529'])).toBe(true);
  });

  test('JID 带设备后缀 :8 也能匹配', () => {
    expect(isSenderAllowed('8615800937529:8@s.whatsapp.net', ['+8615800937529'])).toBe(true);
  });
});

describe('消息辅助', () => {
  test('formatProgressInfo 空输入返回 null', () => {
    expect(formatProgressInfo([], 0)).toBeNull();
  });

  test('buildProgressMessage 无进度时返回默认文案', () => {
    const message = buildProgressMessage(60, [], 0);
    expect(message).toContain('🔄 正在处理中...');
    expect(message).toContain('⏳ 对方正在输入...');
  });

  test('buildProgressMessage 有进度时包含等待时长', () => {
    const msgs = [
      {
        info: { role: 'assistant' },
        parts: [{ type: 'reasoning', text: '正在分析' }]
      }
    ];
    const message = buildProgressMessage(120, msgs, 0);
    expect(message).toContain('📋 当前进度');
    expect(message).toContain('已等待2分钟');
  });

  test('formatProgressInfo 超长工具命令会被省略', () => {
    const longCommand = 'a'.repeat(80);
    const msgs = [
      {
        info: { role: 'assistant' },
        parts: [
          {
            type: 'tool',
            tool: 'RunCommand',
            state: { status: 'running', input: { command: longCommand } }
          }
        ]
      }
    ];
    const info = formatProgressInfo(msgs, 0);
    expect(info).toContain('正在执行: RunCommand - ');
    expect(info.endsWith('...')).toBe(true);
  });

  test('formatProgressInfo 工具输入为空白不显示连字符', () => {
    const msgs = [
      {
        info: { role: 'assistant' },
        parts: [
          {
            type: 'tool',
            tool: 'RunCommand',
            state: { status: 'running', input: { command: '   ' } }
          }
        ]
      }
    ];
    const info = formatProgressInfo(msgs, 0);
    expect(info).toBe('• 正在执行: RunCommand');
  });

  test('formatProgressInfo 工具名为空白显示 unknown', () => {
    const msgs = [
      {
        info: { role: 'assistant' },
        parts: [
          {
            type: 'tool',
            tool: '   ',
            state: { status: 'running', input: { command: 'ls' } }
          }
        ]
      }
    ];
    const info = formatProgressInfo(msgs, 0);
    expect(info).toBe('• 正在执行: unknown - ls');
  });

  test('formatProgressInfo 超长 reasoning 会被省略', () => {
    const longReasoning = 'r'.repeat(210);
    const msgs = [
      {
        info: { role: 'assistant' },
        parts: [{ type: 'reasoning', text: longReasoning }]
      }
    ];
    const info = formatProgressInfo(msgs, 0);
    expect(info).toContain('💭 ');
    expect(info.endsWith('...')).toBe(true);
  });

  test('formatProgressInfo 选择最新运行中的工具', () => {
    const msgs = [
      {
        info: { role: 'assistant' },
        parts: [
          {
            type: 'tool',
            tool: 'OldTool',
            state: { status: 'running', input: { command: 'old' } }
          }
        ]
      },
      {
        info: { role: 'assistant' },
        parts: [
          {
            type: 'tool',
            tool: 'NewTool',
            state: { status: 'running', input: { command: 'new' } }
          }
        ]
      }
    ];
    const info = formatProgressInfo(msgs, 0);
    expect(info).toBe('• 正在执行: NewTool - new');
  });
});

describe('基础检查', () => {
  test('版本号格式', () => {
    const pkg = require('../package.json');
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('包名正确', () => {
    const pkg = require('../package.json');
    expect(pkg.name).toBe('whatsapp-opencode');
  });

  test('文档索引存在', () => {
    expect(fs.existsSync(path.join(__dirname, '..', 'docs', 'INDEX.md'))).toBe(true);
  });

  test('根目录入口文件已移除', () => {
    expect(fs.existsSync(path.join(__dirname, '..', 'bridge.js'))).toBe(false);
  });
});
