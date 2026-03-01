# 🚀 WhatsApp OpenCode Bridge

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green?logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/WhatsApp-Baileys-25D366?logo=whatsapp" alt="WhatsApp">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
  <img src="https://img.shields.io/github/v/release/jinghai/whatsapp-opencode" alt="GitHub release">
</p>

<p align="center">
  <strong>通过 WhatsApp 控制 OpenCode AI 助手</strong><br>
  TUI 向导 | 守护进程 | 多用户隔离 | 流式响应
</p>

---

## ✨ 功能特性

- �️ **便捷 CLI 工具**
  - `wao` 命令行工具，提供交互式安装、配置和管理
  - `wao setup` 自动检查环境、安装依赖、生成配置
  - `wao start/stop` 后台服务管理，支持守护进程

- �📱 **完整消息支持**
  - 文本消息 - 双向实时同步，支持流式分段响应
  - 图片消息 - 自动保存到本地并分析
  - 语音消息 - ASR 自动转录（由 [硅基流动](https://cloud.siliconflow.cn/i/ouQu1EpG) 支持）

- 🔄 **高级交互**
  - **多用户隔离** - 不同 WhatsApp 账号拥有独立会话
  - **权限确认** - 敏感操作（如删除文件）需用户在 WhatsApp 确认
  - **会话管理** - 自动清理过期会话，支持 `/new` 重置会话

- 🛡️ **安全与稳定**
  - **无需公网 IP** - 通过 WhatsApp 中继，直接远程控制本地 OpenCode，无需复杂的内网穿透
  - 手机号白名单限制
  - 自动重连与超时处理
  - 进程守护与日志管理

---

## � 快速安装

使用 `npm` 全局安装 CLI 工具：

```bash
npm install -g whatsapp-opencode
```

或者直接使用 `npx` 运行：

```bash
npx whatsapp-opencode setup
```

---

## 📖 使用指南

### 1. 初始化配置

运行设置向导，它会自动检查 OpenCode 环境并引导配置：

```bash
wao setup
```

向导会帮助你：
- 检查/安装 OpenCode CLI
- 启动 OpenCode 服务
- 配置 API URL 和密钥
- 生成配置文件

### 2. 启动服务

启动后台守护进程：

```bash
wao start
```

### 3. 连接 WhatsApp

首次启动时，你需要扫描终端显示的二维码登录 WhatsApp。
登录成功后，你可以直接在 WhatsApp 中与你的 OpenCode 助手对话。

### 4. 常用命令

| 命令 | 说明 |
|------|------|
| `wao setup` | 运行交互式配置向导 |
| `wao start` | 启动后台服务 |
| `wao stop` | 停止后台服务 |
| `wao status` | 查看服务运行状态 (通过 PM2) |
| `wao logs` | 查看服务日志 |
| `wao config` | 查看当前配置 |

---

## ⚙️ 配置项

配置文件通常位于项目目录下的 `.env`。

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `OPENCODE_URL` | OpenCode API 地址 | `http://localhost:3000` |
| `SILICONFLOW_KEY` | 硅基流动 API Key (用于语音转录，[获取 Key](https://cloud.siliconflow.cn/i/ouQu1EpG)) | - |
| `ALLOWLIST` | 允许使用的手机号 (逗号分隔) | 空 (允许所有人) |
| `WORKING_DIR` | 工作数据目录 | 当前目录 |
| `DEBUG` | 开启调试日志 | `false` |

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。
