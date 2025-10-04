/**
 * 简化静态文件服务器
 * 专门为你的文件结构优化
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    console.log(`📥 ${req.method} ${pathname}`);

    // 设置CORS头（允许API调用）
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // 处理静态文件
    serveStaticFile(req, res, pathname);
});

/**
 * 服务静态文件
 */
function serveStaticFile(req, res, pathname) {
    // 默认页面
    if (pathname === '/') {
        pathname = '/index.html';
    }

    // 构建文件路径
    let filePath = path.join(__dirname, pathname);

    // 检查文件是否存在
    fs.exists(filePath, (exists) => {
        if (exists) {
            // 文件存在，直接服务
            sendFile(res, filePath);
        } else {
            // 文件不存在，检查是否是HTML文件请求
            if (!path.extname(pathname)) {
                // 没有扩展名的路径，尝试添加.html
                const htmlPath = filePath + '.html';
                fs.exists(htmlPath, (htmlExists) => {
                    if (htmlExists) {
                        sendFile(res, htmlPath);
                    } else {
                        // 返回index.html用于前端路由
                        sendFile(res, path.join(__dirname, 'index.html'));
                    }
                });
            } else {
                // 有扩展名但文件不存在，返回404
                send404(res, pathname);
            }
        }
    });
}

/**
 * 发送文件内容
 */
function sendFile(res, filePath) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error(`❌ Error reading file: ${err.message}`);
            send500(res, 'File read error');
            return;
        }

        // 设置Content-Type
        const extname = path.extname(filePath).toLowerCase();
        const contentType = getContentType(extname);
        
        res.setHeader('Content-Type', contentType);
        res.writeHead(200);
        res.end(data);
        
        console.log(`✅ Served: ${path.basename(filePath)}`);
    });
}

/**
 * 获取Content-Type
 */
function getContentType(extname) {
    const mimeTypes = {
        '.html': 'text/html; charset=UTF-8',
        '.css': 'text/css; charset=UTF-8',
        '.js': 'application/javascript; charset=UTF-8',
        '.json': 'application/json; charset=UTF-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    };

    return mimeTypes[extname] || 'text/plain';
}

/**
 * 发送404响应
 */
function send404(res, pathname) {
    console.log(`❌ 404: ${pathname}`);
    res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
    res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>404 - Not Found</title></head>
        <body>
            <h1>404 - Page Not Found</h1>
            <p>The requested page "${pathname}" was not found.</p>
            <a href="/">Go to Homepage</a>
        </body>
        </html>
    `);
}

/**
 * 发送500响应
 */
function send500(res, message) {
    res.writeHead(500, { 'Content-Type': 'text/html; charset=UTF-8' });
    res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>500 - Server Error</title></head>
        <body>
            <h1>500 - Server Error</h1>
            <p>${message}</p>
            <a href="/">Go to Homepage</a>
        </body>
        </html>
    `);
}

// 启动服务器
server.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 Charity Events - Static Server');
    console.log('='.repeat(50));
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`📁 Serving: ${__dirname}`);
    console.log('='.repeat(50));
    console.log('📄 Available Pages:');
    console.log('   http://localhost:8080/');
    console.log('   http://localhost:8080/search.html');
    console.log('   http://localhost:8080/event.html');
    console.log('='.repeat(50));
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});