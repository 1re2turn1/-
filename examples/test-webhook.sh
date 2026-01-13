#!/bin/bash

# 示例脚本: 模拟Webhook推送
# 用于测试Webhook端点功能

WEBHOOK_URL="${WEBHOOK_URL:-http://localhost:3000/webhook}"
RSS_URL="http://localhost:8001/rss/示例公众号"

echo "正在发送Webhook推送到: $WEBHOOK_URL"
echo "RSS源: $RSS_URL"
echo ""

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"rss_update\",
    \"url\": \"$RSS_URL\"
  }"

echo ""
echo "推送完成！"
