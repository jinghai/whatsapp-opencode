jest.mock('axios', () => {
  const create = jest.fn();
  const post = jest.fn();
  return { create, post };
});

const axios = require('axios');

describe('Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('OpenCode client should send parts payload as-is', async () => {
    const mockGet = jest.fn().mockResolvedValue({ data: [] });
    const mockPost = jest.fn().mockResolvedValue({ data: { ok: true } });
    axios.create.mockReturnValue({
      get: mockGet,
      post: mockPost
    });

    const { createOpenCodeClient } = require('../src/services/opencodeClient');
    const client = createOpenCodeClient('http://localhost:4096');

    const parts = [
      { type: 'text', text: 'hello' },
      { type: 'image', image: { data_url: 'data:image/jpeg;base64,abc' } }
    ];

    await client.sendPromptAsync('sid-1', parts);

    expect(mockPost).toHaveBeenCalledWith('/session/sid-1/prompt_async', { parts });
  });

  test('OCR service should call DeepSeek-OCR model and return text', async () => {
    axios.post.mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content: '识别出的文本'
            }
          }
        ]
      }
    });

    const { transcribeImage } = require('../src/services/ocr');
    const text = await transcribeImage({
      buffer: Buffer.from('fake-image'),
      apiKey: 'sk-test'
    });

    expect(text).toBe('识别出的文本');
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/chat/completions'),
      expect.objectContaining({
        model: 'deepseek-ai/DeepSeek-OCR'
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test'
        })
      })
    );
  });
});
