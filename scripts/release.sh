#!/bin/bash

# 发布脚本
# Usage: ./scripts/release.sh [patch|minor|major]

set -e

VERSION_TYPE=${1:-patch}

echo "🚀 发布 OpenCode WhatsApp Bridge"
echo "版本类型: $VERSION_TYPE"

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
npm test
npm run lint

# 运行本地集成测试
echo "🔍 运行集成测试..."
npm run test:integration

# 更新版本
echo "📦 更新版本..."
npm version $VERSION_TYPE

# 获取新版本号
NEW_VERSION=$(node -p "require('./package.json').version")
echo "✅ 新版本: v$NEW_VERSION"

# 推送代码和标签
echo "⬆️  推送到 GitHub..."
git push origin main --tags

echo "🎉 发布完成！"
echo ""
echo "GitHub Actions 将自动："
echo "  1. 运行 CI/CD 测试"
echo "  2. 创建 Release"
echo "  3. 发布到 NPM（如果配置了）"
echo ""
echo "查看发布状态：https://github.com/jinghai/opencode-whatsapp-bridge/actions"
