/**
 * 路由索引
 * 集中管理和导出所有路由
 */
/*
const express = require('express');
const eventsRouter = require('./events');
const categoriesRouter = require('./categories');

const router = express.Router();

// API路由配置
const API_PREFIX = '/api';

// 事件路由
router.use(`${API_PREFIX}/events`, eventsRouter);

// 分类路由  
router.use(`${API_PREFIX}/categories`, categoriesRouter);

// 路由健康检查
router.get(`${API_PREFIX}/health`, (req, res) => {
    res.json({
        success: true,
        message: 'API is healthy and running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// API信息端点
router.get(`${API_PREFIX}/info`, (req, res) => {
    res.json({
        success: true,
        data: {
            name: 'Charity Events API',
            version: '1.0.0',
            description: 'RESTful API for Charity Events Management',
            endpoints: {
                events: {
                    'GET /api/events': 'Get all events',
                    'GET /api/events/:id': 'Get event by ID',
                    'GET /api/events/search/query': 'Search events',
                    'GET /api/events/upcoming/featured': 'Get upcoming events',
                    'GET /api/events/featured/popular': 'Get featured events',
                    'GET /api/events/stats/summary': 'Get event statistics'
                },
                categories: {
                    'GET /api/categories': 'Get all categories',
                    'GET /api/categories/:id': 'Get category by ID',
                    'GET /api/categories/stats/summary': 'Get category statistics',
                    'GET /api/categories/popular/top': 'Get popular categories'
                },
                system: {
                    'GET /api/health': 'Health check',
                    'GET /api/info': 'API information'
                }
            },
            limits: {
                search: {
                    max_results: 100,
                    max_location_length: 100
                }
            }
        },
        meta: {
            timestamp: new Date().toISOString()
        }
    });
});

module.exports = router;*/

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