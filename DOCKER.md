# Docker部署指南

## 方式1: 使用Docker Compose（推荐）

这是最简单的方式，会同时启动we-mp-rss和本服务。

### 启动服务

```bash
docker-compose up -d
```

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 只查看webhook服务日志
docker-compose logs -f wechat-rss-webhook

# 只查看we-mp-rss日志
docker-compose logs -f we-mp-rss
```

### 停止服务

```bash
docker-compose down
```

### 配置说明

编辑 `docker-compose.yml` 文件中的环境变量：

```yaml
environment:
  - RSS_FEED_URL=http://we-mp-rss:8001/rss/你的公众号名称
  - POLL_INTERVAL=300
  - WEBHOOK_TARGET_URL=https://your-webhook.com/callback
```

## 方式2: 单独使用Docker

### 构建镜像

```bash
docker build -t wechat-rss-webhook .
```

### 运行容器

```bash
docker run -d \
  --name wechat-rss-webhook \
  -p 3000:3000 \
  -e RSS_FEED_URL=http://your-we-mp-rss:8001/rss/公众号名称 \
  -e POLL_INTERVAL=300 \
  wechat-rss-webhook
```

### 查看日志

```bash
docker logs -f wechat-rss-webhook
```

### 停止容器

```bash
docker stop wechat-rss-webhook
docker rm wechat-rss-webhook
```

## 完整部署流程

### 1. 启动Docker Compose

```bash
docker-compose up -d
```

### 2. 等待服务启动

```bash
# 检查服务状态
docker-compose ps

# 检查we-mp-rss健康状态
curl http://localhost:8001

# 检查webhook服务健康状态
curl http://localhost:3000/health
```

### 3. 配置we-mp-rss

访问 http://localhost:8001 添加要订阅的微信公众号。

### 4. 更新RSS源配置

记录下we-mp-rss生成的RSS地址，然后更新 `docker-compose.yml`：

```yaml
environment:
  - RSS_FEED_URL=http://we-mp-rss:8001/rss/实际的公众号名称
```

重启服务：

```bash
docker-compose restart wechat-rss-webhook
```

### 5. 验证运行

```bash
# 检查是否成功获取RSS
docker-compose logs wechat-rss-webhook

# 手动触发一次获取
curl "http://localhost:3000/fetch?url=http://localhost:8001/feed/MP_WXS_3517365363.rss"
```

## 生产环境配置建议

### 1. 使用环境变量文件

创建 `.env` 文件：

```env
RSS_FEED_URL=http://we-mp-rss:8001/rss/公众号名称
POLL_INTERVAL=300
WEBHOOK_TARGET_URL=https://your-webhook.com/callback
```

更新 `docker-compose.yml`：

```yaml
wechat-rss-webhook:
  build: .
  env_file:
    - .env
```

### 2. 数据持久化

如果we-mp-rss需要数据持久化，添加卷：

```yaml
we-mp-rss:
  image: ghcr.io/rachelos/we-mp-rss:latest
  volumes:
    - we-mp-rss-data:/app/data

volumes:
  we-mp-rss-data:
```

### 3. 使用反向代理

配置Nginx或Traefik作为反向代理，添加HTTPS支持。

### 4. 监控和告警

使用Docker健康检查和监控工具：

```bash
# 查看容器健康状态
docker inspect --format='{{json .State.Health}}' wechat-rss-webhook

# 使用监控工具
# - Prometheus + Grafana
# - Docker Desktop自带监控
```

## 故障排查

### 容器无法启动

```bash
# 查看详细日志
docker-compose logs

# 检查容器状态
docker-compose ps
```

### 无法连接到we-mp-rss

确保网络配置正确：

```bash
# 进入容器测试连接
docker exec -it wechat-rss-webhook sh
wget -O- http://we-mp-rss:8001
```

### 端口冲突

修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - "3001:3000"  # 主机端口:容器端口
```

## 更新服务

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build
```
