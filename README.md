# WhatsApp OpenCode Bridge

通过 WhatsApp 远程驱动 OpenCode 的本地桥接服务，支持多用户会话隔离、流式回复、图片与语音消息处理。

## 主要特性

- CLI 管理：`wao setup/start/stop/status/logs/config`
- 多用户隔离：每个 WhatsApp 用户独立 OpenCode Session
- 流式回复：长文本分段推送到 WhatsApp
- 图片处理（新增）：
  - `OPENCODE_IMAGE_CAPABILITY=direct`：图片直接发给 OpenCode
  - `OPENCODE_IMAGE_CAPABILITY=ocr`：图片先经 DeepSeek OCR 转文字
  - `OPENCODE_IMAGE_CAPABILITY=auto`（默认）：先直传，不支持则自动 OCR 回退
- 语音转文字：SiliconFlow ASR（可选）

## 安装

```bash
npm install -g whatsapp-opencode
```

或：

```bash
npx whatsapp-opencode setup
```

## 快速开始

1. 初始化：

```bash
wao setup
```

2. 启动后台服务：

```bash
wao start
```

3. 首次启动扫码登录 WhatsApp。

## 配置项

默认读取项目目录 `.env`：

| 变量 | 说明 | 默认值 |
|---|---|---|
| `OPENCODE_URL` | OpenCode API 地址 | `http://127.0.0.1:4096` |
| `SILICONFLOW_KEY` | SiliconFlow Key（语音/图片 OCR 可选） | 空 |
| `ALLOWLIST` | 允许手机号（逗号分隔，空表示不限制） | 空 |
| `OPENCODE_IMAGE_CAPABILITY` | `auto` \| `direct` \| `ocr` | `auto` |
| `WORKING_DIR` | 工作目录（auth/logs/media/data） | 当前目录 |
| `DEBUG` | 调试日志 | `false` |

## 命令

| 命令 | 说明 |
|---|---|
| `wao setup` | 运行交互式配置向导 |
| `wao start` | 启动后台服务（PM2） |
| `wao stop` | 停止后台服务 |
| `wao status` | 查看服务状态 |
| `wao logs` | 查看日志 |
| `wao config` | 查看当前配置（密钥脱敏） |

## Docker

镜像默认以 `SKIP_SETUP=true` 启动 `src/index.js`，适合非交互运行。

```bash
docker build -t whatsapp-opencode .
docker run --rm -it -v "$(pwd)":/app whatsapp-opencode
```

## 版本规则

本项目版本采用三段式语义，但语义定义为：

- 第一位（`major`）：架构代际，手动升级
- 第二位（`minor`）：新功能特性（`feat:` 自动触发）
- 第三位（`patch`）：缺陷修复（`fix:` 自动触发）

CI/CD 中已接入自动识别与打 tag 流程（详见 `docs/WORKFLOW.md`）。

## 开发与测试

```bash
npm ci
npm run lint
npm test
npm run test:coverage
```

## 许可证

[MIT](LICENSE)
