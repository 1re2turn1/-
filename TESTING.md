# 集成测试指南

本文档提供完整的集成测试步骤，验证系统与 we-mp-rss 的端到端集成。

## 前置条件

1. Docker 已安装并运行
2. Node.js 18+ 已安装
3. curl 命令可用

## 完整集成测试步骤

### 步骤 1: 启动 we-mp-rss 服务

```bash
# 使用 Docker 启动 we-mp-rss
docker run -d \
  --name we-mp-rss \
  -p 4000:4000 \
  ghcr.io/hillerliao/we-mp-rss:latest

# 等待服务启动
sleep 5

# 验证 we-mp-rss 运行状态
curl http://localhost:4000
```

**预期结果**: 返回 we-mp-rss 管理页面的 HTML

### 步骤 2: 配置本服务

```bash
# 创建配置文件
cp .env.example .env

# 编辑配置（根据实际情况修改）
cat > .env << 'EOF'
PORT=3000
HOST=0.0.0.0
RSS_FEED_URL=http://localhost:4000/rss/test
POLL_INTERVAL=60
WEBHOOK_TARGET_URL=
EOF
```

### 步骤 3: 启动本服务

```bash
# 方式A: 直接运行
npm start

# 方式B: 后台运行
npm start > server.log 2>&1 &
SERVER_PID=$!
```

### 步骤 4: 验证服务状态

```bash
# 检查健康状态
curl http://localhost:3000/health

# 预期输出:
# {"status":"ok","timestamp":"2026-01-12T...", "processedCount":0}

# 检查处理状态
curl http://localhost:3000/status

# 预期输出:
# {"processedCount":0,"recentItems":[]}
```

### 步骤 5: 在 we-mp-rss 中添加公众号

1. 打开浏览器访问: `http://localhost:4000`
2. 点击"添加公众号"
3. 输入公众号名称（如"人民日报"）
4. 记录生成的 RSS 地址，例如: `http://localhost:4000/rss/人民日报`

### 步骤 6: 测试手动获取

```bash
# 使用实际的 RSS 地址
RSS_URL="http://localhost:4000/rss/人民日报"

curl "http://localhost:3000/fetch?url=$RSS_URL"

# 预期输出:
# {"success":true,"message":"成功获取N篇文章","items":[...]}
```

### 步骤 7: 测试 Webhook 推送

```bash
# 模拟 RSS 更新通知
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"rss_update\",
    \"url\": \"http://localhost:4000/rss/人民日报\"
  }"

# 预期输出:
# {"success":true,"message":"已处理RSS更新"}
```

### 步骤 8: 验证文章处理

```bash
# 再次检查状态
curl http://localhost:3000/status

# 预期输出应该显示处理的文章数量增加:
# {"processedCount":N,"recentItems":["article-id-1","article-id-2",...]}
```

### 步骤 9: 测试自动轮询（可选）

如果配置了 `RSS_FEED_URL` 和 `POLL_INTERVAL`：

```bash
# 查看服务日志
tail -f server.log

# 应该看到类似的输出:
# === 开始定时获取RSS ===
# 正在获取RSS: http://localhost:4000/rss/人民日报
# RSS标题: ...
# 发现 N 篇文章
# === 定时获取完成 ===
```

### 步骤 10: 测试 Webhook 转发（可选）

如果配置了 `WEBHOOK_TARGET_URL`：

```bash
# 启动一个简单的 webhook 接收服务
python3 -m http.server 8080 &
TEST_SERVER_PID=$!

# 更新配置
export WEBHOOK_TARGET_URL=http://localhost:8080/callback

# 重启服务并触发获取
# 应该在 python http.server 日志中看到 POST 请求
```

## 使用 Docker Compose 的集成测试

### 快速启动

```bash
# 启动完整栈
docker-compose up -d

# 查看日志
docker-compose logs -f

# 等待服务启动
sleep 10
```

### 验证服务

```bash
# 检查容器状态
docker-compose ps

# 应该看到两个容器都在运行:
# - we-mp-rss
# - wechat-rss-webhook

# 测试 we-mp-rss
curl http://localhost:4000

# 测试 webhook 服务
curl http://localhost:3000/health
```

### 配置和测试

```bash
# 1. 访问 we-mp-rss 添加公众号
open http://localhost:4000

# 2. 更新 docker-compose.yml 中的 RSS_FEED_URL

# 3. 重启服务
docker-compose restart wechat-rss-webhook

# 4. 查看日志验证
docker-compose logs -f wechat-rss-webhook
```

### 清理

```bash
# 停止所有服务
docker-compose down

# 清理卷（可选）
docker-compose down -v
```

## 使用示例脚本测试

### 运行所有测试脚本

```bash
# 确保服务在运行
curl http://localhost:3000/health || npm start &

# 等待启动
sleep 3

# 运行状态检查
./examples/check-status.sh

# 测试手动获取
./examples/test-fetch.sh "http://localhost:4000/rss/test"

# 测试 Webhook
./examples/test-webhook.sh
```

## 故障排查

### we-mp-rss 无法启动

```bash
# 检查端口占用
lsof -i :4000

# 查看 Docker 日志
docker logs we-mp-rss

# 尝试重启
docker restart we-mp-rss
```

### 本服务无法连接 we-mp-rss

```bash
# 测试连接
curl http://localhost:4000/rss/test

# 检查网络
docker network ls
docker network inspect wechat-rss-network

# 在 Docker 内测试
docker exec -it wechat-rss-webhook sh
wget -O- http://we-mp-rss:4000
```

### RSS 解析失败

```bash
# 直接访问 RSS 源验证格式
curl http://localhost:4000/rss/公众号名称

# 检查 RSS 格式是否正确
curl http://localhost:4000/rss/公众号名称 | xmllint --format -
```

## 性能测试（可选）

### 压力测试 Webhook 端点

```bash
# 安装 Apache Bench
sudo apt-get install apache2-utils

# 发送 100 个请求，并发 10 个
ab -n 100 -c 10 -p webhook.json -T application/json \
  http://localhost:3000/webhook

# webhook.json 内容:
# {"type":"rss_update","url":"http://localhost:4000/rss/test"}
```

### 监控资源使用

```bash
# 使用 Docker stats
docker stats wechat-rss-webhook

# 使用 top
top -p $(pgrep -f "node server.js")
```

## 自动化测试脚本

创建完整的自动化测试脚本:

```bash
#!/bin/bash
# integration-test.sh

set -e

echo "开始集成测试..."

# 启动服务
docker-compose up -d
sleep 10

# 测试健康检查
echo "测试健康检查..."
curl -f http://localhost:3000/health || exit 1

# 测试 we-mp-rss
echo "测试 we-mp-rss..."
curl -f http://localhost:4000 || exit 1

# 测试 Webhook
echo "测试 Webhook 端点..."
curl -f -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}' || exit 1

# 清理
echo "清理环境..."
docker-compose down

echo "✅ 所有测试通过！"
```

## 结论

完成以上所有测试步骤后，系统应该能够：

- ✅ 正常启动和运行
- ✅ 与 we-mp-rss 正常通信
- ✅ 正确解析和处理 RSS 内容
- ✅ 响应 Webhook 推送
- ✅ 支持手动和自动获取
- ✅ 正确去重文章
- ✅ 可选转发到其他服务

如果所有测试都通过，系统已准备好用于生产环境！
