const axios = require('axios');

const DEFAULT_API = 'https://api.siliconflow.cn/v1/chat/completions';
const DEFAULT_MODEL = 'deepseek-ai/DeepSeek-OCR';

function toDataUrl(buffer, mimeType = 'image/jpeg') {
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

function extractTextFromResponse(data) {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === 'string') {
    return content.trim();
  }
  if (Array.isArray(content)) {
    const joined = content
      .map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item.text === 'string') return item.text;
        return '';
      })
      .filter(Boolean)
      .join('\n')
      .trim();
    return joined;
  }
  return '';
}

async function transcribeImage(options) {
  const {
    buffer,
    apiKey,
    mimeType = 'image/jpeg',
    apiUrl = DEFAULT_API,
    model = DEFAULT_MODEL
  } = options || {};

  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('OCR 失败: 缺少有效图片数据');
  }
  if (!apiKey) {
    throw new Error('OCR 失败: 缺少 SILICONFLOW_KEY');
  }

  const dataUrl = toDataUrl(buffer, mimeType);
  const payload = {
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: '请识别图片中的全部文字并原样输出。' },
          { type: 'image_url', image_url: { url: dataUrl } }
        ]
      }
    ]
  };

  const res = await axios.post(apiUrl, payload, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 30000
  });

  const text = extractTextFromResponse(res.data);
  if (!text) {
    throw new Error('OCR 失败: 未识别出文本');
  }
  return text;
}

module.exports = {
  transcribeImage,
  DEFAULT_API,
  DEFAULT_MODEL
};
