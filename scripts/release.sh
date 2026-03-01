#!/bin/bash

# 发布脚本
# Usage: ./scripts/release.sh [auto|patch|minor|major]

set -e

INPUT_TYPE=${1:-auto}

echo "🚀 发布 OpenCode WhatsApp Bridge"
echo "输入版本类型: $INPUT_TYPE"

if [ "$INPUT_TYPE" = "auto" ]; then
    VERSION_TYPE=$(node scripts/determine-version-bump.js auto)
else
    VERSION_TYPE=$INPUT_TYPE
fi

if [ "$VERSION_TYPE" = "none" ]; then
    echo "ℹ️  没有检测到 feat/fix 变更，不发布新版本"
    exit 0
fi

echo "最终版本类型: $VERSION_TYPE"

# 检查工作目录是否干净
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ 工作目录不干净，请先提交或暂存更改"
    git status
    exit 1
fi

# 拉取最新代码
echo "📥 拉取最新代码..."
git checkout main
git pull origin main

# 运行完整测试
echo "🧪 运行测试..."
npm run lint
npm run test:coverage

# 更新版本
echo "📦 更新版本..."
npm version "$VERSION_TYPE" --no-git-tag-version
git add package.json package-lock.json
NEW_VERSION=$(node -p "require('./package.json').version")
git commit -m "chore(release): v$NEW_VERSION"
git tag "v$NEW_VERSION"

# 获取新版本号
echo "✅ 新版本: v$NEW_VERSION"

# 推送代码和标签
echo "⬆️  推送到 GitHub..."
git push origin main
git push origin "v$NEW_VERSION"

echo "🎉 发布完成！"
echo ""
echo "GitHub Actions 将自动："
echo "  1. 运行 CI/CD 测试"
echo "  2. 创建 Release"
echo "  3. 发布到 NPM（如果配置了）"
echo ""
echo "查看发布状态：https://github.com/jinghai/whatsapp-opencode/actions"
