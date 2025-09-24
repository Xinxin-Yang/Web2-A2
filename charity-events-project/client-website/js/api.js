/**
 * Charity Events API 封装类
 * 提供与后端RESTful API交互的方法
 * 遵循单一职责原则和错误处理最佳实践
 */
class CharityEventsAPI {
    /**
     * 构造函数 - 初始化API基础配置
     */
    constructor() {
        // API基础URL - 根据环境配置
        this.baseURL = 'http://localhost:3000/api';
        
        // 默认请求配置
        this.defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            // 请求超时时间（毫秒）
            timeout: 10000,
        };
        
        // 重试配置
        this.retryConfig = {
            maxRetries: 3,
            retryDelay: 1000,
        };
        
        console.log('🔧 CharityEventsAPI initialized', { baseURL: this.baseURL });
    }

    /**
     * 通用请求方法
     * @param {string} endpoint - API端点
     * @param {Object} options - 请求选项
     * @returns {Promise} 响应数据
     */
    async _makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...this.defaultOptions,
            ...options,
        };

        console.log(`🌐 Making request to: ${url}`, { config });

        try {
            const response = await fetch(url, config);
            
            // 检查响应状态
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // 解析JSON响应
            const data = await response.json();
            console.log(`✅ Request successful: ${url}`, { data: data.length || data });
            
            return data;
        } catch (error) {
            console.error(`❌ Request failed: ${url}`, error);
            throw this._handleError(error);
        }
    }

    /**
     * 带重试机制的请求方法
     * @param {string} endpoint - API端点
     * @param {Object} options - 请求选项
     * @param {number} retryCount - 当前重试次数
     * @returns {Promise} 响应数据
     */
    async _makeRequestWithRetry(endpoint, options = {}, retryCount = 0) {
        try {
            return await this._makeRequest(endpoint, options);
        } catch (error) {
            // 检查是否应该重试
            if (this._shouldRetry(error) && retryCount < this.retryConfig.maxRetries) {
                console.log(`🔄 Retrying request (${retryCount + 1}/${this.retryConfig.maxRetries})`);
                
                // 指数退避延迟
                const delay = this.retryConfig.retryDelay * Math.pow(2, retryCount);
                await this._sleep(delay);
                
                return this._makeRequestWithRetry(endpoint, options, retryCount + 1);
            }
            
            throw error;
        }
    }

    /**
     * 判断错误是否应该重试
     * @param {Error} error - 错误对象
     * @returns {boolean} 是否应该重试
     */
    _shouldRetry(error) {
        // 网络错误、超时错误、5xx服务器错误应该重试
        return error.name === 'TypeError' || // 网络错误
               error.message.includes('timeout') ||
               (error.message.includes('HTTP error') && 
                error.message.includes('status: 5'));
    }

    /**
     * 休眠函数
     * @param {number} ms - 休眠时间（毫秒）
     * @returns {Promise} 
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 错误处理统一方法
     * @param {Error} error - 原始错误
     * @returns {Error} 处理后的错误
     */
    _handleError(error) {
        let userFriendlyMessage = 'An unexpected error occurred';
        
        if (error.name === 'TypeError') {
            userFriendlyMessage = 'Network error: Please check your internet connection';
        } else if (error.message.includes('timeout')) {
            userFriendlyMessage = 'Request timeout: The server is taking too long to respond';
        } else if (error.message.includes('status: 404')) {
            userFriendlyMessage = 'Resource not found';
        } else if (error.message.includes('status: 500')) {
            userFriendlyMessage = 'Server error: Please try again later';
        }
        
        // 创建新的错误对象，包含用户友好消息
        const enhancedError = new Error(userFriendlyMessage);
        enhancedError.originalError = error;
        enhancedError.timestamp = new Date().toISOString();
        
        return enhancedError;
    }

    /**
     * 获取所有活动
     * @returns {Promise<Array>} 活动数组
     */
    async fetchEvents() {
        try {
            console.log('📥 Fetching all events from API');
            const events = await this._makeRequestWithRetry('/events');
            
            // 数据验证和转换
            const validatedEvents = this._validateEventsData(events);
            console.log(`✅ Successfully fetched ${validatedEvents.length} events`);
            
            return validatedEvents;
        } catch (error) {
            console.error('❌ Failed to fetch events:', error);
            throw error;
        }
    }

    /**
     * 获取所有分类
     * @returns {Promise<Array>} 分类数组
     */
    async fetchCategories() {
        try {
            console.log('📥 Fetching categories from API');
            const categories = await this._makeRequestWithRetry('/categories');
            
            // 数据验证
            const validatedCategories = this._validateCategoriesData(categories);
            console.log(`✅ Successfully fetched ${validatedCategories.length} categories`);
            
            return validatedCategories;
        } catch (error) {
            console.error('❌ Failed to fetch categories:', error);
            throw error;
        }
    }

    /**
     * 根据ID获取单个活动
     * @param {number} id - 活动ID
     * @returns {Promise<Object>} 活动对象
     */
    async fetchEventById(id) {
        // 参数验证
        if (!id || isNaN(Number(id))) {
            throw new Error('Invalid event ID provided');
        }

        try {
            console.log(`📥 Fetching event with ID: ${id}`);
            const event = await this._makeRequestWithRetry(`/events/${id}`);
            
            // 数据验证
            const validatedEvent = this._validateEventData(event);
            console.log(`✅ Successfully fetched event: ${validatedEvent.name}`);
            
            return validatedEvent;
        } catch (error) {
            console.error(`❌ Failed to fetch event ${id}:`, error);
            throw error;
        }
    }

    /**
     * 搜索活动
     * @param {Object} filters - 筛选条件
     * @param {string} filters.date - 日期筛选
     * @param {string} filters.location - 地点筛选
     * @param {string} filters.category - 分类筛选
     * @returns {Promise<Array>} 搜索结果数组
     */
    async searchEvents(filters = {}) {
        try {
            console.log('🔍 Searching events with filters:', filters);
            
            // 构建查询参数
            const params = new URLSearchParams();
            
            // 添加有效的筛选条件
            if (filters.date && this._isValidDate(filters.date)) {
                params.append('date', filters.date);
            }
            
            if (filters.location && filters.location.trim()) {
                params.append('location', filters.location.trim());
            }
            
            if (filters.category && !isNaN(Number(filters.category))) {
                params.append('category', filters.category);
            }
            
            const queryString = params.toString();
            const endpoint = queryString ? `/events/search?${queryString}` : '/events/search';
            
            const events = await this._makeRequestWithRetry(endpoint);
            
            // 数据验证
            const validatedEvents = this._validateEventsData(events);
            console.log(`✅ Search found ${validatedEvents.length} events`);
            
            return validatedEvents;
        } catch (error) {
            console.error('❌ Failed to search events:', error);
            throw error;
        }
    }

    /**
     * 验证活动数据
     * @param {Array} events - 活动数据数组
     * @returns {Array} 验证后的活动数据
     */
    _validateEventsData(events) {
        if (!Array.isArray(events)) {
            console.warn('⚠️ Expected array of events, received:', typeof events);
            return [];
        }

        return events.map(event => this._validateEventData(event)).filter(Boolean);
    }

    /**
     * 验证单个活动数据
     * @param {Object} event - 活动数据
     * @returns {Object|null} 验证后的活动数据
     */
    _validateEventData(event) {
        // 基本验证
        if (!event || typeof event !== 'object') {
            console.warn('⚠️ Invalid event data:', event);
            return null;
        }

        // 必需字段验证
        const requiredFields = ['id', 'name', 'date_time', 'location'];
        const missingFields = requiredFields.filter(field => !event[field]);
        
        if (missingFields.length > 0) {
            console.warn('⚠️ Event missing required fields:', missingFields, event);
            return null;
        }

        // 数据清理和转换
        return {
            id: Number(event.id),
            name: String(event.name || 'Unnamed Event'),
            short_description: String(event.short_description || ''),
            full_description: String(event.full_description || ''),
            date_time: new Date(event.date_time),
            location: String(event.location),
            address: String(event.address || ''),
            category_id: Number(event.category_id || 0),
            category_name: String(event.category_name || 'Uncategorized'),
            ticket_price: Number(event.ticket_price || 0),
            ticket_type: event.ticket_type === 'paid' ? 'paid' : 'free',
            goal_amount: Number(event.goal_amount || 0),
            current_amount: Number(event.current_amount || 0),
            is_active: Boolean(event.is_active),
            max_attendees: event.max_attendees ? Number(event.max_attendees) : null,
            created_at: event.created_at ? new Date(event.created_at) : null,
            updated_at: event.updated_at ? new Date(event.updated_at) : null
        };
    }

    /**
     * 验证分类数据
     * @param {Array} categories - 分类数据数组
     * @returns {Array} 验证后的分类数据
     */
    _validateCategoriesData(categories) {
        if (!Array.isArray(categories)) {
            console.warn('⚠️ Expected array of categories, received:', typeof categories);
            return [];
        }

        return categories.map(category => {
            if (!category || typeof category !== 'object') {
                console.warn('⚠️ Invalid category data:', category);
                return null;
            }

            return {
                id: Number(category.id),
                name: String(category.name || 'Unnamed Category'),
                description: String(category.description || ''),
                created_at: category.created_at ? new Date(category.created_at) : null,
                updated_at: category.updated_at ? new Date(category.updated_at) : null
            };
        }).filter(Boolean);
    }

    /**
     * 验证日期格式
     * @param {string} dateString - 日期字符串
     * @returns {boolean} 是否有效
     */
    _isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    /**
     * 获取API健康状态
     * @returns {Promise<Object>} 健康状态对象
     */
    async checkHealth() {
        try {
            const health = await this._makeRequest('/health');
            return {
                status: 'healthy',
                timestamp: health.timestamp,
                message: 'API is responding correctly'
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                message: error.message
            };
        }
    }
}

// 创建全局API实例
window.charityEventsAPI = new CharityEventsAPI();