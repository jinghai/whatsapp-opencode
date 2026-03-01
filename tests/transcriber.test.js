jest.mock('axios', () => ({
  post: jest.fn()
}));

jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  existsSync: jest.fn(),
  createReadStream: jest.fn()
}));

jest.mock('form-data', () => {
  return jest.fn().mockImplementation(() => ({
    append: jest.fn(),
    getHeaders: jest.fn(() => ({ 'content-type': 'multipart/form-data' }))
  }));
});

const axios = require('axios');
const fs = require('fs');
const { transcribeAudio } = require('../src/services/transcriber');

describe('transcriber service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return transcription text on success', async () => {
    axios.post.mockResolvedValue({ data: { text: 'hello world' } });
    fs.createReadStream.mockReturnValue({});

    const text = await transcribeAudio({
      buffer: Buffer.from('audio'),
      mediaDir: '/tmp',
      apiKey: 'sk-test'
    });

    expect(text).toBe('hello world');
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(fs.unlinkSync).toHaveBeenCalled();
  });

  test('should return fallback text on failure and cleanup temp file', async () => {
    axios.post.mockRejectedValue(new Error('network'));
    fs.existsSync.mockReturnValue(true);

    const text = await transcribeAudio({
      buffer: Buffer.from('audio'),
      mediaDir: '/tmp',
      apiKey: 'sk-test'
    });

    expect(text).toBe('[语音转文字失败]');
    expect(fs.unlinkSync).toHaveBeenCalled();
  });
});
