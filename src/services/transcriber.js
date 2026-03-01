const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const DEFAULT_API = 'https://api.siliconflow.cn/v1/audio/transcriptions';
const DEFAULT_MODEL = 'FunAudioLLM/SenseVoiceSmall';

/**
 * 语音转文字
 */
async function transcribeAudio(options) {
  const { buffer, mediaDir, apiKey, apiUrl = DEFAULT_API, model = DEFAULT_MODEL } = options;
  const tempFile = path.join(mediaDir, `temp_${Date.now()}.ogg`);
  try {
    fs.writeFileSync(tempFile, buffer);
    const form = new FormData();
    form.append('file', fs.createReadStream(tempFile), { filename: 'audio.ogg', contentType: 'audio/ogg' });
    form.append('model', model);
    const res = await axios.post(apiUrl, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${apiKey}`
      },
      timeout: 30000
    });
    fs.unlinkSync(tempFile);
    return res.data.text || '[语音转文字失败]';
  } catch (error) {
    try {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    } catch (cleanupError) {
      void cleanupError;
    }
    return '[语音转文字失败]';
  }
}

module.exports = { transcribeAudio };
