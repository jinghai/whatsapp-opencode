# 🔄 本地开发 ➜ GitHub 发布 工作流

## 工作流概览

```
本地开发
  ├─ 创建功能分支
  ├─ 编写代码 + 本地测试
  ├─ 完整测试验证
  └─ 提交代码
        ↓
GitHub Pull Request
  ├─ 自动化检查
  └─ 人工代码审查
        ↓
合并到 main
        ↓
CI/CD 自动发布
```

## 快速参考

### 日常开发命令

```bash
# 启动开发环境
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
- [ ] 文档已更新

## 项目结构

```
whatsapp-opencode/
├── .github/workflows/
├── scripts/
├── src/
│   ├── index.js
│   ├── config/
│   ├── services/
│   └── bridge/
├── tests/
├── docs/
│   ├── INDEX.md
│   ├── DEVELOPMENT.md
│   └── WORKFLOW.md
├── package.json
├── .env.example
└── README.md
```

## 关键文件说明

| 文件 | 用途 |
|------|------|
| `scripts/dev.sh` | 本地开发启动脚本，自动检查环境和依赖 |
| `scripts/test.sh` | 完整测试脚本，运行单元测试、lint、安全审计 |
| `scripts/release.sh` | 发布脚本，自动测试、版本更新、推送标签 |
| `.github/workflows/ci.yml` | CI/CD 主流程，测试与构建 |
| `.github/workflows/pr-check.yml` | PR 检查，确保代码质量 |
| `jest.config.js` | Jest 测试配置 |
| `.eslintrc.js` | ESLint 代码规范配置 |
| `.commitlintrc.json` | Commit message 规范配置 |

## 安全提示

- 不要提交 `.env`
- 不要提交 API Keys 和 Tokens
- 不要提交 WhatsApp 认证文件 `auth/`
