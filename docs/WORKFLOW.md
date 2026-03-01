# Workflow

## 开发流程

1. 从 `main` 创建功能分支
2. 代码 + 测试（TDD）
3. 本地验证：
   - `npm run lint`
   - `npm test`
   - `npm run test:coverage`
4. 提交并发起 PR

## CI 流程

- `ci.yml`：在 `push/pull_request` 执行 `lint + test:coverage`
- `pr-check.yml`：执行 lint、commitlint、测试与覆盖率检查
- 覆盖率由 Jest 阈值门禁，不再使用硬编码“>80%”文案

## 版本规则（架构.功能.修复）

- `major`：架构代际，手动触发
- `minor`：功能特性（检测到 `feat:` 自动升级）
- `patch`：缺陷修复（检测到 `fix:` 自动升级）

自动流程由 `.github/workflows/auto-version.yml` + `scripts/determine-version-bump.js` 实现。

## 发布流程

1. `auto-version.yml` 在 `main` 自动识别版本升级并创建 tag
2. `release.yml` 在 `v*` tag 上执行：
   - `lint`
   - `test:coverage`
   - `npm publish`
   - GitHub Release 生成

## 本地手工发布

```bash
./scripts/release.sh auto
```

也可手动指定：

```bash
./scripts/release.sh major
./scripts/release.sh minor
./scripts/release.sh patch
```
