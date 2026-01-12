# 微信公众号RSS自动读取服务

利用 we-mp-rss 以及 Webhook 推送模式实现自动读取微信公众号内容。

## 功能特点

- ✅ 支持 Webhook 推送模式接收RSS更新通知
- ✅ 支持手动触发RSS内容获取
- ✅ 支持定时自动轮询RSS源
- ✅ 自动去重，避免重复处理相同文章
- ✅ 可配置转发到其他Webhook进行后续处理
- ✅ 提供健康检查和状态查询接口

## 前置要求

1. **Node.js** (v14+)
2. **we-mp-rss服务** - 需要先部署一个we-mp-rss服务来提供微信公众号的RSS源

## we-mp-rss 部署说明

we-mp-rss 是一个将微信公众号文章转换为RSS订阅源的工具。你需要先部署它：

### 选项1: 使用Docker部署we-mp-rss

```bash
docker run -d \
  --name we-mp-rss \
  -p 4000:4000 \
  -e PORT=4000 \
  ghcr.io/hillerliao/we-mp-rss:latest
```

### 选项2: 从源码部署we-mp-rss

```bash
git clone https://github.com/hillerliao/we-mp-rss.git
cd we-mp-rss
npm install
npm start
```

部署完成后，访问 `http://localhost:4000` 添加你想要订阅的微信公众号。

## 安装步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 服务器配置
PORT=3000
HOST=0.0.0.0

# RSS 源配置 (从we-mp-rss获取)
RSS_FEED_URL=http://localhost:4000/rss/公众号名称

# Webhook 配置 (可选，用于转发处理后的内容)
WEBHOOK_TARGET_URL=https://your-webhook-endpoint.com/callback

# 轮询间隔（秒），默认300秒(5分钟)
POLL_INTERVAL=300
```

### 3. 启动服务

```bash
npm start
```

服务将在 `http://localhost:3000` 启动。

## 使用方式

### 方式1: Webhook推送模式（推荐）

配置你的RSS服务（如we-mp-rss）在有新文章时推送到本服务：

**Webhook端点：** `POST http://your-server:3000/webhook`

**推送格式：**
```json
{
  "type": "rss_update",
  "url": "http://localhost:4000/rss/公众号名称"
}
```

### 方式2: 手动触发获取

使用浏览器或curl访问：

```bash
curl "http://localhost:3000/fetch?url=http://localhost:4000/rss/公众号名称"
```

### 方式3: 自动定时轮询

在 `.env` 中配置 `RSS_FEED_URL` 和 `POLL_INTERVAL`，服务会自动定时获取RSS内容。

## API接口说明

### POST /webhook
接收RSS推送通知

**请求示例：**
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "rss_update",
    "url": "http://localhost:4000/rss/公众号名称"
  }'
```

### GET /fetch
手动获取RSS内容

**请求示例：**
```bash
curl "http://localhost:3000/fetch?url=http://localhost:4000/rss/公众号名称"
```

### GET /health
健康检查

**响应示例：**
```json
{
  "status": "ok",
  "timestamp": "2026-01-12T15:30:00.000Z",
  "processedCount": 42
}
```

### GET /status
查看处理状态

**响应示例：**
```json
{
  "processedCount": 42,
  "recentItems": ["article-id-1", "article-id-2"]
}
```

## 与Copilot Agent集成

本服务可以与GitHub Copilot Agent配合使用：

1. **自动化工作流**: 将获取到的微信公众号内容自动发送给Copilot Agent进行分析
2. **内容摘要**: 使用Copilot Agent生成文章摘要
3. **智能推荐**: 基于文章内容，Copilot Agent可以提供相关建议

### 配置Copilot Webhook

在 `.env` 中设置 `WEBHOOK_TARGET_URL` 为你的Copilot Agent webhook地址：

```env
WEBHOOK_TARGET_URL=https://your-copilot-webhook.com/process
```

服务会自动将新文章内容转发到该地址。

## 工作流程

```
微信公众号 
    ↓
we-mp-rss服务 (转换为RSS)
    ↓
本服务 (Webhook接收/定时轮询)
    ↓
处理和去重
    ↓
转发到目标Webhook (可选)
    ↓
Copilot Agent或其他服务
```

## 示例场景

### 场景1: 监控技术博客更新

```env
RSS_FEED_URL=http://localhost:4000/rss/阮一峰的网络日志
POLL_INTERVAL=600
WEBHOOK_TARGET_URL=https://your-notification-service.com/notify
```

### 场景2: 多个公众号聚合

创建多个webhook推送配置，或者在代码中扩展支持多RSS源。

## 故障排查

### 问题1: 无法连接到RSS源
- 检查 we-mp-rss 服务是否正常运行
- 确认 RSS_FEED_URL 配置正确
- 检查网络连接和防火墙设置

### 问题2: 文章重复处理
- 服务会自动去重，基于文章的 guid 或 link
- 重启服务会清空去重记录

### 问题3: Webhook转发失败
- 检查 WEBHOOK_TARGET_URL 是否可访问
- 查看日志中的错误信息
- 确认目标服务的接口格式

## 开发和扩展

### 自定义文章处理逻辑

编辑 `server.js` 中的 `processArticle` 函数：

```javascript
async function processArticle(article) {
  // 添加你的自定义逻辑
  // 例如：保存到数据库、发送邮件、生成摘要等
  console.log(`处理文章: ${article.title}`);
}
```

### 添加更多端点

```javascript
app.get('/my-custom-endpoint', (req, res) => {
  // 你的逻辑
});
```

## 许可证

MIT

## 相关资源

- [we-mp-rss GitHub仓库](https://github.com/hillerliao/we-mp-rss)
- [RSS Parser文档](https://www.npmjs.com/package/rss-parser)
- [Express.js文档](https://expressjs.com/)

## 贡献

欢迎提交Issue和Pull Request！
