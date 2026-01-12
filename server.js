const express = require('express');
const Parser = require('rss-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const parser = new Parser();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// 用于存储已处理的文章ID，避免重复处理
const processedItems = new Set();

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Webhook接收端点 - 用于接收RSS推送通知
 * POST /webhook
 */
app.post('/webhook', async (req, res) => {
  try {
    console.log('收到Webhook推送:', JSON.stringify(req.body, null, 2));
    
    const { url, type } = req.body;
    
    if (type === 'rss_update' && url) {
      // 处理RSS更新通知
      await fetchAndProcessRSS(url);
      res.json({ success: true, message: '已处理RSS更新' });
    } else {
      res.json({ success: true, message: 'Webhook已接收' });
    }
  } catch (error) {
    console.error('处理Webhook时出错:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 手动触发RSS获取端点
 * GET /fetch?url=<rss_url>
 */
app.get('/fetch', async (req, res) => {
  try {
    const url = req.query.url || process.env.RSS_FEED_URL;
    
    if (!url) {
      return res.status(400).json({ 
        success: false, 
        error: '请提供RSS feed URL' 
      });
    }
    
    const items = await fetchAndProcessRSS(url);
    res.json({ 
      success: true, 
      message: `成功获取${items.length}篇文章`,
      items: items 
    });
  } catch (error) {
    console.error('获取RSS时出错:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 健康检查端点
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    processedCount: processedItems.size
  });
});

/**
 * 首页 - 显示使用说明
 */
app.get('/', (req, res) => {
  res.send(`
    <h1>微信公众号RSS Webhook服务</h1>
    <h2>端点说明：</h2>
    <ul>
      <li><strong>POST /webhook</strong> - 接收RSS推送通知</li>
      <li><strong>GET /fetch?url=&lt;rss_url&gt;</strong> - 手动获取RSS内容</li>
      <li><strong>GET /health</strong> - 健康检查</li>
      <li><strong>GET /status</strong> - 查看已处理文章数量</li>
    </ul>
    <h2>配置说明：</h2>
    <p>请在.env文件中配置RSS_FEED_URL和其他选项</p>
    <p>当前已处理文章数: ${processedItems.size}</p>
  `);
});

/**
 * 状态查询端点
 */
app.get('/status', (req, res) => {
  res.json({
    processedCount: processedItems.size,
    recentItems: Array.from(processedItems).slice(-10)
  });
});

/**
 * 获取并处理RSS内容
 */
async function fetchAndProcessRSS(feedUrl) {
  console.log(`正在获取RSS: ${feedUrl}`);
  
  try {
    const feed = await parser.parseURL(feedUrl);
    console.log(`RSS标题: ${feed.title}`);
    console.log(`发现 ${feed.items.length} 篇文章`);
    
    const newItems = [];
    
    for (const item of feed.items) {
      const itemId = item.guid || item.link;
      
      // 检查是否已处理过
      if (!processedItems.has(itemId)) {
        console.log('\n新文章:');
        console.log(`标题: ${item.title}`);
        console.log(`链接: ${item.link}`);
        console.log(`发布时间: ${item.pubDate}`);
        console.log(`内容摘要: ${item.contentSnippet?.substring(0, 100)}...`);
        
        // 标记为已处理
        processedItems.add(itemId);
        
        // 处理文章内容
        await processArticle(item);
        
        newItems.push({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          author: item.creator || item.author,
          content: item.contentSnippet
        });
      }
    }
    
    console.log(`\n本次处理了 ${newItems.length} 篇新文章`);
    return newItems;
    
  } catch (error) {
    console.error('获取RSS失败:', error.message);
    throw error;
  }
}

/**
 * 处理单篇文章
 */
async function processArticle(article) {
  // 这里可以添加自定义处理逻辑，例如：
  // 1. 保存到数据库
  // 2. 发送到其他webhook
  // 3. 生成摘要
  // 4. 发送通知
  
  const webhookTargetUrl = process.env.WEBHOOK_TARGET_URL;
  
  if (webhookTargetUrl) {
    try {
      await axios.post(webhookTargetUrl, {
        title: article.title,
        link: article.link,
        content: article.contentSnippet,
        pubDate: article.pubDate,
        author: article.creator || article.author
      });
      console.log(`已转发到: ${webhookTargetUrl}`);
    } catch (error) {
      console.error('转发失败:', error.message);
    }
  }
}

/**
 * 定时轮询RSS（可选）
 */
function startPolling() {
  const pollInterval = parseInt(process.env.POLL_INTERVAL) || 300;
  const feedUrl = process.env.RSS_FEED_URL;
  
  if (!feedUrl) {
    console.log('未配置RSS_FEED_URL，跳过自动轮询');
    return;
  }
  
  console.log(`启动自动轮询，间隔: ${pollInterval}秒`);
  
  setInterval(async () => {
    try {
      console.log('\n=== 开始定时获取RSS ===');
      await fetchAndProcessRSS(feedUrl);
      console.log('=== 定时获取完成 ===\n');
    } catch (error) {
      console.error('定时获取出错:', error.message);
    }
  }, pollInterval * 1000);
  
  // 立即执行一次
  fetchAndProcessRSS(feedUrl).catch(console.error);
}

// 启动服务器
app.listen(PORT, HOST, () => {
  console.log(`\n✅ 微信公众号RSS Webhook服务已启动`);
  console.log(`🌐 监听地址: http://${HOST}:${PORT}`);
  console.log(`📡 Webhook端点: http://${HOST}:${PORT}/webhook`);
  console.log(`📊 健康检查: http://${HOST}:${PORT}/health`);
  console.log(`\n配置信息:`);
  console.log(`- RSS Feed URL: ${process.env.RSS_FEED_URL || '未配置'}`);
  console.log(`- 目标Webhook: ${process.env.WEBHOOK_TARGET_URL || '未配置'}`);
  console.log(`- 轮询间隔: ${process.env.POLL_INTERVAL || 300}秒\n`);
  
  // 启动定时轮询
  startPolling();
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n收到SIGINT信号，正在关闭服务...');
  process.exit(0);
});
