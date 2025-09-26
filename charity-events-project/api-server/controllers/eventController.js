/**
 * 事件控制器
 * 处理事件相关的业务逻辑和数据处理
 */

const database = require('../config/database');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');

class EventController {
    constructor() {
        this.db = database.createPool();
    }

    /**
     * 获取所有活动
     */
    async getAllEvents(req, res, next) {
        try {
            console.log('📥 Fetching all events from database');
            
            const query = `
                SELECT 
                    e.id,
                    e.name,
                    e.short_description,
                    e.full_description,
                    e.date_time,
                    e.location,
                    e.address,
                    e.category_id,
                    e.ticket_price,
                    e.ticket_type,
                    e.goal_amount,
                    e.current_amount,
                    e.is_active,
                    e.max_attendees,
                    e.created_at,
                    e.updated_at,
                    c.name as category_name
                FROM events e
                LEFT JOIN categories c ON e.category_id = c.id
                WHERE e.is_active = TRUE
                ORDER BY e.date_time ASC
            `;
            
            const [events] = await this.db.execute(query);
            
            console.log(`✅ Found ${events.length} active events`);
            
            // 处理数据格式
            const processedEvents = events.map(event => this._processEventData(event));
            
            res.json({
                success: true,
                data: processedEvents,
                meta: {
                    count: processedEvents.length,
                    timestamp: new Date().toISOString(),
                    filters: {
                        active_only: true
                    }
                }
            });
            
        } catch (error) {
            console.error('❌ Error fetching events:', error);
            next(error);
        }
    }

    /**
     * 根据ID获取单个活动
     */
    async getEventById(req, res, next) {
        try {
            const eventId = req.validatedEventId;
            
            console.log(`📥 Fetching event with ID: ${eventId}`);
            
            const query = `
                SELECT 
                    e.id,
                    e.name,
                    e.short_description,
                    e.full_description,
                    e.date_time,
                    e.location,
                    e.address,
                    e.category_id,
                    e.ticket_price,
                    e.ticket_type,
                    e.goal_amount,
                    e.current_amount,
                    e.is_active,
                    e.max_attendees,
                    e.created_at,
                    e.updated_at,
                    c.name as category_name
                FROM events e
                LEFT JOIN categories c ON e.category_id = c.id
                WHERE e.id = ? AND e.is_active = TRUE
            `;
            
            const [events] = await this.db.execute(query, [eventId]);
            
            if (events.length === 0) {
                throw new NotFoundError(`Event with ID ${eventId} not found or is inactive`);
            }
            
            const event = this._processEventData(events[0]);
            console.log(`✅ Found event: ${event.name}`);
            
            res.json({
                success: true,
                data: event,
                meta: {
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error(`❌ Error fetching event ${req.validatedEventId}:`, error);
            next(error);
        }
    }

    /**
     * 搜索活动
     */
/**
 * 搜索活动 - 紧急修复版本
 */
    async searchEvents(req, res, next) {
        try {
            const { date, location, category } = req.query;
            
            console.log('🔍 Search request received with filters:', { 
                date, 
                location, 
                category 
            });
            
            // 简单的SQL查询
            let query = `
                SELECT 
                    e.*,
                    c.name as category_name
                FROM events e
                LEFT JOIN categories c ON e.category_id = c.id
                WHERE e.is_active = TRUE
            `;
            
            const params = [];
            
            // 添加筛选条件
            if (date) {
                query += ' AND DATE(e.date_time) = ?';
                params.push(date);
            }
            
            if (location) {
                query += ' AND (e.location LIKE ? OR e.name LIKE ?)';
                params.push(`%${location}%`);
                params.push(`%${location}%`);
            }
            
            if (category) {
                query += ' AND e.category_id = ?';
                params.push(category);
            }
            
            query += ' ORDER BY e.date_time ASC';
            
            console.log('📝 Executing query:', query);
            console.log('📝 With parameters:', params);
            
            // 执行查询
            const [events] = await this.db.execute(query, params);
            
            console.log(`✅ Search completed: found ${events.length} events`);
            
            // 返回简化响应
            res.json({
                success: true,
                data: events,
                count: events.length,
                message: `Found ${events.length} events`
            });
            
        } catch (error) {
            console.error('❌ Search error:', error);
            res.status(500).json({
                success: false,
                error: 'Search failed',
                message: error.message
            });
        }
    }

    /**
     * 获取即将到来的活动
     */
    async getUpcomingEvents(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 6;
            
            console.log(`📅 Fetching ${limit} upcoming events`);
            
            const query = `
                SELECT 
                    e.id,
                    e.name,
                    e.short_description,
                    e.full_description,
                    e.date_time,
                    e.location,
                    e.address,
                    e.category_id,
                    e.ticket_price,
                    e.ticket_type,
                    e.goal_amount,
                    e.current_amount,
                    e.is_active,
                    e.max_attendees,
                    e.created_at,
                    e.updated_at,
                    c.name as category_name
                FROM events e
                LEFT JOIN categories c ON e.category_id = c.id
                WHERE e.is_active = TRUE 
                AND e.date_time >= CURDATE()
                ORDER BY e.date_time ASC
                LIMIT ?
            `;
            
            const [events] = await this.db.execute(query, [limit]);
            
            console.log(`✅ Found ${events.length} upcoming events`);
            
            const processedEvents = events.map(event => this._processEventData(event));
            
            res.json({
                success: true,
                data: processedEvents,
                meta: {
                    count: processedEvents.length,
                    limit: limit,
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('❌ Error fetching upcoming events:', error);
            next(error);
        }
    }

    /**
     * 获取热门活动（按筹款进度）
     */
    async getFeaturedEvents(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 4;
            
            console.log(`⭐ Fetching ${limit} featured events`);
            
            const query = `
                SELECT 
                    e.id,
                    e.name,
                    e.short_description,
                    e.full_description,
                    e.date_time,
                    e.location,
                    e.address,
                    e.category_id,
                    e.ticket_price,
                    e.ticket_type,
                    e.goal_amount,
                    e.current_amount,
                    e.is_active,
                    e.max_attendees,
                    e.created_at,
                    e.updated_at,
                    c.name as category_name,
                    (e.current_amount / e.goal_amount) as progress_ratio
                FROM events e
                LEFT JOIN categories c ON e.category_id = c.id
                WHERE e.is_active = TRUE 
                AND e.goal_amount > 0
                AND e.date_time >= CURDATE()
                ORDER BY progress_ratio DESC, e.date_time ASC
                LIMIT ?
            `;
            
            const [events] = await this.db.execute(query, [limit]);
            
            console.log(`✅ Found ${events.length} featured events`);
            
            const processedEvents = events.map(event => this._processEventData(event));
            
            res.json({
                success: true,
                data: processedEvents,
                meta: {
                    count: processedEvents.length,
                    limit: limit,
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('❌ Error fetching featured events:', error);
            next(error);
        }
    }

    /**
     * 获取活动统计信息
     */
    async getEventStats(req, res, next) {
        try {
            console.log('📊 Fetching event statistics');
            
            const query = `
                SELECT 
                    COUNT(*) as total_events,
                    COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_events,
                    COUNT(CASE WHEN date_time >= CURDATE() THEN 1 END) as upcoming_events,
                    COUNT(CASE WHEN date_time < CURDATE() THEN 1 END) as past_events,
                    COALESCE(SUM(goal_amount), 0) as total_goal_amount,
                    COALESCE(SUM(current_amount), 0) as total_current_amount,
                    COALESCE(AVG(ticket_price), 0) as avg_ticket_price,
                    MAX(date_time) as latest_event_date,
                    MIN(date_time) as earliest_event_date
                FROM events
                WHERE is_active = TRUE
            `;
            
            const [stats] = await this.db.execute(query);
            const statistics = stats[0];
            
            // 计算总体进度
            const overallProgress = statistics.total_goal_amount > 0 
                ? (statistics.total_current_amount / statistics.total_goal_amount) * 100 
                : 0;
            
            const enhancedStats = {
                ...statistics,
                overall_progress: Math.round(overallProgress * 100) / 100
            };
            
            console.log('✅ Event statistics calculated');
            
            res.json({
                success: true,
                data: enhancedStats,
                meta: {
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('❌ Error fetching event statistics:', error);
            next(error);
        }
    }

    /**
     * 处理事件数据格式
     */
    _processEventData(event) {
        return {
            id: event.id,
            name: event.name,
            short_description: event.short_description,
            full_description: event.full_description,
            date_time: event.date_time,
            location: event.location,
            address: event.address,
            category_id: event.category_id,
            category_name: event.category_name,
            ticket_price: parseFloat(event.ticket_price),
            ticket_type: event.ticket_type,
            goal_amount: parseFloat(event.goal_amount),
            current_amount: parseFloat(event.current_amount),
            is_active: Boolean(event.is_active),
            max_attendees: event.max_attendees,
            created_at: event.created_at,
            updated_at: event.updated_at,
            // 计算字段
            progress_percentage: event.goal_amount > 0 
                ? Math.round((event.current_amount / event.goal_amount) * 100 * 100) / 100 
                : 0,
            days_until: this._calculateDaysUntil(event.date_time),
            is_upcoming: new Date(event.date_time) >= new Date(),
            is_free: parseFloat(event.ticket_price) === 0
        };
    }

    /**
     * 计算距离活动还有多少天
     */
    _calculateDaysUntil(eventDate) {
        const now = new Date();
        const event = new Date(eventDate);
        const diffTime = event - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    }

    /**
     * 验证事件是否存在
     */
    async validateEventExists(eventId) {
        try {
            const query = 'SELECT id FROM events WHERE id = ? AND is_active = TRUE';
            const [events] = await this.db.execute(query, [eventId]);
            return events.length > 0;
        } catch (error) {
            console.error('❌ Error validating event existence:', error);
            throw error;
        }
    }
}

module.exports = new EventController();