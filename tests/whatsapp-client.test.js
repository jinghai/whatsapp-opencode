const mockOn = jest.fn();
const mockSocket = {
  ev: { on: mockOn }
};

jest.mock('@whiskeysockets/baileys', () => ({
  makeWASocket: jest.fn(() => mockSocket),
  useMultiFileAuthState: jest.fn(async () => ({
    state: { creds: {} },
    saveCreds: jest.fn()
  })),
  fetchLatestBaileysVersion: jest.fn(async () => ({ version: [2, 3000, 101] }))
}));

jest.mock('pino', () => jest.fn(() => ({ info: jest.fn() })));

const baileys = require('@whiskeysockets/baileys');
const { createWhatsAppClient } = require('../src/services/whatsappClient');

describe('whatsapp client service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOn.mockReset();
  });

  test('should create socket and register event listeners', async () => {
    const onConnectionUpdate = jest.fn();
    const onMessagesUpsert = jest.fn();

    const socket = await createWhatsAppClient({
      authDir: '/tmp/auth',
      onConnectionUpdate,
      onMessagesUpsert
    });

    expect(socket).toBe(mockSocket);
    expect(baileys.useMultiFileAuthState).toHaveBeenCalledWith('/tmp/auth');
    expect(mockOn).toHaveBeenCalledWith('connection.update', onConnectionUpdate);
    expect(mockOn).toHaveBeenCalledWith('messages.upsert', onMessagesUpsert);
    expect(mockOn).toHaveBeenCalledWith('creds.update', expect.any(Function));
  });
});
