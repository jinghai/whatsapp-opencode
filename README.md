# 🚀 OpenCode WhatsApp Bridge

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green?logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/OpenCode-Compatible-blue" alt="OpenCode">
  <img src="https://img.shields.io/badge/WhatsApp-Baileys-25D366?logo=whatsapp" alt="WhatsApp">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>

<p align="center">
  <strong>通过 WhatsApp 控制 OpenCode AI 助手</strong><br>
  支持文本、图片、语音消息 | 多端实时同步 | 独立会话管理
</p>

---

## ✨ 功能特性

- 📱 **完整消息支持**
  - 文本消息 - 双向实时同步
  - 图片消息 - 自动保存到本地
  - 语音消息 - ASR自动转录（硅基流动SenseVoiceSmall）

- 🔄 **多端同步**
  - TUI端和WhatsApp消息实时同步
  - 独立session设计，不阻塞TUI操作
  - 消息状态持久化

- 🛡️ **安全特性**
  - 手机号白名单限制
  - 独立会话隔离
  - 敏感信息环境变量配置

## 📦 安装

### 前置要求

- Node.js >= 18
- OpenCode CLI 已安装
- WhatsApp 账号

### 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/jinghai/opencode-whatsapp-bridge.git
cd opencode-whatsapp-bridge

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件
```

## ⚙️ 配置

### 基础配置

```bash
# .env
OPENCODE_URL=http://127.0.0.1:4096
SILICONFLOW_KEY=your_siliconflow_api_key
ALLOWLIST=86138xxxx,86139xxxx  # 可选：限制手机号
```

### 获取 SiliconFlow API Key

1. 访问 [硅基流动](https://siliconflow.cn)
2. 注册并创建 API Key
3. 复制 Key 到 `.env` 文件

## 🚀 使用

### 1. 启动 OpenCode

```bash
opencode serve --port 4096
```

### 2. 启动 Bridge

```bash
npm start
```

### 3. 连接 WhatsApp

首次运行会显示二维码：

```
========================================
请用 WhatsApp 扫描二维码:
========================================

[二维码图片]

========================================
步骤：
1. 打开 WhatsApp 手机应用
2. 点击右上角 ⋮ → 已关联的设备
3. 点击 "关联新设备"
4. 扫描二维码
========================================
```

### 4. 开始使用

- **发送文本** - 直接在 WhatsApp 输入文字
- **发送图片** - 发送图片，OpenCode 会收到图片路径
- **发送语音** - 发送语音，自动转文字后处理

## 📸 使用示例

<!-- TODO: 添加截图 -->

### 文本消息
```
你：你好，帮我写一个Python脚本
AI：好的，我来帮你写一个Python脚本...
```

### 图片消息
```
你：[发送图片]
AI：收到图片，路径：/root/media/img_xxx.jpg
```

### 语音消息
```
你：[发送语音]
AI：🎤 转录："请帮我查询天气"
    📝 处理结果：...
```

## 🏗️ 架构

```
┌─────────────────┐
│  WhatsApp App   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Baileys Library │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│   Bridge Server         │
│  - 消息处理             │
│  - 语音转录             │
│  - Session管理          │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│   OpenCode API          │
│  (http://localhost:4096)│
└─────────────────────────┘
```

## 🔧 高级配置

### PM2 进程管理

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start src/bridge.js --name opencode-whatsapp

# 查看日志
pm2 logs opencode-whatsapp

# 开机自启
pm2 startup
pm2 save
```

### 多设备支持

每个手机号使用独立session：
```javascript
// 自动为每个手机号创建独立session
const sessionId = await createSession(phoneNumber);
```

## 📝 日志

日志保存在 `logs/` 目录：
- `wa-bridge.log` - 主日志
- `pm2-out.log` - PM2 输出
- `pm2-err.log` - 错误日志

## 🤝 贡献

欢迎提交 Issue 和 PR！

### 开发

```bash
# 安装开发依赖
npm install

# 运行开发模式
npm run dev
```

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 感谢

- [OpenCode](https://opencode.ai) - 开源AI编程助手
- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- [硅基流动](https://siliconflow.cn) - 语音转录服务

---

<p align="center">
  如果这个项目对你有帮助，请给个 ⭐️ Star！
</p>
