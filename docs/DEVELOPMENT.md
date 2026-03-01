# Development Guide

## 环境

- Node.js `>=18`
- npm `>=9`
- 本地可访问 OpenCode 服务

## 本地开发

```bash
npm ci
cp .env.example .env
npm run lint
npm test
npm run dev
```

## 测试命令

```bash
npm test
npm run test:coverage
```

> 覆盖率门禁由 `jest.config.js` 的 `coverageThreshold` 控制，低于阈值即失败。

## 关键目录

- `src/bridge/`：消息同步主逻辑
- `src/services/`：OpenCode / WhatsApp / OCR / ASR 接口层
- `src/cli/commands/`：CLI 子命令
- `src/setup/`：初始化向导
- `tests/`：Jest 测试

## 图片处理策略

由 `OPENCODE_IMAGE_CAPABILITY` 控制：

- `direct`：直接发图片 part 给 OpenCode
- `ocr`：强制 DeepSeek OCR
- `auto`：直传失败自动 OCR 回退

OCR 使用 SiliconFlow `deepseek-ai/DeepSeek-OCR`。

## 守护进程说明

`wao start` 通过 PM2 启动，并显式设置 `SKIP_SETUP=true`，避免后台进程进入交互式 setup。
