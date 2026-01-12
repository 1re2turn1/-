# 示例脚本

这个目录包含了一些示例脚本，帮助你快速测试和使用微信公众号RSS服务。

## 脚本列表

### 1. check-status.sh - 检查服务状态

检查服务的健康状况和处理统计信息。

```bash
./examples/check-status.sh
```

**输出示例：**
```
=== 服务健康检查 ===
{"status":"ok","timestamp":"2026-01-12T15:30:00.000Z","processedCount":5}

=== 处理状态 ===
{"processedCount":5,"recentItems":["article-1","article-2"]}
```

### 2. test-fetch.sh - 手动获取RSS

手动触发RSS内容获取。

```bash
# 使用默认RSS URL
./examples/test-fetch.sh

# 指定RSS URL
./examples/test-fetch.sh "http://localhost:4000/rss/你的公众号"
```

**输出示例：**
```
正在从服务器获取RSS: http://localhost:3000
RSS源: http://localhost:4000/rss/示例公众号

{"success":true,"message":"成功获取3篇文章","items":[...]}
```

### 3. test-webhook.sh - 测试Webhook推送

模拟Webhook推送通知。

```bash
./examples/test-webhook.sh
```

**输出示例：**
```
正在发送Webhook推送到: http://localhost:3000/webhook
RSS源: http://localhost:4000/rss/示例公众号

{"success":true,"message":"已处理RSS更新"}
```

## 使用前提

1. 确保服务已经启动：
```bash
npm start
```

2. 如果测试we-mp-rss集成，确保we-mp-rss服务正在运行：
```bash
docker run -d -p 4000:4000 ghcr.io/hillerliao/we-mp-rss:latest
```

## 自定义脚本

你可以基于这些示例创建自己的脚本，例如：

### 定时检查脚本

```bash
#!/bin/bash
# monitor.sh - 每分钟检查一次服务状态

while true; do
  ./examples/check-status.sh
  sleep 60
done
```

### 批量获取多个RSS源

```bash
#!/bin/bash
# fetch-all.sh - 获取多个RSS源

RSS_URLS=(
  "http://localhost:4000/rss/公众号1"
  "http://localhost:4000/rss/公众号2"
  "http://localhost:4000/rss/公众号3"
)

for url in "${RSS_URLS[@]}"; do
  echo "获取: $url"
  ./examples/test-fetch.sh "$url"
  sleep 2
done
```

## 故障排查

### 脚本没有执行权限

```bash
chmod +x examples/*.sh
```

### 连接被拒绝

确保服务正在运行并监听正确的端口：
```bash
curl http://localhost:3000/health
```

### jq命令未找到

脚本不需要jq也能运行，但如果想要格式化输出，可以安装jq：
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq
```
