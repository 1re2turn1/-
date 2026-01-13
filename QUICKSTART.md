# 快速开始指南

本指南将帮助你在5-10分钟内完成部署和测试。

## 前提条件

- 已安装Docker（用于部署we-mp-rss）
- 已安装Node.js v14+（用于运行本服务）
- 系统为Linux、macOS或Windows（WSL2）

---

## 第一步: 部署we-mp-rss服务

**运行位置：** 在你的终端/命令行中任意目录

**创建数据目录并启动服务：**

```bash
# 创建数据目录
mkdir -p ~/we-mp-rss-data
cd ~/we-mp-rss-data

# 启动we-mp-rss容器
docker run -d \
  --name we-mp-rss \
  -p 8001:8001 \
  -v $(pwd)/data:/app/data \
  ghcr.io/rachelos/we-mp-rss:latest
```

**预期输出：**
```
Unable to find image 'ghcr.io/rachelos/we-mp-rss:latest' locally
latest: Pulling from rachelos/we-mp-rss
...
a1b2c3d4e5f6890abcdef1234567890  # 容器ID
```

**验证部署成功：**

```bash
# 检查容器运行状态
docker ps | grep we-mp-rss
```

预期看到类似输出：
```
a1b2c3d4e5f6  ghcr.io/rachelos/we-mp-rss:latest  ...  Up 10 seconds  0.0.0.0:8001->8001/tcp
```

**访问管理界面：**
- 在浏览器中打开 `http://localhost:8001`
- 应该能看到we-mp-rss的Web管理界面

**添加微信公众号：**
1. 在we-mp-rss界面点击"添加订阅"
2. 输入公众号名称，例如：`人民日报`
3. 等待抓取完成（可能需要1-2分钟）
4. 记录生成的RSS地址：`http://localhost:8001/rss/人民日报`

---

## 第二步: 克隆并配置本项目

**运行位置：** 在你想要存放项目的目录

```bash
# 克隆项目（如果还没有克隆）
git clone https://github.com/1re2turn1/AutoWechat.git
cd AutoWechat

# 安装依赖
npm install
```

**预期输出：**
```
added 83 packages, and audited 84 packages in 4s
found 0 vulnerabilities
```

**验证：**
```bash
ls node_modules | wc -l
```
应该看到约83行输出（即83个包）。

---

## 第三步: 配置环境变量

**运行位置：** 在项目根目录 `AutoWechat/`

```bash
# 复制配置模板
cp .env.example .env

# 编辑配置文件
nano .env  # 或使用 vim、vi 等编辑器
```

**修改以下配置：**

将 `RSS_FEED_URL` 改为你在第一步中记录的RSS地址：

```env
RSS_FEED_URL=http://localhost:8001/rss/人民日报
```

其他配置项可以保持默认值。

**保存并退出：**
- nano: 按 `Ctrl+X`，然后按 `Y`，然后按 `Enter`
- vim: 按 `ESC`，输入 `:wq`，按 `Enter`

**验证配置：**
```bash
cat .env | grep RSS_FEED_URL
```
应该看到：`RSS_FEED_URL=http://localhost:8001/rss/人民日报`

---

## 第四步: 启动服务

**运行位置：** 在项目根目录 `AutoWechat/`

```bash
npm start
```

**预期输出：**
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
发现 5 篇文章

新文章:
标题: 文章标题1
链接: https://...
...
```

**如何判断启动成功：**
- ✅ 看到 "微信公众号RSS Webhook服务已启动" 消息
- ✅ 看到配置信息正确显示
- ✅ 如果配置了RSS_FEED_URL，应该看到 "开始定时获取RSS" 和文章列表

---

## 第五步: 测试服务

**运行位置：** 打开一个新的终端窗口

### 测试1: 健康检查

```bash
curl http://localhost:3000/health
```

**预期输出：**
```json
{
  "status": "ok",
  "timestamp": "2026-01-13T15:20:00.000Z",
  "processedCount": 5
}
```

**判断：**
- ✅ 返回JSON格式数据
- ✅ status 为 "ok"
- ✅ processedCount 显示已处理的文章数量

### 测试2: 查看处理状态

```bash
curl http://localhost:3000/status
```

**预期输出：**
```json
{
  "processedCount": 5,
  "recentItems": ["article-id-1", "article-id-2", "article-id-3"]
}
```

**判断：**
- ✅ processedCount 显示已处理的文章数
- ✅ recentItems 显示最近处理的文章ID列表

### 测试3: 手动获取RSS（可选）

```bash
curl "http://localhost:3000/fetch?url=http://localhost:8001/rss/人民日报"
```

**预期输出：**
```json
{
  "success": true,
  "message": "成功获取3篇文章",
  "items": [
    {
      "title": "文章标题",
      "link": "https://...",
      "pubDate": "2026-01-13T12:00:00.000Z"
    }
  ]
}
```

**判断：**
- ✅ success 为 true
- ✅ 返回文章列表

---

## 完成！

🎉 恭喜！你已经成功部署并运行了微信公众号RSS自动读取服务。

### 下一步可以做什么？

1. **添加更多公众号：**
   - 在 `http://localhost:8001` 添加更多公众号
   - 修改 `.env` 中的 `RSS_FEED_URL` 或使用手动获取模式

2. **配置转发：**
   - 在 `.env` 中设置 `WEBHOOK_TARGET_URL`
   - 将文章自动转发到你的其他服务

3. **查看详细文档：**
   - README.md - 完整使用说明
   - DOCKER.md - Docker部署方式
   - TESTING.md - 集成测试指南

### 停止服务

```bash
# 停止本服务（在运行npm start的终端按Ctrl+C）

# 停止we-mp-rss
docker stop we-mp-rss

# 如需删除容器
docker rm we-mp-rss
```

---

## 常见问题

### Q1: 端口3000已被占用怎么办？

**解决方法：**
1. 修改 `.env` 文件中的 `PORT=3001`
2. 重新启动服务
3. 访问新端口 `http://localhost:3001`

### Q2: 无法连接到we-mp-rss

**检查步骤：**
```bash
# 1. 检查容器是否运行
docker ps | grep we-mp-rss

# 2. 检查端口是否监听
netstat -tuln | grep 8001

# 3. 测试连接
curl http://localhost:8001
```

### Q3: RSS获取失败

**可能原因：**
1. we-mp-rss中还没有添加该公众号
2. RSS_FEED_URL配置错误
3. 公众号名称包含特殊字符需要URL编码

**解决方法：**
```bash
# 测试RSS地址是否可访问
curl "http://localhost:8001/rss/人民日报"
```

如果返回XML内容，说明RSS源正常。
