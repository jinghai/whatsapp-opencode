const bridge = require('../src/bridge');

describe('Bridge Core Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should load state from file', () => {
    const state = bridge.loadState();
    expect(state).toHaveProperty('sessionId');
    expect(state).toHaveProperty('lastIndex');
  });

  test('should save state to file', () => {
    const testState = { sessionId: 'test123', lastIndex: 5 };
    expect(() => bridge.saveState(testState)).not.toThrow();
  });

  test('should detect user message correctly', () => {
    const userMsg = {
      parts: [{ type: 'text', text: 'hello' }]
    };
    expect(bridge.isUserMessage(userMsg)).toBe(true);
  });

  test('should detect assistant message correctly', () => {
    const assistantMsg = {
      parts: [{ type: 'step-start' }, { type: 'text', text: 'response' }]
    };
    expect(bridge.isAssistantMessage(assistantMsg)).toBe(true);
  });

  test('should extract text from message', () => {
    const msg = {
      parts: [{ type: 'text', text: 'test message' }]
    };
    expect(bridge.getTextFromMessage(msg)).toBe('test message');
  });

  test('should handle empty message', () => {
    const msg = { parts: [] };
    expect(bridge.getTextFromMessage(msg)).toBe('');
  });
});

describe('Media Processing', () => {
  test('should save image buffer to file', async () => {
    const mockBuffer = Buffer.from('test image data');
    const result = await bridge.saveImageBuffer(mockBuffer, 'image/jpeg');
    expect(result).toContain('/media/');
    expect(result).toContain('.jpg');
  });

  test('should handle image save error', async () => {
    const result = await bridge.saveImageBuffer(null, 'image/jpeg');
    expect(result).toBeNull();
  });
});

describe('Session Management', () => {
  test('should create new session if none exists', async () => {
    const state = { sessionId: null, lastIndex: -1 };
    const sessionId = await bridge.getOrCreateSession(state);
    expect(sessionId).toBeTruthy();
    expect(sessionId).toMatch(/^ses_/);
  });

  test('should reuse existing valid session', async () => {
    const state = { sessionId: 'ses_test123', lastIndex: 0 };
    // Mock axios.get to return valid session
    jest.spyOn(bridge.axios, 'get').mockResolvedValue({ data: { id: 'ses_test123' } });
    
    const sessionId = await bridge.getOrCreateSession(state);
    expect(sessionId).toBe('ses_test123');
  });
});

describe('Reply Processing', () => {
  test('should wait for completed message', async () => {
    const mockMessages = [
      { info: { role: 'user' }, parts: [{ type: 'text', text: 'test' }] },
      { 
        info: { role: 'assistant', finish: 'stop' }, 
        parts: [{ type: 'text', text: 'reply' }] 
      }
    ];
    
    jest.spyOn(bridge.axios, 'get')
      .mockResolvedValueOnce({ data: mockMessages });
    
    const reply = await bridge.waitForReply('ses_test', 0);
    expect(reply).toBe('reply');
  });

  test('should handle timeout', async () => {
    jest.spyOn(bridge.axios, 'get').mockResolvedValue({ data: [] });
    
    const reply = await bridge.waitForReply('ses_test', 0, 1, 10);
    expect(reply).toBeNull();
  });
});
