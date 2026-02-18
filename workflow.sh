#!/bin/bash

# WhatsApp Bridge 发布工作流脚本

WORKDIR="/root/workspace/opencode/opencode-whatsapp-bridge"

cd "$WORKDIR" || exit 1

case "$1" in
  "push")
    echo "📤 推送代码到GitHub..."
    git add -A
    echo "📝 输入提交信息:"
    read -r msg
    git commit -m "$msg"
    git push origin main
    echo "✅ 已推送!"
    ;;
  "release")
    echo "🏷️ 发布新版本..."
    echo "输入版本号 (如 1.02):"
    read -r version
    echo "输入版本说明:"
    read -r desc
    git add -A
    git commit -m "release: v$version - $desc"
    git tag -a "v$version" -m "$desc"
    git push origin main --tags
    echo "✅ 已发布 v$version!"
    ;;
  "sync")
    echo "🔄 同步到运行目录..."
    # 已经是符号链接，无需操作
    ls -la /root/whatsapp-opencode
    echo "✅ 运行目录已指向工作目录"
    ;;
  *)
    echo "用法:"
    echo "  ./workflow.sh push      - 提交并推送代码"
    echo "  ./workflow.sh release   - 发布新版本"
    echo "  ./workflow.sh sync      - 同步到运行目录"
    ;;
esac
