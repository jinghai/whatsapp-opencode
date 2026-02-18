#!/bin/bash

# 本地测试脚本
# Usage: ./scripts/test.sh

set -e

echo "🧪 运行本地测试..."

# 单元测试
echo "📋 运行单元测试..."
npm test

# Lint检查
echo "🔍 运行代码检查..."
npm run lint

# 安全检查
echo "🔒 运行安全审计..."
npm audit --audit-level=moderate || true

# 测试覆盖率
echo "📊 检查测试覆盖率..."
npm run test:coverage

# 检查覆盖率阈值
COVERAGE=$(cat coverage/coverage-summary.json | grep -o '"pct":[0-9]*' | head -1 | cut -d: -f2)
if [ "$COVERAGE" -lt 80 ]; then
    echo "❌ 测试覆盖率低于 80%: $COVERAGE%"
    exit 1
fi

echo "✅ 所有测试通过！覆盖率: $COVERAGE%"
