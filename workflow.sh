#!/bin/bash
# WhatsApp OpenCode Bridge - 版本管理和发布脚本

set -e

VERSION=$(node -p "require('./package.json').version")
PROJECT_DIR=$(pwd)

echo "========================================"
echo "  WhatsApp OpenCode Bridge v${VERSION}"
echo "========================================"
echo ""

show_help() {
  echo "用法: ./workflow.sh [命令]"
  echo ""
  echo "命令:"
  echo "  status      - 查看当前状态"
  echo "  patch       - 发布补丁版本 (1.0.0 -> 1.0.1)"
  echo "  minor       - 发布次要版本 (1.0.0 -> 1.1.0)"
  echo "  major       - 发布主要版本 (1.0.0 -> 2.0.0)"
  echo "  release     - 创建 GitHub Release"
  echo "  restart     - 重启 PM2 服务"
  echo "  logs        - 查看日志"
  echo "  help        - 显示帮助"
  echo ""
}

show_status() {
  echo "📋 当前状态:"
  echo "  版本: v${VERSION}"
  echo "  目录: ${PROJECT_DIR}"
  echo ""
  echo "📦 PM2 状态:"
  pm2 show whatsapp-opencode 2>/dev/null | grep -E "status|version|uptime|script" || echo "  服务未运行"
  echo ""
  echo "📝 Git 状态:"
  git status -s
  echo ""
  echo "🏷️  最新标签:"
  git describe --tags 2>/dev/null || echo "  无标签"
  echo ""
}

bump_version() {
  local type=$1
  local old_version=$VERSION
  
  # 更新版本号
  npm version $type --no-git-tag-version 2>/dev/null
  local new_version=$(node -p "require('./package.json').version")
  
  echo "📈 版本更新: $old_version -> $new_version"
  
  # 提交更改
  git add package.json
  git commit -m "chore: release v$new_version"
  
  # 创建标签
  git tag -a "v$new_version" -m "Release v$new_version"
  
  echo "✅ 已创建标签: v$new_version"
  echo ""
  echo "运行以下命令发布到 GitHub:"
  echo "  git push origin main --tags"
  echo "  ./workflow.sh release"
}

create_release() {
  local tag="v${VERSION}"
  echo "🚀 创建 GitHub Release: $tag"
  
  gh release create "$tag" \
    --title "WhatsApp OpenCode Bridge $tag" \
    --generate-notes \
    --target main
  
  echo "✅ Release 创建成功!"
  echo "🔗 https://github.com/jinghai/whatsapp-opencode/releases/tag/$tag"
}

restart_service() {
  echo "🔄 重启 PM2 服务..."
  pm2 restart whatsapp-opencode
  sleep 2
  pm2 logs whatsapp-opencode --lines 5 --nostream
}

case "${1:-help}" in
  status)
    show_status
    ;;
  patch)
    bump_version patch
    ;;
  minor)
    bump_version minor
    ;;
  major)
    bump_version major
    ;;
  release)
    create_release
    ;;
  restart)
    restart_service
    ;;
  logs)
    pm2 logs whatsapp-opencode
    ;;
  help|*)
    show_help
    ;;
esac
