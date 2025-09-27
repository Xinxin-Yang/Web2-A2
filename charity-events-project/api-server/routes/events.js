/**
 * 事件路由
 * 定义事件相关的API端点
 */
/*
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const validationMiddleware = require('../middleware/validation');
const { ErrorHandler } = require('../middleware/errorHandler');

// 获取所有活动
router.get('/', 
    ErrorHandler.asyncHandler(async (req, res) => {
        await eventController.getAllEvents(req, res);
    })
);

// 根据ID获取单个活动
router.get('/:id', 
    validationMiddleware.validateEventId,
    ErrorHandler.asyncHandler(async (req, res) => {
        await eventController.getEventById(req, res);
    })
);

// 搜索活动 - 修复路径
router.get('/search/query', 
    validationMiddleware.validateSearchQuery,
    ErrorHandler.asyncHandler(async (req, res) => {
        await eventController.searchEvents(req, res);
    })
);

// 获取即将到来的活动
router.get('/upcoming/featured', 
    ErrorHandler.asyncHandler(async (req, res) => {
        await eventController.getUpcomingEvents(req, res);
    })
);

// 获取热门活动
router.get('/featured/popular', 
    ErrorHandler.asyncHandler(async (req, res) => {
        await eventController.getFeaturedEvents(req, res);
    })
);

// 获取活动统计信息
router.get('/stats/summary', 
    ErrorHandler.asyncHandler(async (req, res) => {
        await eventController.getEventStats(req, res);
    })
);

module.exports = router;*/
/**
 * 事件路由
 * 定义事件相关的API端点
 */

const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

// 获取所有活动
router.get('/', async (req, res) => {
    try {
        await eventController.getAllEvents(req, res);
    } catch (error) {
        console.error('Error in events route:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch events' 
        });
    }
});

// 搜索活动 - 简化版本，先确保路由工作
router.get('/search/query', async (req, res) => {
    try {
        console.log('🔍 Search query received:', req.query);
        await eventController.searchEvents(req, res);
    } catch (error) {
        console.error('Error in search route:', error);
        res.status(500).json({ 
            success: false,
            error: 'Search failed',
            details: error.message
        });
    }
});

// 根据ID获取单个活动
router.get('/:id', async (req, res) => {
    try {
        await eventController.getEventById(req, res);
    } catch (error) {
        console.error('Error in event by ID route:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch event' 
        });
    }
});

module.exports = router;