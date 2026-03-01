# Integration Test Guide

由于 WhatsApp 登录依赖扫码，本项目集成测试需人工执行。

## 前置条件

- 已安装 Node.js 18+
- 已配置 `.env`
- 手机已登录 WhatsApp
- OpenCode 服务可访问

## 测试步骤

1. 启动服务：

```bash
wao setup
wao start
```

2. 在 WhatsApp 端验证：

- 文本消息可正常往返
- `/new` 可创建新会话
- 语音消息可转文字（配置 `SILICONFLOW_KEY` 时）
- 图片消息流程：
  - `direct` 模式：直接由 OpenCode 处理图片
  - `ocr` 模式：先 OCR，再把识别文字发给 OpenCode
  - `auto` 模式：直传失败时应回退到 OCR
- 需要审批的工具调用会收到提醒消息

3. 运维命令：

```bash
wao status
wao logs
wao stop
```

## 通过标准

- CLI 命令行为符合预期
- 消息双向同步稳定
- 图片与语音处理符合配置策略
- 日志可追踪，无未处理异常
