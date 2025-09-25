const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = process.env.API_PORT || 3000;

// 基础中间件
app.use(cors());
app.use(express.json());

// 创建数据库连接
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || 'yxx860818.',
    database: process.env.DB_NAME || 'charityevents_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 测试数据库连接
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Database connected successfully');
        connection.release();
    }
});

// ========== 核心API路由 ==========

// 1. 根路径 - 测试服务器是否工作
app.get('/', (req, res) => {
    res.json({ 
        message: 'Charity Events API Server is running!',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /health',
            'GET /api/events', 
            'GET /api/events/:id',
            'GET /api/events/search',
            'GET /api/categories'
        ]
    });
});

// 2. 健康检查端点
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        server: 'Express.js',
        timestamp: new Date().toISOString()
    });
});

// 3. 获取所有活动 - 这是您需要的端点
app.get('/api/events', async (req, res) => {
    console.log('📥 GET /api/events request received');
    
    try {
        const query = `
            SELECT e.*, c.name as category_name 
            FROM events e 
            LEFT JOIN categories c ON e.category_id = c.id 
            WHERE e.is_active = true
            ORDER BY e.date_time ASC
        `;
        
        const [events] = await db.promise().query(query);
        console.log(`✅ Found ${events.length} events`);
        
        res.json({
            success: true,
            data: events,
            count: events.length,
            message: `Successfully retrieved ${events.length} events`
        });
        
    } catch (error) {
        console.error('❌ Error fetching events:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch events',
            message: error.message
        });
    }
});

// 4. 获取单个活动详情
app.get('/api/events/:id', async (req, res) => {
    const eventId = req.params.id;
    console.log(`📥 GET /api/events/${eventId} request received`);
    
    try {
        const query = `
            SELECT e.*, c.name as category_name 
            FROM events e 
            LEFT JOIN categories c ON e.category_id = c.id 
            WHERE e.id = ? AND e.is_active = true
        `;
        
        const [events] = await db.promise().query(query, [eventId]);
        
        if (events.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Event not found'
            });
        }
        
        res.json({
            success: true,
            data: events[0]
        });
        
    } catch (error) {
        console.error(`❌ Error fetching event ${eventId}:`, error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch event'
        });
    }
});

// 5. 搜索活动
app.get('/api/events/search', async (req, res) => {
    console.log('🔍 GET /api/events/search request received', req.query);
    
    try {
        const { date, location, category } = req.query;
        
        let query = `
            SELECT e.*, c.name as category_name 
            FROM events e 
            LEFT JOIN categories c ON e.category_id = c.id 
            WHERE e.is_active = true
        `;
        let params = [];

        if (location) {
            query += ' AND (e.location LIKE ? OR e.name LIKE ?)';
            params.push(`%${location}%`);
            params.push(`%${location}%`);
        }
        if (date) {
            query += ' AND DATE(e.date_time) = ?';
            params.push(date);
        }
        if (category) {
            query += ' AND e.category_id = ?';
            params.push(category);
        }

        query += ' ORDER BY e.date_time ASC';

        const [events] = await db.promise().query(query, params);
        
        res.json({
            success: true,
            data: events,
            count: events.length
        });
        
    } catch (error) {
        console.error('❌ Search error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Search failed'
        });
    }
});

// 6. 获取所有分类
app.get('/api/categories', async (req, res) => {
    console.log('📥 GET /api/categories request received');
    
    try {
        const query = 'SELECT * FROM categories ORDER BY name ASC';
        const [categories] = await db.promise().query(query);
        
        res.json({
            success: true,
            data: categories,
            count: categories.length
        });
        
    } catch (error) {
        console.error('❌ Error fetching categories:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch categories'
        });
    }
});

// 处理404 - 未找到的路由
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        requestedUrl: req.originalUrl,
        method: req.method,
        availableEndpoints: [
            'GET /',
            'GET /health', 
            'GET /api/events',
            'GET /api/events/:id',
            'GET /api/events/search',
            'GET /api/categories'
        ]
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 Charity Events API Server Started!');
    console.log('='.repeat(60));
    console.log(`📍 Server URL: http://localhost:${PORT}`);
    console.log(`📍 Health Check: http://localhost:${PORT}/health`);
    console.log(`📍 Events API: http://localhost:${PORT}/api/events`);
    console.log('='.repeat(60));
});

// 优雅关闭处理
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server gracefully...');
    process.exit(0);
});

/**
 * 主服务器文件
 * 配置和启动Express服务器
 */
/*
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// 导入路由和中间件
const routes = require('./routes');
const { ErrorHandler } = require('./middleware/errorHandler');
const database = require('./config/database');

class Server {
    constructor() {
        this.app = express();
        this.port = process.env.API_PORT || 3000;
        this.environment = process.env.NODE_ENV || 'development';
        
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
        this.initializeDatabase();
    }


    initializeMiddlewares() {
        // 安全中间件
        this.app.use(helmet({
            crossOriginResourcePolicy: { policy: "cross-origin" }
        }));

        // CORS配置
        this.app.use(cors({
            origin: process.env.CLIENT_URL || 'http://localhost:8080',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
            credentials: true,
            maxAge: 86400 // 24 hours
        }));

        // 速率限制
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: {
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many requests from this IP, please try again later.',
                    timestamp: new Date().toISOString()
                }
            },
            standardHeaders: true,
            legacyHeaders: false,
        });

        this.app.use(limiter);

        // 解析请求体
        this.app.use(express.json({
            limit: '10mb',
            verify: (req, res, buf) => {
                req.rawBody = buf;
            }
        }));

        this.app.use(express.urlencoded({
            extended: true,
            limit: '10mb'
        }));

        // 请求日志中间件
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${req.ip}`);
            next();
        });

        // 响应时间头
        this.app.use((req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                res.setHeader('X-Response-Time', `${duration}ms`);
                console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
            });
            next();
        });
    }


    initializeRoutes() {
        // API路由
        this.app.use('/', routes);

        // 根路径
        this.app.get('/', (req, res) => {
            res.json({
                success: true,
                message: 'Charity Events API is running!',
                version: '1.0.0',
                endpoints: {
                    events: '/api/events',
                    categories: '/api/categories',
                    health: '/api/health',
                    info: '/api/info'
                },
                documentation: 'See /api/info for detailed API documentation',
                timestamp: new Date().toISOString()
            });
        });

        // 404处理
        this.app.use('*', ErrorHandler.handleNotFound);
    }


    initializeErrorHandling() {
        // 全局错误处理中间件
        this.app.use(ErrorHandler.globalErrorHandler);
    }


    async initializeDatabase() {
        try {
            console.log('🗄️ Initializing database connection...');
            
            const isConnected = await database.testConnection();
            if (!isConnected) {
                throw new Error('Failed to connect to database');
            }
            
            const dbStatus = await database.getDatabaseStatus();
            console.log('✅ Database initialized successfully:', dbStatus);
            
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            process.exit(1);
        }
    }


    async start() {
        try {
            this.server = this.app.listen(this.port, () => {
                console.log('\n' + '='.repeat(60));
                console.log('🚀 Charity Events API Server Started Successfully!');
                console.log('='.repeat(60));
                console.log(`📍 Environment: ${this.environment}`);
                console.log(`📍 Server URL: http://localhost:${this.port}`);
                console.log(`📍 API Base: http://localhost:${this.port}/api`);
                console.log(`📍 Health Check: http://localhost:${this.port}/api/health`);
                console.log(`📍 API Info: http://localhost:${this.port}/api/info`);
                console.log('='.repeat(60));
                console.log('📋 Available Endpoints:');
                console.log('   GET  /api/events              - Get all events');
                console.log('   GET  /api/events/:id          - Get event by ID');
                console.log('   GET  /api/events/search/query - Search events');
                console.log('   GET  /api/categories          - Get all categories');
                console.log('   GET  /api/health              - Health check');
                console.log('='.repeat(60) + '\n');
            });

            // 优雅关闭处理
            this.setupGracefulShutdown();

        } catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }


    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            console.log(`\n⚠️ Received ${signal}. Starting graceful shutdown...`);
            
            // 关闭服务器，停止接受新请求
            this.server.close(async (err) => {
                if (err) {
                    console.error('❌ Error during server shutdown:', err);
                    process.exit(1);
                }
                
                console.log('✅ HTTP server closed');
                
                // 关闭数据库连接
                try {
                    await database.closePool();
                    console.log('✅ Database connections closed');
                } catch (dbError) {
                    console.error('❌ Error closing database connections:', dbError);
                }
                
                console.log('✅ Graceful shutdown completed');
                process.exit(0);
            });

            // 强制退出计时器
            setTimeout(() => {
                console.error('💥 Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        // 注册关闭信号
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGUSR2', () => shutdown('SIGUSR2')); // nodemon重启
    }


    async stop() {
        if (this.server) {
            this.server.close();
            await database.closePool();
            console.log('✅ Server stopped successfully');
        }
    }
}

// 创建服务器实例
const server = new Server();

// 启动服务器
if (require.main === module) {
    server.start().catch(error => {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    });
}

module.exports = server;
*/