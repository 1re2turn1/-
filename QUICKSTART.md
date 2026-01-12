# 快速开始指南

## 第一步: 安装依赖

```bash
npm install
```

## 第二步: 配置环境变量

```bash
cp .env.example .env
```

然后编辑 `.env` 文件，至少设置 `RSS_FEED_URL`。

## 第三步: 启动服务

```bash
npm start
```

## 测试服务

### 测试健康检查端点

```bash
curl http://localhost:3000/health
```

预期输出:
```json
{
  "status": "ok",
  "timestamp": "2026-01-12T15:30:00.000Z",
  "processedCount": 0
}
```

### 测试Webhook端点

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "rss_update",
    "url": "http://localhost:4000/rss/test"
  }'
```

### 测试手动获取RSS

```bash
curl "http://localhost:3000/fetch?url=http://localhost:4000/rss/test"
```

## 与we-mp-rss集成的完整示例

### 1. 启动we-mp-rss服务（Docker方式）

```bash
docker run -d \
  --name we-mp-rss \
  -p 4000:4000 \
  ghcr.io/hillerliao/we-mp-rss:latest
```

### 2. 访问we-mp-rss管理界面

打开浏览器访问 `http://localhost:4000`，添加你想订阅的微信公众号。

### 3. 获取RSS地址

添加公众号后，you会得到一个RSS地址，格式类似:
```
http://localhost:4000/rss/公众号名称
```

### 4. 配置本服务

编辑 `.env` 文件:
```env
RSS_FEED_URL=http://localhost:4000/rss/你的公众号名称
POLL_INTERVAL=300
```

### 5. 启动本服务

```bash
npm start
```

服务会自动每5分钟获取一次RSS更新。

## Webhook推送模式配置

如果你想使用Webhook推送而不是轮询：

1. 不要在 `.env` 中设置 `RSS_FEED_URL`
2. 配置你的RSS服务在有更新时POST到 `http://your-server:3000/webhook`
3. POST数据格式:
```json
{
  "type": "rss_update",
  "url": "http://localhost:4000/rss/公众号名称"
}
```

## 转发到其他服务

如果你想把获取的内容转发到其他服务（如Copilot Agent）:

在 `.env` 中设置:
```env
WEBHOOK_TARGET_URL=https://your-service.com/webhook
```

服务会自动将每篇新文章的信息POST到该地址，格式:
```json
{
  "title": "文章标题",
  "link": "文章链接",
  "content": "文章摘要",
  "pubDate": "发布日期",
  "author": "作者"
}
```

## 故障排查

### 问题: 无法连接到RSS源

确保RSS源URL正确并可访问:
```bash
curl http://localhost:4000/rss/公众号名称
```

### 问题: 端口被占用

修改 `.env` 中的 `PORT` 值:
```env
PORT=3001
```

### 问题: 依赖安装失败

清除缓存重新安装:
```bash
rm -rf node_modules package-lock.json
npm install
```
