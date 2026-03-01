# 贡献指南与开发工作流

感谢你对 WhatsApp OpenCode 的兴趣！本文档旨在规范开发流程，确保代码质量和协作效率。

## 🌳 Git 分支管理策略

本项目采用 **GitHub Flow** 的简化变体：

1.  **Main 分支 (`main`)**:
    - 始终保持可部署状态。
    - 所有的发布 tag 都打在这个分支上。
    - **禁止直接推送到 `main`**，必须通过 Pull Request 合并。

2.  **Feature 分支 (`feature/*`)**:
    - 用于开发新功能。
    - 命名规范: `feature/short-description` (例如: `feature/voice-message-support`)。
    - 从 `main` 分支切出。

3.  **Fix 分支 (`fix/*`)**:
    - 用于修复 Bug。
    - 命名规范: `fix/issue-description` (例如: `fix/login-timeout`)。

4.  **Docs 分支 (`docs/*`)**:
    - 仅用于文档更新。

### 提交规范 (Commit Message)

请遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档变更
- `style`: 代码格式调整（不影响逻辑）
- `refactor`: 重构（既不是新增功能也不是修改bug的代码变动）
- `test`: 增加测试
- `chore`: 构建过程或辅助工具的变动

示例: `feat(cli): add interactive setup command`

## 🔄 开发流程

1.  **创建分支**: `git checkout -b feature/my-awesome-feature`
2.  **开发与测试**: 编写代码并确保 `npm test` 通过。
3.  **提交代码**: `git commit -m "feat: description"`
4.  **推送分支**: `git push origin feature/my-awesome-feature`
5.  **发起 PR**: 在 GitHub 上创建 Pull Request。
6.  **代码审查**: 等待维护者审查并通过 CI 检查。
7.  **合并**: 审查通过后合并到 `main`。

## 🚀 发布流程

发布流程完全自动化（基于 GitHub Actions）：

1.  **准备发布**:
    - 更新 `package.json` 中的版本号。
    - 更新 `CHANGELOG.md` 或 `RELEASE_NOTES.md`。
    - 提交并推送到 `main`。

2.  **打标签**:
    - `git tag v2.0.0`
    - `git push origin v2.0.0`

3.  **自动发布**:
    - GitHub Action 检测到 `v*` 标签推送后，会自动运行测试。
    - 测试通过后，自动构建并发布到 npm。
    - 自动创建 GitHub Release。

## ✅ 测试规范

- **单元测试**: 使用 Jest，确保核心逻辑覆盖率 > 80%。
- **集成测试**: 关键流程（如 CLI 启动、消息处理）需有集成测试。
- **本地验证**: 发布前请按照 `docs/INTEGRATION_TEST_GUIDE.md` 进行手动验证。
