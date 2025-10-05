const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

// 1. 配置静态资源路径：映射 css 和 js 文件夹
// __dirname 指向 server.js 所在的 client-website 目录，直接拼接 css/js 文件夹路径
app.use('/css', express.static(path.join(__dirname, 'css'))); // 访问 /css/xxx.css 时，实际指向 client-website/css/xxx.css
app.use('/js', express.static(path.join(__dirname, 'js')));   // 访问 /js/xxx.js 时，实际指向 client-website/js/xxx.js

// 2. 配置 HTML 文件所在根目录
const htmlDir = path.join(__dirname, 'html');
app.use(express.static(htmlDir)); // 静态服务映射 HTML 文件夹

// 3. 路由配置：指向对应 HTML 文件
app.get('/', (req, res) => {
  res.sendFile(path.join(htmlDir, 'index.html'));
});

app.get('/search', (req, res) => {
  res.sendFile(path.join(htmlDir, 'search.html'));
});

app.get('/event', (req, res) => {
  res.sendFile(path.join(htmlDir, 'event.html'));
});

// 4. 404 错误处理
app.use((req, res) => {
  res.status(404).send('页面或资源未找到');
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
  console.log(`CSS 资源路径已配置：http://localhost:${port}/css/`);
  console.log(`JS 资源路径已配置：http://localhost:${port}/js/`);
});