# WhatsApp OpenCode Bridge v2.0.0 发布说明

我们很高兴宣布 WhatsApp OpenCode Bridge v2.0.0 的正式发布！本次更新带来了全新的 CLI 工具、更完善的多用户隔离机制以及增强的交互体验。

## 🌟 新特性亮点

### 1. 全新 CLI 命令行工具 (`wao`)
现在你可以像使用 `npm` 或 `git` 一样方便地管理服务：
- **一键安装配置**：`wao setup` 提供交互式向导，自动检测环境、安装依赖并生成配置文件。
- **后台服务管理**：内置 PM2 集成，通过 `wao start` 和 `wao stop` 轻松管理后台守护进程，确保服务 24/7 在线。
- **状态监控**：使用 `wao status` 和 `wao logs` 实时查看服务运行状态和日志。

### 2. 多用户会话隔离
- **独立上下文**：不同 WhatsApp 账号拥有完全独立的会话上下文，互不干扰。
- **自动清理**：闲置会话会自动清理，释放资源。
- **会话重置**：支持通过 `/new` 命令随时开启新对话。

### 3. 增强的交互体验
- **权限确认通知**：当 OpenCode 需要执行敏感操作（如删除文件）时，会直接向你的 WhatsApp 发送确认请求。
- **流式响应优化**：长文本回复会自动分段发送，避免消息过长导致的发送失败，提升阅读体验。
- **语音转录集成**：集成了[硅基流动](https://cloud.siliconflow.cn/i/ouQu1EpG)的高精度 ASR 服务，支持直接发送语音消息给助手。

## 🛠️ 安装与升级

### 全局安装
```bash
npm install -g whatsapp-opencode
```

### 快速开始
```bash
wao setup
wao start
```

## 📋 变更日志

- **Feature**: 新增 `wao` CLI 工具，支持 setup, start, stop, status, logs, config 命令。
- **Feature**: 实现基于 PM2 的后台服务守护。
- **Feature**: 重构 `sync.js`，支持多用户并发会话隔离。
- **Feature**: 新增权限确认交互流程。
- **Feature**: 集成硅基流动 API 用于语音转录。
- **Docs**: 全面更新 README，增加 CLI 使用文档。
- **Test**: 新增 CLI 和守护进程的集成测试，覆盖率提升。

## 🙏 致谢

感谢所有用户的反馈与支持！如果你遇到问题或有新的建议，欢迎在 GitHub 提交 Issue。
