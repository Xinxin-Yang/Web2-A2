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
