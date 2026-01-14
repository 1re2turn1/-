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
- RSS地址格式：`http://localhost:8001/feed/MP_WXS_数字ID.rss`
- 例如：`http://localhost:8001/feed/MP_WXS_3517365363.rss`

**步骤4：测试RSS源**
```bash
# 替换为你的实际RSS地址
curl "http://localhost:8001/feed/MP_WXS_3517365363.rss"
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

**Linux/macOS:**
```bash
cd /home/runner/work/AutoWechat/AutoWechat  # 进入项目目录
npm install
```

**Windows (PowerShell):**
```powershell
cd C:\path\to\AutoWechat  # 进入项目目录
npm install
```

**Windows (CMD):**
```cmd
cd C:\path\to\AutoWechat
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

**Linux/macOS:**
```bash
cp .env.example .env
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Windows (CMD):**
```cmd
copy .env.example .env
```

**预期结果：**
在项目根目录下生成 `.env` 文件。

**验证：**

**Linux/macOS:**
```bash
ls -la .env
```

**Windows (PowerShell):**
```powershell
dir .env
```

应该能看到 `.env` 文件。

**步骤 2**: 编辑 `.env` 文件

**使用文本编辑器打开 `.env` 文件：**

**Linux/macOS:**
```bash
# 使用nano编辑器
nano .env

# 或使用vim
vim .env

# 或使用任何你喜欢的编辑器
```

**Windows:**
```powershell
# 使用记事本
notepad .env

# 或使用VS Code
code .env
```

**根据你的实际情况修改以下配置项：**

```env
# 服务器配置
PORT=3000                    # 本服务监听端口，默认3000
HOST=0.0.0.0                 # 监听地址，0.0.0.0表示接受所有网络接口

# RSS 源配置（从we-mp-rss获取）
# 重要：请将下面的URL替换为你实际的we-mp-rss服务地址和RSS feed ID
RSS_FEED_URL=http://localhost:8001/feed/MP_WXS_3517365363.rss

# Webhook 配置（可选）
# 如果需要将处理后的文章转发到其他服务，请配置此项
WEBHOOK_TARGET_URL=

# 轮询间隔（秒）
# 自动轮询RSS的时间间隔，默认300秒（5分钟）
POLL_INTERVAL=300
```

**配置说明：**
- 将 `RSS_FEED_URL` 中的 `MP_WXS_3517365363.rss` 替换为你在we-mp-rss中获取的实际RSS feed文件名
- 如果we-mp-rss部署在其他服务器，需要修改 `localhost` 为实际的服务器地址
- 保存文件并退出编辑器
  - Linux/macOS nano: 按 `Ctrl+X`，然后按 `Y`，然后按 `Enter`
  - Linux/macOS vim: 按 `ESC`，输入 `:wq`，按 `Enter`
  - Windows 记事本: 点击"文件" -> "保存"

#### 必需配置项说明

| 配置项 | 是否必需 | 说明 | 示例值 |
|--------|---------|------|--------|
| `PORT` | 否 | 服务监听端口 | `3000` |
| `HOST` | 否 | 服务监听地址 | `0.0.0.0` |
| `RSS_FEED_URL` | 可选* | RSS源地址 | `http://localhost:8001/feed/MP_WXS_3517365363.rss` |
| `WEBHOOK_TARGET_URL` | 否 | 转发目标地址 | `https://your-webhook.com/callback` |
| `POLL_INTERVAL` | 否 | 轮询间隔（秒） | `300` |

\* **注意**: 
- 如果使用**自动轮询模式**，必须配置 `RSS_FEED_URL`
- 如果使用**Webhook推送**或**手动触发模式**，则不需要配置 `RSS_FEED_URL`

#### 如何获取RSS_FEED_URL

1. 启动 we-mp-rss 服务（见上文部署说明）
2. 访问 `http://localhost:8001` 打开管理界面
3. 添加你要订阅的微信公众号
4. 添加成功后，页面会显示RSS feed地址，格式为：`http://localhost:8001/feed/MP_WXS_数字ID.rss`
5. 将这个地址填入 `.env` 文件的 `RSS_FEED_URL` 配置项

### 3. 启动服务

**在项目根目录运行：**

**Linux/macOS:**
```bash
npm start
```

**Windows:**
```powershell
npm start
```

**预期结果：**
```
✅ 微信公众号RSS Webhook服务已启动
🌐 监听地址: http://0.0.0.0:3000
📡 Webhook端点: http://0.0.0.0:3000/webhook
📊 健康检查: http://0.0.0.0:3000/health

配置信息:
- RSS Feed URL: http://localhost:8001/feed/MP_WXS_3517365363.rss
- 目标Webhook: 未配置
- 轮询间隔: 300秒

启动自动轮询，间隔: 300秒

=== 开始定时获取RSS ===
正在获取RSS: http://localhost:8001/feed/MP_WXS_3517365363.rss
RSS标题: 微信公众号
发现 10 篇文章
...
```

**如何判断启动成功：**

1. **检查端口监听：**

**Linux/macOS:**
```bash
# 在另一个终端窗口运行
netstat -tuln | grep 3000
```

**Windows (PowerShell):**
```powershell
# 在另一个PowerShell窗口运行
netstat -an | findstr :3000
```

预期看到端口3000正在监听。

2. **测试健康检查端点：**

**Linux/macOS/Windows (PowerShell):**
```bash
# 在另一个终端窗口运行
curl http://localhost:3000/health
```

**Windows (如果没有curl，使用PowerShell):**
```powershell
Invoke-WebRequest -Uri http://localhost:3000/health
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
3. 运行测试命令检查连接：

**Linux/macOS:**
```bash
curl http://localhost:8001/feed/MP_WXS_3517365363.rss
```

**Windows (PowerShell):**
```powershell
Invoke-WebRequest -Uri http://localhost:8001/feed/MP_WXS_3517365363.rss
```

服务将在 `http://localhost:3000` 启动（如果你修改了PORT配置，则使用你配置的端口）。

**停止服务：**

**Linux/macOS/Windows:**
在终端按 `Ctrl+C` 可以停止服务。服务会优雅关闭，清理资源。

## 使用方式

### 方式1: Webhook推送模式（推荐）

配置你的RSS服务（如we-mp-rss）在有新文章时推送到本服务：

**Webhook端点：** `POST http://your-server:3000/webhook`

**推送格式：**
```json
{
  "type": "rss_update",
  "url": "http://localhost:8001/feed/MP_WXS_3517365363.rss"
}
```

### 方式2: 手动触发获取

使用浏览器或curl访问：

```bash
curl "http://localhost:3000/fetch?url=http://localhost:8001/feed/MP_WXS_3517365363.rss"
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
    "url": "http://localhost:8001/feed/MP_WXS_3517365363.rss"
  }'
```

### GET /fetch
手动获取RSS内容

**请求示例：**
```bash
curl "http://localhost:3000/fetch?url=http://localhost:8001/feed/MP_WXS_3517365363.rss"
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

## 与AI服务集成

本服务可以与各种AI服务配合使用，自动分析和处理微信公众号内容：

### 集成方式

1. **自动化工作流**: 将获取到的微信公众号内容自动发送给AI服务进行分析
2. **内容摘要**: 使用AI服务生成文章摘要
3. **智能推荐**: 基于文章内容，AI服务可以提供相关建议
4. **内容分类**: 自动对文章进行分类和标签

### 支持的AI服务

#### 1. GitHub Copilot API（如果有访问权限）

在 `.env` 中设置 `WEBHOOK_TARGET_URL` 为你的Copilot webhook地址：

```env
WEBHOOK_TARGET_URL=https://your-copilot-webhook.com/process
```

#### 2. 硅基流动API（推荐替代方案）

[硅基流动](https://siliconflow.cn/)提供兼容OpenAI的API接口，价格实惠。

**配置示例：**

1. 注册硅基流动账号并获取API Key
2. 创建一个简单的转发服务（可以使用Cloudflare Workers或其他Serverless平台）
3. 在转发服务中调用硅基流动API

**转发服务示例代码（Node.js）：**

```javascript
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

app.post('/process', async (req, res) => {
  const { title, content } = req.body;
  
  try {
    // 调用硅基流动API生成摘要
    const response = await axios.post('https://api.siliconflow.cn/v1/chat/completions', {
      model: 'Qwen/Qwen2.5-7B-Instruct',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的文章摘要助手，请为用户提供的文章生成简洁的摘要。'
        },
        {
          role: 'user',
          content: `请为以下文章生成摘要：\n标题：${title}\n内容：${content}`
        }
      ],
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer YOUR_SILICONFLOW_API_KEY`,
        'Content-Type': 'application/json'
      }
    });
    
    const summary = response.data.choices[0].message.content;
    console.log('文章摘要:', summary);
    
    res.json({ success: true, summary });
  } catch (error) {
    console.error('AI处理失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3001, () => {
  console.log('AI转发服务运行在 http://localhost:3001');
});
```

然后在本项目的 `.env` 中配置：
```env
WEBHOOK_TARGET_URL=http://localhost:3001/process
```

#### 3. 其他AI服务

你也可以使用其他AI服务：

- **通义千问API**: https://dashscope.aliyun.com/
- **文心一言API**: https://cloud.baidu.com/product/wenxinworkshop
- **智谱AI (GLM)**: https://open.bigmodel.cn/
- **DeepSeek API**: https://platform.deepseek.com/
- **Moonshot AI (Kimi)**: https://platform.moonshot.cn/

所有这些服务都可以通过类似的方式集成，只需修改上面示例代码中的API端点和认证方式。

### 配置Webhook转发

无论使用哪种AI服务，配置方法都是一样的：

```env
WEBHOOK_TARGET_URL=https://your-ai-service.com/process
```

服务会自动将新文章内容转发到该地址，POST数据格式：
```json
{
  "title": "文章标题",
  "link": "文章链接",
  "content": "文章摘要",
  "pubDate": "发布日期",
  "author": "作者"
}
```

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
AI服务 (硅基流动/通义千问/文心一言等)
```

## 示例场景

### 场景1: 监控技术博客更新

```env
RSS_FEED_URL=http://localhost:8001/feed/MP_WXS_3517365363.rss
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
