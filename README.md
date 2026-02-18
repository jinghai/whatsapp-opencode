# OpenCode WhatsApp Bridge

通过 WhatsApp 控制 OpenCode AI 助手。支持文本、图片、语音消息，保持多端同步。

## 功能特性

- ✅ **文本消息** - 完整的双向同步
- ✅ **图片消息** - 自动保存并分析
- ✅ **语音消息** - ASR转录（支持硅基流动SenseVoiceSmall）
- ✅ **多会话管理** - WhatsApp独立session，不阻塞TUI
- ✅ **实时同步** - TUI和WhatsApp消息实时同步

## 快速开始

### 1. 安装

```bash
# 克隆项目
git clone https://github.com/yourusername/opencode-whatsapp-bridge.git
cd opencode-whatsapp-bridge

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的配置
```

### 2. 配置

```bash
# .env 文件
OPENCODE_URL=http://127.0.0.1:4096
SILICONFLOW_KEY=your_siliconflow_api_key
ALLOWLIST=  # 可选：限制特定手机号，用逗号分隔
```

### 3. 运行

```bash
# 启动 OpenCode serve
opencode serve --port 4096

# 启动 bridge（新终端）
npm start
```

### 4. 连接 WhatsApp

运行后会显示二维码，用 WhatsApp 扫描即可连接。

## 使用方法

1. **发送文本** - 直接在 WhatsApp 发送消息
2. **发送图片** - 发送图片，OpenCode 会分析内容
3. **发送语音** - 发送语音消息，自动转文字后处理

## 架构

```
WhatsApp Client (Baileys)
         ↓
   Bridge Server
         ↓
OpenCode API (HTTP)
```

## 贡献

欢迎提交 PR 和 Issue！

## 许可证

MIT
