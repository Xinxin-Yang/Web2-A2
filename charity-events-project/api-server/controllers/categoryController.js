/**
 * 分类控制器
 * 处理分类相关的业务逻辑
 */

const database = require('../config/database');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');

class CategoryController {
    constructor() {
        this.db = database.createPool();
    }

    /**
     * 获取所有分类
     */
    async getAllCategories(req, res, next) {
        try {
            console.log('📥 Fetching all categories from database');
            
            const query = `
                SELECT 
                    id,
                    name,
                    description,
                    created_at,
                    updated_at
                FROM categories 
                ORDER BY name ASC
            `;
            
            const [categories] = await this.db.execute(query);
            
            console.log(`✅ Found ${categories.length} categories`);
            
            res.json({
                success: true,
                data: categories,
                meta: {
                    count: categories.length,
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('❌ Error fetching categories:', error);
            next(error);
        }
    }

    /**
     * 根据ID获取单个分类
     */
    async getCategoryById(req, res, next) {
        try {
            const categoryId = req.validatedCategoryId;
            
            console.log(`📥 Fetching category with ID: ${categoryId}`);
            
            const query = `
                SELECT 
                    id,
                    name,
                    description,
                    created_at,
                    updated_at
                FROM categories 
                WHERE id = ?
            `;
            
            const [categories] = await this.db.execute(query, [categoryId]);
            
            if (categories.length === 0) {
                throw new NotFoundError(`Category with ID ${categoryId} not found`);
            }
            
            const category = categories[0];
            console.log(`✅ Found category: ${category.name}`);
            
            res.json({
                success: true,
                data: category,
                meta: {
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error(`❌ Error fetching category ${req.validatedCategoryId}:`, error);
            next(error);
        }
    }

    /**
     * 获取分类统计信息
     */
    async getCategoryStats(req, res, next) {
        try {
            console.log('📊 Fetching category statistics');
            
            const query = `
                SELECT 
                    c.id,
                    c.name,
                    c.description,
                    COUNT(e.id) as event_count,
                    COALESCE(SUM(e.goal_amount), 0) as total_goal_amount,
                    COALESCE(SUM(e.current_amount), 0) as total_current_amount,
                    COALESCE(AVG(e.ticket_price), 0) as avg_ticket_price
                FROM categories c
                LEFT JOIN events e ON c.id = e.category_id AND e.is_active = TRUE
                GROUP BY c.id, c.name, c.description
                ORDER BY event_count DESC
            `;
            
            const [stats] = await this.db.execute(query);
            
            console.log(`✅ Found statistics for ${stats.length} categories`);
            
            // 计算总体统计
            const totalStats = {
                total_categories: stats.length,
                total_events: stats.reduce((sum, cat) => sum + cat.event_count, 0),
                total_goal_amount: stats.reduce((sum, cat) => sum + parseFloat(cat.total_goal_amount), 0),
                total_current_amount: stats.reduce((sum, cat) => sum + parseFloat(cat.total_current_amount), 0),
                avg_ticket_price: stats.reduce((sum, cat) => sum + parseFloat(cat.avg_ticket_price), 0) / stats.length
            };
            
            res.json({
                success: true,
                data: stats,
                meta: {
                    ...totalStats,
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('❌ Error fetching category statistics:', error);
            next(error);
        }
    }

    /**
     * 验证分类是否存在
     */
    async validateCategoryExists(categoryId) {
        try {
            const query = 'SELECT id FROM categories WHERE id = ?';
            const [categories] = await this.db.execute(query, [categoryId]);
            return categories.length > 0;
        } catch (error) {
            console.error('❌ Error validating category existence:', error);
            throw error;
        }
    }

    /**
     * 获取热门分类（按事件数量排序）
     */
    async getPopularCategories(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 5;
            
            console.log(`📊 Fetching top ${limit} popular categories`);
            
            const query = `
                SELECT 
                    c.id,
                    c.name,
                    c.description,
                    COUNT(e.id) as event_count
                FROM categories c
                LEFT JOIN events e ON c.id = e.category_id AND e.is_active = TRUE
                GROUP BY c.id, c.name, c.description
                ORDER BY event_count DESC, c.name ASC
                LIMIT ?
            `;
            
            const [categories] = await this.db.execute(query, [limit]);
            
            console.log(`✅ Found ${categories.length} popular categories`);
            
            res.json({
                success: true,
                data: categories,
                meta: {
                    limit: limit,
                    count: categories.length,
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('❌ Error fetching popular categories:', error);
            next(error);
        }
    }
}

module.exports = new CategoryController();