const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.API_PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 导入数据库连接
const db = require('./event_db');

// 基础路由
app.get('/', (req, res) => {
    res.json({ 
        message: 'Charity Events API is running!',
        version: '1.0.0',
        endpoints: {
            events: '/api/events',
            categories: '/api/categories',
            health: '/health'
        }
    });
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API路由 - 获取所有活动
app.get('/api/events', async (req, res) => {
    try {
        console.log('📥 Fetching events from database...');
        const query = `
            SELECT e.*, c.name as category_name 
            FROM events e 
            LEFT JOIN categories c ON e.category_id = c.id 
            WHERE e.is_active = true
            ORDER BY e.date_time ASC
        `;
        const [events] = await db.promise().query(query);
        console.log(`✅ Found ${events.length} events`);
        res.json(events);
    } catch (error) {
        console.error('❌ Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// API路由 - 获取所有分类
app.get('/api/categories', async (req, res) => {
    try {
        console.log('📥 Fetching categories from database...');
        const query = 'SELECT * FROM categories ORDER BY name';
        const [categories] = await db.promise().query(query);
        console.log(`✅ Found ${categories.length} categories`);
        res.json(categories);
    } catch (error) {
        console.error('❌ Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// API路由 - 根据ID获取单个活动
app.get('/api/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📥 Fetching event with ID: ${id}`);
        const query = `
            SELECT e.*, c.name as category_name 
            FROM events e 
            LEFT JOIN categories c ON e.category_id = c.id 
            WHERE e.id = ? AND e.is_active = true
        `;
        const [events] = await db.promise().query(query, [id]);
        
        if (events.length === 0) {
            console.log(`❌ Event ${id} not found`);
            return res.status(404).json({ error: 'Event not found' });
        }
        
        console.log(`✅ Found event: ${events[0].name}`);
        res.json(events[0]);
    } catch (error) {
        console.error('❌ Error fetching event:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});

// API路由 - 搜索活动
app.get('/api/events/search', async (req, res) => {
    try {
        const { date, location, category } = req.query;
        console.log('🔍 Searching events with filters:', { date, location, category });
        
        let query = `
            SELECT e.*, c.name as category_name 
            FROM events e 
            LEFT JOIN categories c ON e.category_id = c.id 
            WHERE e.is_active = true
        `;
        let params = [];

        if (date) {
            query += ' AND DATE(e.date_time) = ?';
            params.push(date);
        }
        if (location) {
            query += ' AND e.location LIKE ?';
            params.push(`%${location}%`);
        }
        if (category) {
            query += ' AND e.category_id = ?';
            params.push(category);
        }

        query += ' ORDER BY e.date_time ASC';

        const [events] = await db.promise().query(query, params);
        console.log(`✅ Search found ${events.length} events`);
        res.json(events);
    } catch (error) {
        console.error('❌ Error searching events:', error);
        res.status(500).json({ error: 'Failed to search events' });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🗄️ Database: ${process.env.DB_NAME}`);
});

module.exports = app;