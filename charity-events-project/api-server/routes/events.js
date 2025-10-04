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