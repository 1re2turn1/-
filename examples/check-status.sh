#!/bin/bash

# 示例脚本: 检查服务状态
# 用于监控服务运行状态

SERVER_URL="${SERVER_URL:-http://localhost:3000}"

echo "=== 服务健康检查 ==="
curl -s "$SERVER_URL/health"
echo ""
echo ""

echo "=== 处理状态 ==="
curl -s "$SERVER_URL/status"
echo ""
echo ""

echo "检查完成！"
