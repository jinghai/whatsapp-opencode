# 🔄 本地开发 ➜ GitHub 发布 完整工作流

## 工作流概览

```
┌─────────────────────────────────────────────────────────────────────┐
│                     本地开发环境 (你的电脑)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1️⃣ 创建功能分支                                                     │
│     git checkout -b feature/xxx                                     │
│                                                                      │
│  2️⃣ 编写代码 + 本地测试                                              │
│     ./scripts/dev.sh                                                │
│                                                                      │
│  3️⃣ 完整测试验证                                                     │
│     ./scripts/test.sh                                               │
│       ├─ ✅ 单元测试 (Jest)                                         │
│       ├─ ✅ 代码规范 (ESLint)                                       │
│       ├─ ✅ 安全审计 (npm audit)                                    │
│       └─ ✅ 覆盖率检查 (>80%)                                       │
│                                                                      │
│  4️⃣ 提交代码                                                         │
│     git commit -m "feat: 添加xxx功能"                                │
│                                                                      │
└────────────────────┬─────────────────────────────────────────────────┘
                     │
                     │ 推送代码
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     GitHub Pull Request                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  5️⃣ 创建 PR                                                          │
│     git push origin feature/xxx                                     │
│                                                                      │
│  6️⃣ 自动化检查 (GitHub Actions)                                      │
│     ├─ 🔄 运行测试套件                                              │
│     ├─ 🔍 代码审查                                                  │
│     ├─ 📝 Commit message检查                                        │
│     └─ 📊 覆盖率验证                                                │
│                                                                      │
│  7️⃣ 人工代码审查                                                     │
│     ├─ 功能是否符合预期                                             │
│     ├─ 代码质量是否达标                                             │
│     └─ 是否有潜在问题                                               │
│                                                                      │
└────────────────────┬─────────────────────────────────────────────────┘
                     │
                     │ Review通过
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     合并到 main 分支                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  8️⃣ 合并 PR                                                          │
│     git merge feature/xxx                                           │
│                                                                      │
└────────────────────┬─────────────────────────────────────────────────┘
                     │
                     │ 触发 CI/CD
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     CI/CD 自动化发布                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  9️⃣ 自动化测试                                                       │
│     ├─ Node.js 18.x & 20.x 测试                                     │
│     ├─ ESLint 检查                                                  │
│     ├─ 安全漏洞扫描                                                 │
│     └─ CodeQL 分析                                                  │
│                                                                      │
│  🔟 发布版本                                                         │
│     ├─ 创建 Git Tag                                                 │
│     ├─ 生成 Release Notes                                           │
│     ├─ 发布 GitHub Release                                          │
│     └─ (可选) 发布到 NPM                                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 快速参考

### 日常开发命令

```bash
# 启动开发环境
cd /root/workspace/opencode/opencode-whatsapp-bridge
./scripts/dev.sh

# 运行所有测试
./scripts/test.sh

# 提交代码
git add .
git commit -m "feat: 添加新功能"
git push origin feature/xxx
```

### 发布新版本

```bash
# 补丁版本 (v1.0.0 -> v1.0.1)
./scripts/release.sh patch

# 次要版本 (v1.0.0 -> v1.1.0)
./scripts/release.sh minor

# 主要版本 (v1.0.0 -> v2.0.0)
./scripts/release.sh major
```

## 质量保证检查清单

### 提交前检查

- [ ] 代码能正常运行，没有明显错误
- [ ] 新功能有基本的测试覆盖
- [ ] 代码通过 ESLint 检查
- [ ] 没有敏感信息泄露
- [ ] Commit message 符合规范

### PR 要求

- [ ] 所有自动化测试通过
- [ ] 代码覆盖率 >= 80%
- [ ] 没有安全漏洞（Critical/High）
- [ ] 代码审查通过
- [ ] 文档已更新

### 发布前检查

- [ ] 完整测试套件通过
- [ ] 集成测试通过
- [ ] 版本号已更新
- [ ] CHANGELOG 已更新
- [ ] 所有检查点通过

## 项目结构

```
workspace/opencode/
└── opencode-whatsapp-bridge/
    ├── .github/
    │   └── workflows/           # GitHub Actions CI/CD
    │       ├── ci.yml
    │       └── pr-check.yml
    ├── scripts/                 # 开发脚本
    │   ├── dev.sh              # 启动开发环境
    │   ├── test.sh             # 运行完整测试
    │   └── release.sh          # 发布新版本
    ├── src/
    │   └── bridge.js           # 主要代码
    ├── tests/                   # 测试文件
    │   ├── bridge.test.js
    │   └── setup.js
    ├── docs/
    │   └── DEVELOPMENT.md       # 开发文档
    ├── Dockerfile              # Docker 配置
    ├── package.json
    ├── README.md
    └── LICENSE
```

## 关键文件说明

| 文件 | 用途 |
|------|------|
| `scripts/dev.sh` | 本地开发启动脚本，自动检查环境和依赖 |
| `scripts/test.sh` | 完整测试脚本，运行单元测试、lint、安全审计 |
| `scripts/release.sh` | 发布脚本，自动测试、版本更新、推送标签 |
| `.github/workflows/ci.yml` | CI/CD 主流程，测试、构建、发布 |
| `.github/workflows/pr-check.yml` | PR 检查，确保代码质量 |
| `jest.config.js` | Jest 测试配置 |
| `.eslintrc.js` | ESLint 代码规范配置 |
| `.commitlintrc.json` | Commit message 规范配置 |

## 安全提示

⚠️ **永远不要提交以下内容到 GitHub：**

- `.env` 文件
- API Keys 和 Tokens
- 私钥文件
- 数据库密码
- WhatsApp 认证文件 (`auth/`)

这些内容已在 `.gitignore` 中排除。

## 问题排查

### 测试失败

```bash
# 查看详细错误
npm test -- --verbose

# 只运行失败的测试
npm test -- --onlyFailures

# 生成覆盖率报告
npm run test:coverage
```

### 代码规范问题

```bash
# 自动修复
npm run lint:fix

# 检查具体文件
npx eslint src/bridge.js
```

### 发布失败

```bash
# 检查本地状态
git status

# 确保工作目录干净
git stash

# 重新拉取最新代码
git pull origin main
```

## 下一步

你的工程流程已经建立完成！现在可以：

1. **开始开发新功能**
   ```bash
   git checkout -b feature/my-feature
   ./scripts/dev.sh
   ```

2. **创建测试用例**
   - 在 `tests/` 目录添加测试文件
   - 运行 `./scripts/test.sh` 验证

3. **查看 CI/CD 状态**
   - 访问 https://github.com/jinghai/opencode-whatsapp-bridge/actions

4. **发布新版本**
   ```bash
   ./scripts/release.sh patch
   ```

---

**记住：先本地测试，再推送到 GitHub！** 🧪➡️🚀
