/**
 * 数据验证中间件
 * 验证API请求参数和数据格式
 */

const { ValidationError } = require('./errorHandler');

class ValidationMiddleware {
    /**
     * 验证事件ID参数
     */
    static validateEventId(req, res, next) {
        const eventId = parseInt(req.params.id);
        
        if (isNaN(eventId) || eventId <= 0) {
            throw new ValidationError('Invalid event ID. Must be a positive integer.');
        }
        
        req.validatedEventId = eventId;
        next();
    }

    /**
     * 验证分类ID参数
     */
    static validateCategoryId(req, res, next) {
        const categoryId = parseInt(req.params.id);
        
        if (isNaN(categoryId) || categoryId <= 0) {
            throw new ValidationError('Invalid category ID. Must be a positive integer.');
        }
        
        req.validatedCategoryId = categoryId;
        next();
    }

    /**
     * 验证搜索查询参数
     */
    static validateSearchQuery(req, res, next) {
        const { date, location, category } = req.query;
        const errors = [];

        // 验证日期格式
        if (date && !this.isValidDate(date)) {
            errors.push('Invalid date format. Use YYYY-MM-DD.');
        }

        // 验证地点长度
        if (location && location.length > 100) {
            errors.push('Location must be less than 100 characters.');
        }

        // 验证分类ID
        if (category && (isNaN(parseInt(category)) || parseInt(category) <= 0)) {
            errors.push('Invalid category ID.');
        }

        if (errors.length > 0) {
            throw new ValidationError(errors.join(' '));
        }

        // 清理和标准化参数
        req.validatedQuery = {
            ...(date && { date: this.formatDate(date) }),
            ...(location && { location: location.trim() }),
            ...(category && { category: parseInt(category) })
        };

        next();
    }

    /**
     * 验证事件数据（用于未来的POST/PUT请求）
     */
    static validateEventData(req, res, next) {
        // 这里为A3预留，用于验证创建/更新事件的数据
        // 当前A2只需要GET请求，所以暂时留空
        
        next();
    }

    /**
     * 验证分页参数
     */
    static validatePagination(req, res, next) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        if (page < 1 || limit < 1 || limit > 100) {
            throw new ValidationError('Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.');
        }

        req.validatedPagination = {
            page: page,
            limit: limit,
            offset: (page - 1) * limit
        };

        next();
    }

    /**
     * 检查日期格式是否有效
     */
    static isValidDate(dateString) {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateString)) return false;

        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date) && dateString === date.toISOString().split('T')[0];
    }

    /**
     * 格式化日期
     */
    static formatDate(dateString) {
        return new Date(dateString + 'T00:00:00.000Z').toISOString().split('T')[0];
    }

    /**
     * 清理字符串参数
     */
    static sanitizeString(str) {
        if (typeof str !== 'string') return '';
        return str.trim().replace(/[<>]/g, '');
    }

    /**
     * 验证数字范围
     */
    static validateNumberRange(value, min, max, fieldName) {
        const num = parseFloat(value);
        if (isNaN(num) || num < min || num > max) {
            throw new ValidationError(`${fieldName} must be a number between ${min} and ${max}.`);
        }
        return num;
    }

    /**
     * 验证必填字段
     */
    static validateRequiredFields(fields, data) {
        const missingFields = fields.filter(field => !data[field]);
        if (missingFields.length > 0) {
            throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
        }
    }
}

module.exports = ValidationMiddleware;