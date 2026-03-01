const axios = require('axios');

/**
 * 创建 OpenCode API 客户端
 */
function createOpenCodeClient(baseUrl) {
  const client = axios.create({
    baseURL: baseUrl,
    timeout: 30000
  });

  /**
   * 获取会话详情
   */
  async function getSession(sessionId) {
    const res = await client.get(`/session/${sessionId}`);
    return res.data;
  }

  /**
   * 创建新会话
   */
  async function createSession() {
    const res = await client.post('/session');
    return res.data;
  }

  /**
   * 拉取会话消息列表
   */
  async function listMessages(sessionId) {
    const res = await client.get(`/session/${sessionId}/message`);
    return res.data || [];
  }

  /**
   * 异步发送提示词
   */
  async function sendPromptAsync(sessionId, parts) {
    const res = await client.post(`/session/${sessionId}/prompt_async`, { parts });
    return res.data;
  }

  return {
    getSession,
    createSession,
    listMessages,
    sendPromptAsync
  };
}

module.exports = { createOpenCodeClient };
