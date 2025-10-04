/**
 * 主路由文件
 * 注册所有API路由
 */

const express = require('express');
const router = express.Router();

// 导入路由模块
const eventsRouter = require('./events');
const categoriesRouter = require('./categories');

// 注册路由
router.use('/api/events', eventsRouter);
router.use('/api/categories', categoriesRouter);

// 健康检查端点
router.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'API server is running'
    });
});

// API信息端点
router.get('/api/info', (req, res) => {
    res.json({
        success: true,
        name: 'Charity Events API',
        version: '1.0.0',
        endpoints: {
            events: {
                getAll: 'GET /api/events',
                getById: 'GET /api/events/:id',
                search: 'GET /api/events/search/query',
                upcoming: 'GET /api/events/upcoming/featured',
                featured: 'GET /api/events/featured/popular',
                stats: 'GET /api/events/stats/summary'
            },
            categories: {
                getAll: 'GET /api/categories'
            },
            health: 'GET /api/health'
        },
        timestamp: new Date().toISOString()
    });
});

module.exports = router;