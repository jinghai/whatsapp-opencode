#!/bin/bash

# 开发环境启动脚本
# Usage: ./scripts/dev.sh

set -e

echo "🚀 启动 OpenCode WhatsApp Bridge 开发环境..."

# 检查环境
if [ ! -f .env ]; then
    echo "⚠️  .env 文件不存在，复制模板..."
    cp .env.example .env
    echo "📝 请编辑 .env 文件配置你的设置"
    exit 1
fi

# 检查依赖
if [ ! -d node_modules ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 检查 OpenCode 服务
echo "🔍 检查 OpenCode 服务..."
if ! curl -s http://127.0.0.1:4096/session > /dev/null 2>&1; then
    echo "⚠️  OpenCode 服务未运行，请先启动："
    echo "    opencode serve --port 4096"
    exit 1
fi

echo "✅ OpenCode 服务运行正常"

# 运行测试
echo "🧪 运行测试..."
npm test

# 启动开发模式
echo "🎯 启动开发模式..."
echo "修改代码会自动重启"
echo "按 Ctrl+C 停止"
npm run dev
