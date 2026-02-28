# 🚀 WhatsApp OpenCode Bridge

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green?logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/WhatsApp-Baileys-25D366?logo=whatsapp" alt="WhatsApp">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
  <img src="https://img.shields.io/github/v/release/jinghai/whatsapp-opencode" alt="GitHub release">
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
  - 语音消息 - ASR自动转录（由 [硅基流动](https://cloud.siliconflow.cn/i/ouQu1EpG) 提供免费支持）

- 🔄 **智能处理**
  - 长任务进度通知
  - 输入状态实时显示
  - 自动超时处理和会话恢复

- 🛡️ **安全特性**
  - 手机号白名单限制
  - 敏感信息环境变量配置
  - 消息内容过滤

---

## 📋 环境要求

- Node.js >= 18
- OpenCode CLI 已安装并运行
- WhatsApp 账号

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/jinghai/whatsapp-opencode.git
cd whatsapp-opencode
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件
```

### 4. 启动 OpenCode 服务

```bash
# 启动 OpenCode API 服务
opencode serve --port 4096
```

### 5. 启动 Bridge

```bash
npm start
```

### 6. 连接 WhatsApp

首次运行会显示二维码，按照屏幕提示扫描连接。

---

## ⚙️ 配置说明

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `OPENCODE_URL` | OpenCode API 地址 | `http://127.0.0.1:4096` |
| `SILICONFLOW_KEY` | 硅基流动 API Key | - |
| `ALLOWLIST` | 允许的手机号(逗号分隔) | 所有用户 |

### 获取 SiliconFlow API Key

1. 访问 [硅基流动](https://cloud.siliconflow.cn/i/ouQu1EpG) （或 [官网](https://siliconflow.cn)）
2. 注册并创建 API Key
3. 复制 Key 到 `.env` 文件

> 🎁 **福利**：通过 [我的邀请链接](https://cloud.siliconflow.cn/i/ouQu1EpG) 注册，你我都能获得免费额度（RPM/TPM 更高，体验更好）！

---

## 📖 使用指南

### 基本操作

- **发送文本** - 直接在 WhatsApp 输入文字
- **发送图片** - 发送图片，自动保存并通知 OpenCode
- **发送语音** - 发送语音，自动转文字后处理

### 消息处理

- 简单任务：立即回复
- 长时间任务：
  - 10秒后显示"对方正在输入..."
  - 每5分钟发送进度通知
  - 10分钟超时自动创建新会话

---

## 🏗️ 架构

```
┌─────────────────┐
│   WhatsApp      │
│      App        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Baileys Library │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│    WhatsApp OpenCode Bridge │
│  • 消息处理                │
│  • 语音转录                │
│  • 会话管理                │
│  • 进度通知                │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│      OpenCode API           │
│   (http://localhost:4096)  │
└─────────────────────────────┘
```

---

## 🔧 高级配置

### PM2 进程管理（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start bridge.js --name whatsapp-opencode

# 查看日志
pm2 logs whatsapp-opencode

# 开机自启
pm2 startup
pm2 save
```

### Docker 部署

```bash
docker build -t whatsapp-opencode .
docker run -d \
  --name whatsapp-opencode \
  -v $(pwd)/auth:/app/auth \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/media:/app/media \
  -e OPENCODE_URL=http://host.docker.internal:4096 \
  -e SILICONFLOW_KEY=your_api_key \
  whatsapp-opencode
```

---

## 📁 目录结构

```
whatsapp-opencode/
├── auth/              # WhatsApp 认证信息
├── data/              # 会话状态数据
├── logs/              # 运行日志
├── media/             # 媒体文件(图片/语音)
├── node_modules/      # 依赖
├── bridge.js          # 主程序
├── package.json       # 项目配置
├── .env.example       # 环境变量示例
└── README.md          # 说明文档
```

---

## 🔢 版本管理

采用 [Semantic Versioning](https://semver.org/)：

- **MAJOR** (1.0.0): 不兼容的 API 变更
- **MINOR** (1.1.0): 向后兼容的新功能
- **PATCH** (1.0.1): 向后兼容的 bug 修复

### 发布流程

```bash
# 1. 更新版本
npm version patch  # 或 minor major

# 2. 推送到 GitHub
git push origin main
git push --tags

# 3. GitHub会自动创建 Release
```

---

## 📝 日志

日志保存在 `logs/` 目录：
- `wa-bridge.log` - 主日志

PM2 日志：
- `pm2 logs whatsapp-opencode`

---

## 🤝 贡献

欢迎提交 Issue 和 PR！

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 感谢

- [OpenCode](https://opencode.ai) - 开源 AI 编程助手
- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- [硅基流动](https://cloud.siliconflow.cn/i/ouQu1EpG) - 免费语音转录服务

---

<p align="center">
  如果这个项目对你有帮助，请给个 ⭐️ Star！
</p>
