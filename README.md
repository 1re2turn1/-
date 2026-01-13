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

we-mp-rss (WeRSS) 是一个将微信公众号文章转换为RSS订阅源的工具。你需要先部署它：

### 使用Docker部署we-mp-rss（推荐）

**在你的服务器或本地电脑的终端中运行以下命令：**

```bash
# 创建数据目录（用于持久化存储）
mkdir -p ./data

# 启动we-mp-rss容器
docker run -d \
  --name we-mp-rss \
  -p 8001:8001 \
  -v ./data:/app/data \
  ghcr.io/rachelos/we-mp-rss:latest
```

**预期结果：**
```
Unable to find image 'ghcr.io/rachelos/we-mp-rss:latest' locally
latest: Pulling from rachelos/we-mp-rss
...
Status: Downloaded newer image for ghcr.io/rachelos/we-mp-rss:latest
a1b2c3d4e5f6... (容器ID)
```

**验证部署成功：**

1. 检查容器是否运行：
```bash
docker ps | grep we-mp-rss
```
预期看到容器状态为 `Up`。

2. 检查服务是否可访问：
```bash
curl http://localhost:8001
```
预期返回HTML页面内容（we-mp-rss的管理界面）。

3. 或者在浏览器中访问 `http://localhost:8001`，应该能看到we-mp-rss的Web管理界面。

> **注意**: 
> - we-mp-rss 默认使用端口 **8001**
> - 数据会保存到 `./data` 目录中，容器重启后数据不会丢失
> - 如果端口8001已被占用，可以修改为其他端口，如：`-p 8002:8001`

### we-mp-rss 配置步骤

部署完成后，需要在we-mp-rss中添加微信公众号：

**步骤1：访问管理界面**
- 在浏览器中打开 `http://localhost:8001`
- 预期看到：we-mp-rss的首页，显示"添加订阅"等操作按钮

**步骤2：添加公众号订阅**
1. 点击"添加订阅"或类似按钮
2. 输入微信公众号的名称或ID
   - 例如：`人民日报`、`科技美学` 等
3. 点击"确认"或"添加"按钮
4. 等待系统抓取文章（首次可能需要几分钟）

**步骤3：获取RSS地址**
- 添加成功后，页面会显示该公众号的RSS订阅链接
- RSS地址格式：`http://localhost:8001/rss/公众号名称`
- 例如：`http://localhost:8001/rss/人民日报`

**步骤4：测试RSS源**
```bash
# 替换为你的实际公众号名称
curl "http://localhost:8001/rss/人民日报"
```

**预期结果：**
返回XML格式的RSS内容，包含文章列表：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>人民日报</title>
    <item>
      <title>文章标题</title>
      <link>文章链接</link>
      ...
    </item>
  </channel>
</rss>
```

**如何判断配置成功：**
- ✅ 能够访问we-mp-rss管理界面
- ✅ 成功添加公众号订阅
- ✅ RSS地址返回XML格式的文章列表
- ✅ 文章列表中至少有一篇文章

> **详细配置说明**: 
> - we-mp-rss使用Python开发，基于FastAPI框架
> - 数据存储在SQLite数据库中（位于./data目录）
> - 支持多个公众号同时订阅
> - 更多高级配置请参考 [we-mp-rss 官方文档](https://github.com/rachelos/we-mp-rss)

## 安装步骤

### 1. 安装依赖

**在项目根目录运行：**

```bash
cd /home/runner/work/AutoWechat/AutoWechat  # 进入项目目录
npm install
```

**预期结果：**
```
added 83 packages, and audited 84 packages in 4s

19 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

**如何判断成功：**
- ✅ 没有报错信息
- ✅ 生成了 `node_modules` 目录
- ✅ 生成或更新了 `package-lock.json` 文件

### 2. 配置环境变量（必需）

本项目使用环境变量进行配置。请按以下步骤配置：

**步骤 1**: 复制环境变量模板文件

**在项目根目录运行：**
```bash
cp .env.example .env
```

**预期结果：**
在项目根目录下生成 `.env` 文件。

**验证：**
```bash
ls -la .env
```
应该能看到 `.env` 文件。

**步骤 2**: 编辑 `.env` 文件

**使用文本编辑器打开 `.env` 文件：**
```bash
# 使用nano编辑器
nano .env

# 或使用vim
vim .env

# 或使用任何你喜欢的编辑器
```

**根据你的实际情况修改以下配置项：**

```env
# 服务器配置
PORT=3000                    # 本服务监听端口，默认3000
HOST=0.0.0.0                 # 监听地址，0.0.0.0表示接受所有网络接口

# RSS 源配置（从we-mp-rss获取）
# 重要：请将下面的URL替换为你实际的we-mp-rss服务地址和公众号名称
RSS_FEED_URL=http://localhost:8001/rss/人民日报

# Webhook 配置（可选）
# 如果需要将处理后的文章转发到其他服务，请配置此项
WEBHOOK_TARGET_URL=

# 轮询间隔（秒）
# 自动轮询RSS的时间间隔，默认300秒（5分钟）
POLL_INTERVAL=300
```

**配置说明：**
- 将 `RSS_FEED_URL` 中的 `人民日报` 替换为你在we-mp-rss中添加的实际公众号名称
- 如果we-mp-rss部署在其他服务器，需要修改 `localhost` 为实际的服务器地址
- 保存文件并退出编辑器（nano: Ctrl+X, 然后Y, 然后Enter；vim: ESC, 然后:wq）

#### 必需配置项说明

| 配置项 | 是否必需 | 说明 | 示例值 |
|--------|---------|------|--------|
| `PORT` | 否 | 服务监听端口 | `3000` |
| `HOST` | 否 | 服务监听地址 | `0.0.0.0` |
| `RSS_FEED_URL` | 可选* | RSS源地址 | `http://localhost:8001/rss/公众号名称` |
| `WEBHOOK_TARGET_URL` | 否 | 转发目标地址 | `https://your-webhook.com/callback` |
| `POLL_INTERVAL` | 否 | 轮询间隔（秒） | `300` |

\* **注意**: 
- 如果使用**自动轮询模式**，必须配置 `RSS_FEED_URL`
- 如果使用**Webhook推送**或**手动触发模式**，则不需要配置 `RSS_FEED_URL`

#### 如何获取RSS_FEED_URL

1. 启动 we-mp-rss 服务（见上文部署说明）
2. 访问 `http://localhost:8001` 打开管理界面
3. 添加你要订阅的微信公众号
4. 添加成功后，you会得到一个RSS地址，格式为：`http://localhost:8001/rss/公众号名称`
5. 将这个地址填入 `.env` 文件的 `RSS_FEED_URL` 配置项

### 3. 启动服务

**在项目根目录运行：**

```bash
npm start
```

**预期结果：**
```
✅ 微信公众号RSS Webhook服务已启动
🌐 监听地址: http://0.0.0.0:3000
📡 Webhook端点: http://0.0.0.0:3000/webhook
📊 健康检查: http://0.0.0.0:3000/health

配置信息:
- RSS Feed URL: http://localhost:8001/rss/人民日报
- 目标Webhook: 未配置
- 轮询间隔: 300秒

启动自动轮询，间隔: 300秒

=== 开始定时获取RSS ===
正在获取RSS: http://localhost:8001/rss/人民日报
RSS标题: 人民日报
发现 10 篇文章
...
```

**如何判断启动成功：**

1. **检查端口监听：**
```bash
# 在另一个终端窗口运行
netstat -tuln | grep 3000
```
预期看到：`tcp  0  0.0.0.0:3000  0.0.0.0:*  LISTEN`

2. **测试健康检查端点：**
```bash
# 在另一个终端窗口运行
curl http://localhost:3000/health
```
预期输出：
```json
{
  "status": "ok",
  "timestamp": "2026-01-13T15:20:00.000Z",
  "processedCount": 0
}
```

3. **检查服务日志：**
- 如果配置了 `RSS_FEED_URL`，应该能看到服务自动开始获取RSS内容
- 如果成功获取文章，会显示 "发现 N 篇文章" 和文章标题
- 如果没有配置 `RSS_FEED_URL`，会看到 "未配置RSS_FEED_URL，跳过自动轮询"

**常见问题：**

❌ **端口已被占用**
```
Error: listen EADDRINUSE: address already in use :::3000
```
解决方法：修改 `.env` 中的 `PORT` 为其他端口，如 `PORT=3001`

❌ **无法连接到RSS源**
```
获取RSS失败: getaddrinfo ENOTFOUND localhost
```
解决方法：
1. 确认we-mp-rss服务已启动
2. 检查 `RSS_FEED_URL` 配置是否正确
3. 运行 `curl http://localhost:8001/rss/公众号名称` 测试连接

服务将在 `http://localhost:3000` 启动（如果你修改了PORT配置，则使用你配置的端口）。

**停止服务：**
在终端按 `Ctrl+C` 可以停止服务。服务会优雅关闭，清理资源。

## 使用方式

### 方式1: Webhook推送模式（推荐）

配置你的RSS服务（如we-mp-rss）在有新文章时推送到本服务：

**Webhook端点：** `POST http://your-server:3000/webhook`

**推送格式：**
```json
{
  "type": "rss_update",
  "url": "http://localhost:8001/rss/公众号名称"
}
```

### 方式2: 手动触发获取

使用浏览器或curl访问：

```bash
curl "http://localhost:3000/fetch?url=http://localhost:8001/rss/公众号名称"
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
    "url": "http://localhost:8001/rss/公众号名称"
  }'
```

### GET /fetch
手动获取RSS内容

**请求示例：**
```bash
curl "http://localhost:3000/fetch?url=http://localhost:8001/rss/公众号名称"
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
RSS_FEED_URL=http://localhost:8001/rss/阮一峰的网络日志
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

- [we-mp-rss GitHub仓库](https://github.com/rachelos/we-mp-rss)
- [RSS Parser文档](https://www.npmjs.com/package/rss-parser)
- [Express.js文档](https://expressjs.com/)

## 贡献

欢迎提交Issue和Pull Request！
