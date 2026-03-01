jest.mock('@whiskeysockets/baileys', () => ({
  DisconnectReason: { loggedOut: 401 },
  downloadMediaMessage: jest.fn()
}));

jest.mock('../src/utils/filesystem', () => ({
  ensureDir: jest.fn(),
  readJson: jest.fn(() => ({})),
  writeJson: jest.fn()
}));

jest.mock('../src/services/opencodeClient', () => ({
  createOpenCodeClient: jest.fn()
}));

jest.mock('../src/services/whatsappClient', () => ({
  createWhatsAppClient: jest.fn()
}));

jest.mock('pino', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  };
  const mockPino = jest.fn(() => mockLogger);
  mockPino.destination = jest.fn();
  return mockPino;
});

jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  rmSync: jest.fn(),
  readFileSync: jest.fn(),
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn()
  }
}));

jest.mock('../src/services/transcriber', () => ({
  transcribeAudio: jest.fn()
}));

jest.mock('../src/services/ocr', () => ({
  transcribeImage: jest.fn()
}));

const { startBridge } = require('../src/bridge/sync');
const { createOpenCodeClient } = require('../src/services/opencodeClient');
const { createWhatsAppClient } = require('../src/services/whatsappClient');
const { readJson } = require('../src/utils/filesystem');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { transcribeAudio } = require('../src/services/transcriber');
const { transcribeImage } = require('../src/services/ocr');
const P = require('pino');
const fs = require('fs');

describe('sync', () => {
  let mockSock;
  let mockOpenCodeClient;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockSock = {
      ev: {
        on: jest.fn()
      },
      sendMessage: jest.fn(),
      sendPresenceUpdate: jest.fn()
    };
    createWhatsAppClient.mockResolvedValue(mockSock);

    mockOpenCodeClient = {
      createSession: jest.fn().mockResolvedValue({ id: 'mock-session-id' }),
      getSession: jest.fn().mockResolvedValue({ id: 'mock-session-id' }),
      listMessages: jest.fn().mockResolvedValue([]),
      sendPromptAsync: jest.fn().mockResolvedValue({})
    };
    createOpenCodeClient.mockReturnValue(mockOpenCodeClient);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('startBridge 缺少必要配置时抛错', async () => {
    await expect(startBridge({ workingDir: '/tmp' }, '1.0.0')).rejects.toThrow('缺少必要配置');
  });

  test('连接关闭为 loggedOut 时应清理认证并重新初始化', async () => {
    const config = {
      workingDir: '/tmp/wa-bridge',
      opencodeUrl: 'http://localhost:3000',
      siliconflowKey: 'sk-test',
      debug: false,
      allowlist: []
    };

    fs.existsSync.mockReturnValue(true);
    const { stop } = await startBridge(config, '1.0.0');
    stop();

    const connectCall = createWhatsAppClient.mock.calls[0][0];
    await connectCall.onConnectionUpdate({
      connection: 'close',
      lastDisconnect: { error: { output: { statusCode: 401 } } }
    });

    expect(fs.rmSync).toHaveBeenCalledWith('/tmp/wa-bridge/auth', { recursive: true, force: true });
    expect(createWhatsAppClient).toHaveBeenCalledTimes(2);
  });

  test('连接成功时应发送服务启动消息', async () => {
    const config = {
      workingDir: '/tmp/wa-bridge',
      opencodeUrl: 'http://localhost:3000',
      siliconflowKey: 'sk-test',
      debug: false,
      allowlist: ['8613800138000']
    };

    const { stop } = await startBridge(config, '1.0.0');
    stop();

    const connectCall = createWhatsAppClient.mock.calls[0][0];
    await connectCall.onConnectionUpdate({ connection: 'open' });

    expect(mockSock.sendMessage).toHaveBeenCalledWith(
      '8613800138000@s.whatsapp.net',
      { text: expect.any(String) }
    );
    expect(mockSock.sendMessage).toHaveBeenCalledTimes(1);
  });

  test('发送启动消息成功时应记录日志', async () => {
    const config = {
      workingDir: '/tmp/wa-bridge',
      opencodeUrl: 'http://localhost:3000',
      siliconflowKey: 'sk-test',
      debug: false,
      allowlist: ['8613800138000']
    };

    const { stop } = await startBridge(config, '1.0.0');
    stop();

    const connectCall = createWhatsAppClient.mock.calls[0][0];
    await connectCall.onConnectionUpdate({ connection: 'open' });

    const logger = P.mock.results[0].value;
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ target: '8613800138000@s.whatsapp.net' }),
      'send greeting success'
    );
  });

  test('白名单无效时应回退发送给自身账号', async () => {
    const config = {
      workingDir: '/tmp/wa-bridge',
      opencodeUrl: 'http://localhost:3000',
      siliconflowKey: 'sk-test',
      debug: false,
      allowlist: ['not-a-number']
    };

    mockSock.user = { id: '8613800138000@s.whatsapp.net' };

    const { stop } = await startBridge(config, '1.0.0');
    stop();

    const connectCall = createWhatsAppClient.mock.calls[0][0];
    await connectCall.onConnectionUpdate({ connection: 'open' });

    expect(mockSock.sendMessage).toHaveBeenCalledWith(
      '8613800138000@s.whatsapp.net',
      { text: expect.any(String) }
    );
    const logger = P.mock.results[0].value;
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ allowlist: ['not-a-number'] }),
      'greeting target empty, fallback to self'
    );
  });

  test('白名单不包含自身时应补充发送给自身账号', async () => {
    const config = {
      workingDir: '/tmp/wa-bridge',
      opencodeUrl: 'http://localhost:3000',
      siliconflowKey: 'sk-test',
      debug: false,
      allowlist: ['15800937529']
    };

    mockSock.user = { id: '8615800937529@s.whatsapp.net' };

    const { stop } = await startBridge(config, '1.0.0');
    stop();

    const connectCall = createWhatsAppClient.mock.calls[0][0];
    await connectCall.onConnectionUpdate({ connection: 'open' });

    expect(mockSock.sendMessage).toHaveBeenCalledWith(
      '8615800937529@s.whatsapp.net',
      { text: expect.any(String) }
    );
    const logger = P.mock.results[0].value;
    expect(logger.warn).not.toHaveBeenCalledWith(
      expect.anything(),
      'greeting allowlist missing self, add self'
    );
  });

  test('连接成功回调异常时不应抛出未处理拒绝', async () => {
    const config = {
      workingDir: '/tmp/wa-bridge',
      opencodeUrl: 'http://localhost:3000',
      siliconflowKey: 'sk-test',
      debug: false,
      allowlist: []
    };

    const onConnected = jest.fn().mockRejectedValue(['bad']);
    const { stop } = await startBridge(config, '1.0.0', { onConnected });
    stop();

    const connectCall = createWhatsAppClient.mock.calls[0][0];
    await expect(connectCall.onConnectionUpdate({ connection: 'open' })).resolves.toBeUndefined();
    expect(onConnected).toHaveBeenCalled();
  });

  test('定时轮询应将新消息转发到 WhatsApp', async () => {
    const config = {
      workingDir: '/tmp/wa-bridge',
      opencodeUrl: 'http://localhost:3000',
      siliconflowKey: 'sk-test',
      debug: false,
      allowlist: []
    };

    // 模拟状态文件，确保没有初始 sessionId，触发 createSession
    readJson.mockReturnValue({});

    // 启动 Bridge
    const { stop, pollMessages } = await startBridge(config, '1.0.0');
    
    // 立即停止内置定时器，以便手动控制
    stop();

    // 获取 onMessagesUpsert 回调
    const connectCall = createWhatsAppClient.mock.calls[0][0];
    const onMessagesUpsert = connectCall.onMessagesUpsert;

    // 模拟发送一条 "自身" 消息以设置 myJid
    // 注意：我们需要发送一条会被忽略的消息（不含文本），否则会触发处理逻辑导致死锁
    // const myJid = '123456@s.whatsapp.net';
    // await onMessagesUpsert({
    //   messages: [{
    //     key: { remoteJid: myJid, fromMe: true },
    //     message: {} // 空消息，text 为空，会提前返回
    //   }]
    // });

    // 模拟 OpenCode 返回新消息
    // startBridge 初始化时已经调用了一次 listMessages (使用了 beforeEach 中的默认 mock)
    // 这里我们为下一次调用 (即 pollMessages) 设置返回值
    mockOpenCodeClient.listMessages
      .mockImplementation(async () => {
        return [];
      })
      .mockImplementationOnce(async () => {
        // msgCountBefore
        return [];
      })
      .mockImplementationOnce(async () => {
        // upsert poll loop - return a finished message to break the loop immediately
        return [
          {
            info: { role: 'user' },
            parts: [{ type: 'text', text: 'init session' }]
          },
          {
            info: { role: 'assistant', finish: 'stop' },
            parts: [{ type: 'text', text: 'Session initialized' }]
          }
        ];
      })
      .mockImplementationOnce(async () => {
        // pollMessages loop for user1 (if any)
        return [];
      });

    // 让我们发送一条真正的消息来触发 Session 创建
    const myJid = '123456@s.whatsapp.net';
    
    // 初始化用户 session
    const promise = onMessagesUpsert({
      messages: [{
        key: { remoteJid: myJid, fromMe: false },
        message: { conversation: 'init session' }
      }]
    });
    
    // Fast-forward timers to skip the initial delay in onMessagesUpsert loop
    // Use a loop to flush microtasks and timers
    for (let i = 0; i < 50; i++) {
      await Promise.resolve();
      jest.runAllTimers();
    }
    
    await promise;

    // 清除 mockSock 的调用记录
    mockSock.sendMessage.mockClear();

    // Reset mock for pollMessages
    mockOpenCodeClient.listMessages.mockReset();
    mockOpenCodeClient.listMessages
      .mockImplementationOnce(async () => {
        // pollMessages call
        return [
          {
            info: { role: 'user' },
            parts: [{ type: 'text', text: 'init session' }]
          },
          {
            info: { role: 'assistant', finish: 'stop' },
            parts: [{ type: 'text', text: 'Session initialized' }]
          },
          {
            info: { role: 'user' },
            parts: [{ type: 'text', text: '来自 TUI 的消息' }]
          }
        ];
      });

    // 手动触发轮询
    await pollMessages();

    expect(mockSock.sendMessage).toHaveBeenCalledWith(
      myJid,
      expect.objectContaining({ text: expect.stringContaining('来自 TUI 的消息') })
    );
  }, 10000); // 增加超时

  test('收到 "new" 命令时应创建新会话', async () => {
    const config = {
      workingDir: '/tmp/wa-bridge',
      opencodeUrl: 'http://localhost:3000',
      siliconflowKey: 'sk-test',
      debug: false,
      allowlist: []
    };

    readJson.mockReturnValue({ sessionId: 'old-session' });

    const { stop } = await startBridge(config, '1.0.0');
    stop();

    const connectCall = createWhatsAppClient.mock.calls[0][0];
    const onMessagesUpsert = connectCall.onMessagesUpsert;
    const sender = '123@s.whatsapp.net';

    // 模拟收到 "new" 消息
    await onMessagesUpsert({
      messages: [{
        key: { remoteJid: sender, fromMe: false },
        message: { conversation: '/new' }
      }]
    });

    expect(mockOpenCodeClient.createSession).toHaveBeenCalled();
    expect(mockSock.sendMessage).toHaveBeenCalledWith(
      sender,
      expect.objectContaining({ text: expect.stringContaining('已创建新会话') })
    );
  });

  test('收到 "help" 命令时应回复帮助信息', async () => {
    const config = {
      workingDir: '/tmp/wa-bridge',
      opencodeUrl: 'http://localhost:3000',
      siliconflowKey: 'sk-test',
      debug: false,
      allowlist: []
    };

    readJson.mockReturnValue({});

    const { stop } = await startBridge(config, '1.0.0');
    stop();

    const connectCall = createWhatsAppClient.mock.calls[0][0];
    const onMessagesUpsert = connectCall.onMessagesUpsert;
    const sender = '123@s.whatsapp.net';

    // 模拟收到 "help" 消息
    await onMessagesUpsert({
      messages: [{
        key: { remoteJid: sender, fromMe: false },
        message: { conversation: '/help' }
      }]
    });

    expect(mockSock.sendMessage).toHaveBeenCalledWith(
      sender,
      expect.objectContaining({ text: expect.stringContaining('WhatsApp OpenCode Bridge') })
    );
  });

  test('收到普通文本消息应转发给 OpenCode 并回复结果', async () => {
    const config = {
      workingDir: '/tmp/wa-bridge',
      opencodeUrl: 'http://localhost:3000',
      siliconflowKey: 'sk-test',
      debug: false,
      allowlist: []
    };

    readJson.mockReturnValue({});

    // 使用真实 timer，因为逻辑中有 await setTimeout
    jest.useRealTimers();

    const { stop } = await startBridge(config, '1.0.0');
    stop();

    const connectCall = createWhatsAppClient.mock.calls[0][0];
    const onMessagesUpsert = connectCall.onMessagesUpsert;
    const sender = '123@s.whatsapp.net';

    // 准备 Mock 序列
    // 1. startBridge 初始化时调用了一次 (已由 beforeEach 处理，或已被消耗)
    // 注意：startBridge 调用了一次。在 beforeEach 中我们设置了 mockResolvedValue([])
    // 这里我们需要重置或追加 mock
    
    mockOpenCodeClient.listMessages.mockReset();
    mockOpenCodeClient.listMessages
      .mockResolvedValueOnce([]) // 1. msgCountBefore (获取当前消息数)
      .mockResolvedValueOnce([   // 2. 轮询获取回复
        {
          info: { role: 'user' },
          parts: [{ type: 'text', text: '你好' }]
        },
        {
          info: { role: 'assistant', finish: 'stop' },
          parts: [{ type: 'text', text: '你好！我是 OpenCode 助手。' }]
        }
      ]);
      
    mockOpenCodeClient.sendPromptAsync.mockResolvedValue({});

    // 模拟收到 "你好" 消息
    await onMessagesUpsert({
      messages: [{
        key: { remoteJid: sender, fromMe: false },
        message: { conversation: '你好' }
      }]
    });

    // 验证调用了 sendPromptAsync
    expect(mockOpenCodeClient.sendPromptAsync).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([expect.objectContaining({ text: expect.stringContaining('你好') })])
    );

    // 验证回复了 WhatsApp
    expect(mockSock.sendMessage).toHaveBeenCalledWith(
      sender,
      expect.objectContaining({ text: expect.stringContaining('我是 OpenCode 助手') })
    );
  });

  test('图片模式为 ocr 时应转文字再发送给 OpenCode', async () => {
    const config = {
      workingDir: '/tmp/wa-bridge',
      opencodeUrl: 'http://localhost:3000',
      siliconflowKey: 'sk-test',
      imageCapability: 'ocr',
      debug: false,
      allowlist: []
    };

    readJson.mockReturnValue({});
    jest.useRealTimers();

    const { stop } = await startBridge(config, '1.0.0');
    stop();

    const connectCall = createWhatsAppClient.mock.calls[0][0];
    const onMessagesUpsert = connectCall.onMessagesUpsert;
    const sender = '123@s.whatsapp.net';

    // Mock 依赖
    const mockBuffer = Buffer.from('fake-image');
    downloadMediaMessage.mockResolvedValue(mockBuffer);
    
    transcribeImage.mockResolvedValue('这是图片里的文字');

    mockOpenCodeClient.listMessages.mockReset();
    mockOpenCodeClient.listMessages
      .mockResolvedValueOnce([]) // msgCountBefore
      .mockResolvedValueOnce([   // reply
        {
          info: { role: 'user' },
          parts: [{ type: 'text', text: '图片描述...' }]
        },
        {
          info: { role: 'assistant', finish: 'stop' },
          parts: [{ type: 'text', text: '收到图片了' }]
        }
      ]);
    mockOpenCodeClient.sendPromptAsync.mockResolvedValue({});

    // 模拟收到图片消息
    await onMessagesUpsert({
      messages: [{
        key: { remoteJid: sender, fromMe: false },
        message: {
          imageMessage: { caption: '测试图片' }
        }
      }]
    });

    expect(downloadMediaMessage).toHaveBeenCalled();
    expect(transcribeImage).toHaveBeenCalledWith(expect.objectContaining({
      buffer: mockBuffer,
      apiKey: 'sk-test'
    }));

    expect(mockOpenCodeClient.sendPromptAsync).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([
        expect.objectContaining({
          type: 'text',
          text: expect.stringContaining('这是图片里的文字')
        })
      ])
    );
  });

  test('图片模式为 direct 时应直接发送图片给 OpenCode', async () => {
    const config = {
      workingDir: '/tmp/wa-bridge',
      opencodeUrl: 'http://localhost:3000',
      siliconflowKey: 'sk-test',
      imageCapability: 'direct',
      debug: false,
      allowlist: []
    };

    readJson.mockReturnValue({});
    jest.useRealTimers();

    const { stop } = await startBridge(config, '1.0.0');
    stop();

    const connectCall = createWhatsAppClient.mock.calls[0][0];
    const onMessagesUpsert = connectCall.onMessagesUpsert;
    const sender = '123@s.whatsapp.net';

    const mockBuffer = Buffer.from('fake-image');
    downloadMediaMessage.mockResolvedValue(mockBuffer);

    mockOpenCodeClient.listMessages.mockReset();
    mockOpenCodeClient.listMessages
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          info: { role: 'assistant', finish: 'stop' },
          parts: [{ type: 'text', text: '收到图片了' }]
        }
      ]);
    mockOpenCodeClient.sendPromptAsync.mockResolvedValue({});

    await onMessagesUpsert({
      messages: [{
        key: { remoteJid: sender, fromMe: false },
        message: {
          imageMessage: { caption: '测试图片' }
        }
      }]
    });

    expect(transcribeImage).not.toHaveBeenCalled();
    expect(mockOpenCodeClient.sendPromptAsync).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([
        expect.objectContaining({ type: 'image' })
      ])
    );
  });

  test('图片模式为 auto 且直传失败时应回退 OCR', async () => {
    const config = {
      workingDir: '/tmp/wa-bridge',
      opencodeUrl: 'http://localhost:3000',
      siliconflowKey: 'sk-test',
      imageCapability: 'auto',
      debug: false,
      allowlist: []
    };

    readJson.mockReturnValue({});
    jest.useRealTimers();

    const { stop } = await startBridge(config, '1.0.0');
    stop();

    const connectCall = createWhatsAppClient.mock.calls[0][0];
    const onMessagesUpsert = connectCall.onMessagesUpsert;
    const sender = '123@s.whatsapp.net';

    const mockBuffer = Buffer.from('fake-image');
    downloadMediaMessage.mockResolvedValue(mockBuffer);
    transcribeImage.mockResolvedValue('OCR 回退文字');

    mockOpenCodeClient.listMessages.mockReset();
    mockOpenCodeClient.listMessages
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          info: { role: 'assistant', finish: 'stop' },
          parts: [{ type: 'text', text: '收到回退文字' }]
        }
      ]);
    mockOpenCodeClient.sendPromptAsync
      .mockRejectedValueOnce(new Error('unsupported image part'))
      .mockResolvedValueOnce({});

    await onMessagesUpsert({
      messages: [{
        key: { remoteJid: sender, fromMe: false },
        message: {
          imageMessage: { caption: '测试图片' }
        }
      }]
    });

    expect(mockOpenCodeClient.sendPromptAsync).toHaveBeenCalledTimes(2);
    expect(transcribeImage).toHaveBeenCalledWith(expect.objectContaining({
      buffer: mockBuffer,
      apiKey: 'sk-test'
    }));
    const fallbackCall = mockOpenCodeClient.sendPromptAsync.mock.calls[1][1];
    expect(fallbackCall).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'text',
        text: expect.stringContaining('OCR 回退文字')
      })
    ]));
  });

  test('收到语音消息应转录并转发内容', async () => {
    const config = {
      workingDir: '/tmp/wa-bridge',
      opencodeUrl: 'http://localhost:3000',
      siliconflowKey: 'sk-test',
      debug: false,
      allowlist: []
    };

    readJson.mockReturnValue({});
    jest.useRealTimers();

    const { stop } = await startBridge(config, '1.0.0');
    stop();

    const connectCall = createWhatsAppClient.mock.calls[0][0];
    const onMessagesUpsert = connectCall.onMessagesUpsert;
    const sender = '123@s.whatsapp.net';

    // Mock 依赖
    const mockBuffer = Buffer.from('fake-audio');
    downloadMediaMessage.mockResolvedValue(mockBuffer);
    transcribeAudio.mockResolvedValue('转录的语音文本');
    
    mockOpenCodeClient.listMessages.mockReset();
    mockOpenCodeClient.listMessages
      .mockResolvedValueOnce([]) // msgCountBefore
      .mockResolvedValueOnce([   // reply
        {
          info: { role: 'user' },
          parts: [{ type: 'text', text: '转录的语音文本' }]
        },
        {
          info: { role: 'assistant', finish: 'stop' },
          parts: [{ type: 'text', text: '收到语音了' }]
        }
      ]);
    mockOpenCodeClient.sendPromptAsync.mockResolvedValue({});

    // 模拟收到语音消息
    await onMessagesUpsert({
      messages: [{
        key: { remoteJid: sender, fromMe: false },
        message: {
          audioMessage: { seconds: 10 }
        }
      }]
    });

    // 验证下载和转录
    expect(downloadMediaMessage).toHaveBeenCalled();
    expect(transcribeAudio).toHaveBeenCalledWith(expect.objectContaining({
      buffer: mockBuffer,
      apiKey: 'sk-test'
    }));

    // 验证发送给 OpenCode 的内容是转录结果
    expect(mockOpenCodeClient.sendPromptAsync).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([
        expect.objectContaining({ 
          text: expect.stringContaining('转录的语音文本') 
        })
      ])
    );
  });

  test('发送者不在白名单时应被忽略', async () => {
    const config = {
      workingDir: '/tmp/wa-bridge',
      opencodeUrl: 'http://localhost:3000',
      siliconflowKey: 'sk-test',
      debug: false,
      allowlist: ['123456'] // 只有 123456 允许
    };

    readJson.mockReturnValue({});
    
    // 重置 mock 状态以确保准确
    mockOpenCodeClient.sendPromptAsync.mockReset();
    mockSock.sendMessage.mockReset();

    const { stop } = await startBridge(config, '1.0.0');
    stop();

    const connectCall = createWhatsAppClient.mock.calls[0][0];
    const onMessagesUpsert = connectCall.onMessagesUpsert;
    const sender = '999999@s.whatsapp.net'; // 不在白名单

    // 模拟收到消息
    await onMessagesUpsert({
      messages: [{
        key: { remoteJid: sender, fromMe: false },
        message: { conversation: 'hello' }
      }]
    });

    // 验证没有调用 OpenCode
    expect(mockOpenCodeClient.sendPromptAsync).not.toHaveBeenCalled();
    expect(mockSock.sendMessage).not.toHaveBeenCalled();
  });

  test('不同用户应使用独立的 Session', async () => {
    jest.useFakeTimers();
    const config = {
      workingDir: '/tmp/wa-bridge',
      opencodeUrl: 'http://localhost:3000',
      siliconflowKey: 'sk-test',
      debug: false,
      allowlist: ['user1', 'user2']
    };

    readJson.mockReturnValue({});
    
    // Mock createSession 返回不同的 ID
    mockOpenCodeClient.createSession
      .mockResolvedValueOnce({ id: 'session-1' })
      .mockResolvedValueOnce({ id: 'session-2' });

    // 精确控制 listMessages 的返回
    mockOpenCodeClient.listMessages
      .mockImplementation(async () => {
        return [];
      })
      .mockImplementationOnce(async () => {
        // User 1: msgCountBefore
        return [];
      })
      .mockImplementationOnce(async () => {
        // User 1: loop poll - return finished message
        return [{ info: { role: 'assistant', finish: 'stop' }, parts: [{ type: 'text', text: 'reply1' }] }];
      })
      .mockImplementationOnce(async () => {
        // User 1: msgResAfter (after loop)
        return [{ info: { role: 'assistant', finish: 'stop' }, parts: [{ type: 'text', text: 'reply1' }] }];
      })
      .mockImplementationOnce(async () => {
        // User 2: msgCountBefore
        return [];
      })
      .mockImplementationOnce(async () => {
        // User 2: loop poll - return finished message
        return [{ info: { role: 'assistant', finish: 'stop' }, parts: [{ type: 'text', text: 'reply2' }] }];
      })
      .mockImplementationOnce(async () => {
        // User 2: msgResAfter (after loop)
        return [{ info: { role: 'assistant', finish: 'stop' }, parts: [{ type: 'text', text: 'reply2' }] }];
      });
      
    mockOpenCodeClient.sendPromptAsync.mockResolvedValue({});

    const { stop } = await startBridge(config, '1.0.0');
    stop(); 
    
    const connectCall = createWhatsAppClient.mock.calls[0][0];
    const onMessagesUpsert = connectCall.onMessagesUpsert;
    const user1 = 'user1@s.whatsapp.net';
    const user2 = 'user2@s.whatsapp.net';

    // User 1 发送消息
    const p1 = onMessagesUpsert({
      messages: [{
        key: { remoteJid: user1, fromMe: false },
        message: { conversation: 'hi from user1' }
      }]
    });
    
    // 推进时间
    for (let i = 0; i < 50; i++) {
      await Promise.resolve();
      jest.runAllTimers();
    }
    await p1;

    // User 2 发送消息
    const p2 = onMessagesUpsert({
      messages: [{
        key: { remoteJid: user2, fromMe: false },
        message: { conversation: 'hi from user2' }
      }]
    });
    
    // 推进时间
    for (let i = 0; i < 50; i++) {
      await Promise.resolve();
      jest.runAllTimers();
    }
    await p2;

    jest.useRealTimers();

    // 验证 sendPromptAsync 分别使用了不同的 session ID
    expect(mockOpenCodeClient.sendPromptAsync).toHaveBeenNthCalledWith(
      1,
      'session-1',
      expect.anything()
    );

    expect(mockOpenCodeClient.sendPromptAsync).toHaveBeenNthCalledWith(
      2,
      'session-2',
      expect.anything()
    );
  });

  test('长时间不活跃的会话应被清理', async () => {
    const config = {
      workingDir: '/tmp/wa-bridge',
      opencodeUrl: 'http://localhost:3000',
      siliconflowKey: 'sk-test',
      debug: false,
      allowlist: []
    };

    // 初始状态：有一个活跃用户
    const now = Date.now();
    const expiredTime = now - (60 * 60 * 1000 + 1000); // 1小时+1秒前
    
    readJson.mockReturnValue({
      users: {
        'active@s.whatsapp.net': { sessionId: 's1', lastIndex: 0, lastActivity: now },
        'expired@s.whatsapp.net': { sessionId: 's2', lastIndex: 0, lastActivity: expiredTime }
      }
    });

    // Mock listMessages to return empty for poll
    mockOpenCodeClient.listMessages.mockResolvedValue([]);

    const { stop, pollMessages } = await startBridge(config, '1.0.0');
    stop();

    // 触发轮询
    await pollMessages();

    // 读取保存的状态
    const saveCall = require('../src/utils/filesystem').writeJson.mock.calls[0];
    const savedState = saveCall[1];

    expect(savedState.users['active@s.whatsapp.net']).toBeDefined();
    expect(savedState.users['expired@s.whatsapp.net']).toBeUndefined();
  });

  test('运行态 processingUsers 不应写入持久化状态', async () => {
    const config = {
      workingDir: '/tmp/wa-bridge',
      opencodeUrl: 'http://localhost:3000',
      siliconflowKey: 'sk-test',
      imageCapability: 'ocr',
      debug: false,
      allowlist: []
    };

    readJson.mockReturnValue({});
    jest.useRealTimers();

    const { stop } = await startBridge(config, '1.0.0');
    stop();

    const connectCall = createWhatsAppClient.mock.calls[0][0];
    const onMessagesUpsert = connectCall.onMessagesUpsert;
    const sender = 'persist@s.whatsapp.net';

    mockOpenCodeClient.listMessages.mockReset();
    mockOpenCodeClient.listMessages
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          info: { role: 'assistant', finish: 'stop' },
          parts: [{ type: 'text', text: 'ok' }]
        }
      ])
      .mockResolvedValueOnce([
        {
          info: { role: 'assistant', finish: 'stop' },
          parts: [{ type: 'text', text: 'ok' }]
        }
      ]);
    mockOpenCodeClient.sendPromptAsync.mockResolvedValue({});

    await onMessagesUpsert({
      messages: [{
        key: { remoteJid: sender, fromMe: false },
        message: { conversation: 'hello' }
      }]
    });

    const writeJson = require('../src/utils/filesystem').writeJson;
    const persistedStates = writeJson.mock.calls.map(call => call[1]);
    expect(persistedStates.length).toBeGreaterThan(0);
    persistedStates.forEach(state => {
      expect(state.processingUsers).toBeUndefined();
    });
  });

  test('长文本应分段流式发送', async () => {
    const config = {
      workingDir: '/tmp/wa-bridge',
      opencodeUrl: 'http://localhost:3000',
      siliconflowKey: 'sk-test',
      debug: false,
      allowlist: []
    };

    readJson.mockReturnValue({});
    jest.useRealTimers(); // 使用真实定时器以简化 Promise 逻辑

    const { stop } = await startBridge(config, '1.0.0');
    stop();

    const connectCall = createWhatsAppClient.mock.calls[0][0];
    const onMessagesUpsert = connectCall.onMessagesUpsert;
    const sender = 'streamer@s.whatsapp.net';

    // Mock listMessages 模拟流式生成过程
    mockOpenCodeClient.listMessages.mockReset();
    mockOpenCodeClient.listMessages
      .mockResolvedValueOnce([]) // msgCountBefore
      .mockResolvedValueOnce([   // 第一次检查：生成了一部分 (25 chars > 20)
        {
          info: { role: 'user' },
          parts: [{ type: 'text', text: '讲个故事' }]
        },
        {
          info: { role: 'assistant', finish: null }, // 未完成
          parts: [{ type: 'text', text: '从前有座山，山里有座庙，庙里有个老和尚，正在讲故事。' }]
        }
      ])
      .mockResolvedValueOnce([   // 第二次检查：生成了更多 (+25 chars)
        {
          info: { role: 'user' },
          parts: [{ type: 'text', text: '讲个故事' }]
        },
        {
          info: { role: 'assistant', finish: null }, // 未完成
          parts: [{ type: 'text', text: '从前有座山，山里有座庙，庙里有个老和尚，正在讲故事。老和尚对小和尚说：从前有座山，' }]
        }
      ])
      .mockResolvedValue([   // 第三次检查：完成
        {
          info: { role: 'user' },
          parts: [{ type: 'text', text: '讲个故事' }]
        },
        {
          info: { role: 'assistant', finish: 'stop' }, // 完成
          parts: [{ type: 'text', text: '从前有座山，山里有座庙，庙里有个老和尚，正在讲故事。老和尚对小和尚说：从前有座山，山里有座庙。' }]
        }
      ]);

    mockOpenCodeClient.sendPromptAsync.mockResolvedValue({});

    await onMessagesUpsert({
      messages: [{
        key: { remoteJid: sender, fromMe: false },
        message: { conversation: '讲个故事' }
      }]
    });

    // 验证发送了多次消息
    // 1. "从前有座山，"
    // 2. "山里有座庙，" (增量)
    // 3. "庙里有个老和尚。" (增量)
    
    // 注意：具体分段取决于代码中的阈值。
    // 我们只要验证发送了至少两次（除了初始的 Prompt），且内容拼接起来是完整的。
    
    const sendCalls = mockSock.sendMessage.mock.calls.filter(call => call[0] === sender);
    // 过滤掉 "progress" 消息
    const textCalls = sendCalls.filter(call => !call[1].text.startsWith('⏳') && !call[1].text.startsWith('✅'));
    
    // 至少应该有多次发送 (流式)
    // 实际上，如果阈值设置得当（比如 5 字符），上面三次 mock 应该触发至少 2-3 次发送
    // "从前有座山，" (6 chars) -> Send
    // "山里有座庙，" (6 chars) -> Send
    // "庙里有个老和尚。" (8 chars) -> Send
    
    expect(textCalls.length).toBeGreaterThan(1);
    
    const combinedText = textCalls.map(c => c[1].text).join('');
    expect(combinedText).toContain('从前有座山');
    expect(combinedText).toContain('山里有座庙');
    expect(combinedText).toContain('老和尚');
  });

  test('当工具需要权限确认时应通知用户', async () => {
    const config = {
      workingDir: '/tmp/wa-bridge',
      opencodeUrl: 'http://localhost:3000',
      siliconflowKey: 'sk-test',
      debug: false,
      allowlist: []
    };

    readJson.mockReturnValue({});
    jest.useRealTimers();

    const { stop } = await startBridge(config, '1.0.0');
    stop();

    const connectCall = createWhatsAppClient.mock.calls[0][0];
    const onMessagesUpsert = connectCall.onMessagesUpsert;
    const sender = 'approval@s.whatsapp.net';

    // Mock 场景：
    // 1. 用户请求执行危险命令
    // 2. OpenCode 返回 requires_approval 状态的工具调用
    // 3. 用户回复 "yes" (这一步由另一个 onMessagesUpsert 触发，本测试验证步骤 2 是否发送通知)
    
    mockOpenCodeClient.listMessages.mockReset();
    mockOpenCodeClient.listMessages
      .mockResolvedValueOnce([]) // msgCountBefore
      .mockResolvedValueOnce([   // 第一次检查：工具请求确认
        {
          info: { role: 'user' },
          parts: [{ type: 'text', text: '删除所有文件' }]
        },
        {
          info: { role: 'assistant', finish: null },
          parts: [
            { 
              type: 'tool', 
              tool_name: 'run_command', 
              args: { command: 'rm -rf /' },
              state: { status: 'requires_approval' } 
            }
          ]
        }
      ])
      .mockResolvedValueOnce([   // 等待中...
        {
          info: { role: 'user' },
          parts: [{ type: 'text', text: '删除所有文件' }]
        },
        {
          info: { role: 'assistant', finish: null },
          parts: [
            { 
              type: 'tool', 
              tool_name: 'run_command', 
              args: { command: 'rm -rf /' },
              state: { status: 'requires_approval' } 
            }
          ]
        }
      ])
      .mockResolvedValue([   // 后续检查：假设用户同意后工具完成了 (简化模拟)
        {
          info: { role: 'user' },
          parts: [{ type: 'text', text: '删除所有文件' }]
        },
        {
          info: { role: 'assistant', finish: 'stop' },
          parts: [
            { 
              type: 'tool', 
              tool_name: 'run_command', 
              args: { command: 'rm -rf /' },
              state: { status: 'completed', output: 'Done' } 
            }
          ]
        }
      ]);

    mockOpenCodeClient.sendPromptAsync.mockResolvedValue({});

    // 触发流程
    await onMessagesUpsert({
      messages: [{
        key: { remoteJid: sender, fromMe: false },
        message: { conversation: '删除所有文件' }
      }]
    });

    // 验证是否发送了包含 "确认" 或 "Approval" 的提示消息
    const sendCalls = mockSock.sendMessage.mock.calls.filter(call => call[0] === sender);
    const approvalMsg = sendCalls.find(call => 
      call[1].text.includes('确认') || 
      call[1].text.includes('Approval') ||
      call[1].text.includes('rm -rf /')
    );

    expect(approvalMsg).toBeDefined();
    expect(approvalMsg[1].text).toContain('rm -rf /');
  });
});
