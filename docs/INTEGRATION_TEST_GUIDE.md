# 手动集成测试指南

由于 WhatsApp 登录需要扫描二维码，我们无法在 CI/CD 中完全自动化此过程。发布新版本前，请务必在本地执行此测试清单。

## 🛠️ 环境准备

1.  确保本地已安装 Node.js 18+。
2.  准备一部已登录 WhatsApp 的手机。
3.  准备一个用于测试的 OpenCode 模拟服务（或真实服务）。

## 🧪 测试清单

### 1. 纯净安装测试

```bash
# 在项目根目录
npm link
# 验证命令是否可用
wao --help
```

- [ ] `wao --help` 显示正确帮助信息。
- [ ] `wao setup` 启动向导。

### 2. 配置与启动

运行 `wao setup` 并完成配置：
- [ ] 检测 OpenCode 安装（如未安装提示安装）。
- [ ] 输入 SiliconFlow Key（选填）。
- [ ] 生成配置文件 `.env`。

运行 `wao start`：
- [ ] 终端显示二维码。
- [ ] 手机扫描成功登录。
- [ ] 终端显示 "Client is ready!"。

### 3. 核心功能验证 (WhatsApp 端操作)

**测试 1: 基础对话**
- 发送: `ping`
- 预期: 收到 OpenCode 回复（取决于后端逻辑，或者简单的 "pong" 如果配置了）。

**测试 2: 新会话**
- 发送: `/new`
- 预期: 回复 "New session started" 或类似提示，上下文被重置。

**测试 3: 语音转录 (需配置 SiliconFlow Key)**
- 发送: 一条语音消息
- 预期: 收到 "正在转录..." -> 收到转录后的文本 -> 收到 OpenCode 对该文本的回复。

**测试 4: 图片分析**
- 发送: 一张图片
- 预期: 收到 "Image received" -> 收到 OpenCode 对图片的分析结果。

**测试 5: 权限确认**
- 触发一个需要权限的操作（如果 OpenCode 有此功能，例如删除文件）。
- 预期: WhatsApp 收到 "Request permission..."。
- 回复: `yes`
- 预期: 操作继续执行。

### 4. 服务管理

```bash
wao status
wao logs
wao stop
```

- [ ] `wao status` 显示 `online`。
- [ ] `wao logs` 能看到刚才的消息日志。
- [ ] `wao stop` 成功停止服务，`wao status` 显示 `stopped` 或无服务。

## ✅ 验证完成

如果以上步骤全部通过，你可以放心地打 Tag 并发布了！
