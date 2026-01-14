#!/bin/bash

# 示例脚本: 手动获取RSS内容
# 用于测试手动获取功能

SERVER_URL="${SERVER_URL:-http://localhost:3000}"
RSS_URL="${1:-http://localhost:8001/feed/MP_WXS_3517365363.rss}"

echo "正在从服务器获取RSS: $SERVER_URL"
echo "RSS源: $RSS_URL"
echo ""

curl -s "$SERVER_URL/fetch?url=$RSS_URL"

echo ""
echo "获取完成！"
