/**
 * 通用工具函数库
 * 提供跨页面使用的通用功能
 */

/**
 * DOM工具类 - 提供DOM操作相关方法
 */
class DOMUtils {
    /**
     * 安全地获取DOM元素
     * @param {string} selector - CSS选择器
     * @param {HTMLElement} parent - 父元素（可选）
     * @returns {HTMLElement|null} DOM元素
     */
    static getElement(selector, parent = document) {
        try {
            const element = parent.querySelector(selector);
            if (!element) {
                console.warn(`⚠️ Element not found: ${selector}`);
            }
            return element;
        } catch (error) {
            console.error(`❌ Error getting element ${selector}:`, error);
            return null;
        }
    }

    /**
     * 安全地获取多个DOM元素
     * @param {string} selector - CSS选择器
     * @param {HTMLElement} parent - 父元素（可选）
     * @returns {NodeList} DOM元素列表
     */
    static getElements(selector, parent = document) {
        try {
            return parent.querySelectorAll(selector);
        } catch (error) {
            console.error(`❌ Error getting elements ${selector}:`, error);
            return [];
        }
    }

    /**
     * 创建DOM元素
     * @param {string} tag - 标签名
     * @param {Object} attributes - 属性对象
     * @param {string} textContent - 文本内容
     * @returns {HTMLElement} 创建的DOM元素
     */
    static createElement(tag, attributes = {}, textContent = '') {
        try {
            const element = document.createElement(tag);
            
            // 设置属性
            Object.keys(attributes).forEach(key => {
                element.setAttribute(key, attributes[key]);
            });
            
            // 设置文本内容
            if (textContent) {
                element.textContent = textContent;
            }
            
            return element;
        } catch (error) {
            console.error(`❌ Error creating element ${tag}:`, error);
            return document.createElement('div'); // 返回安全的默认元素
        }
    }

    /**
     * 显示元素
     * @param {HTMLElement} element - DOM元素
     */
    static showElement(element) {
        if (element) {
            element.classList.remove('hidden');
            element.setAttribute('aria-hidden', 'false');
        }
    }

    /**
     * 隐藏元素
     * @param {HTMLElement} element - DOM元素
     */
    static hideElement(element) {
        if (element) {
            element.classList.add('hidden');
            element.setAttribute('aria-hidden', 'true');
        }
    }

    /**
     * 切换元素显示状态
     * @param {HTMLElement} element - DOM元素
     */
    static toggleElement(element) {
        if (element) {
            element.classList.toggle('hidden');
            const isHidden = element.classList.contains('hidden');
            element.setAttribute('aria-hidden', isHidden.toString());
        }
    }

    /**
     * 安全地设置HTML内容
     * @param {HTMLElement} element - DOM元素
     * @param {string} html - HTML内容
     */
    static setHTML(element, html) {
        if (element) {
            try {
                element.innerHTML = html;
            } catch (error) {
                console.error('❌ Error setting HTML:', error);
                element.textContent = 'Error loading content';
            }
        }
    }

    /**
     * 安全地设置文本内容
     * @param {HTMLElement} element - DOM元素
     * @param {string} text - 文本内容
     */
    static setText(element, text) {
        if (element) {
            element.textContent = text || '';
        }
    }

    /**
     * 添加CSS类
     * @param {HTMLElement} element - DOM元素
     * @param {string} className - CSS类名
     */
    static addClass(element, className) {
        if (element && className) {
            element.classList.add(className);
        }
    }

    /**
     * 移除CSS类
     * @param {HTMLElement} element - DOM元素
     * @param {string} className - CSS类名
     */
    static removeClass(element, className) {
        if (element && className) {
            element.classList.remove(className);
        }
    }
}

/**
 * 工具函数类 - 提供通用工具方法
 */
class Utils {
    /**
     * 格式化日期
     * @param {Date} date - 日期对象
     * @param {Object} options - 格式化选项
     * @returns {string} 格式化后的日期字符串
     */
    static formatDate(date, options = {}) {
        if (!(date instanceof Date) || isNaN(date)) {
            return 'Invalid Date';
        }

        const defaultOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };

        const mergedOptions = { ...defaultOptions, ...options };
        
        try {
            return date.toLocaleDateString('en-US', mergedOptions);
        } catch (error) {
            console.error('❌ Error formatting date:', error);
            return date.toString();
        }
    }

    /**
     * 格式化货币
     * @param {number} amount - 金额
     * @param {string} currency - 货币代码
     * @returns {string} 格式化后的货币字符串
     */
    static formatCurrency(amount, currency = 'USD') {
        if (isNaN(amount)) {
            return '$0.00';
        }

        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency
            }).format(amount);
        } catch (error) {
            console.error('❌ Error formatting currency:', error);
            return `$${amount.toFixed(2)}`;
        }
    }

    /**
     * 防抖函数
     * @param {Function} func - 要防抖的函数
     * @param {number} delay - 延迟时间（毫秒）
     * @returns {Function} 防抖后的函数
     */
    static debounce(func, delay = 300) {
        let timeoutId;
        
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * 节流函数
     * @param {Function} func - 要节流的函数
     * @param {number} delay - 延迟时间（毫秒）
     * @returns {Function} 节流后的函数
     */
    static throttle(func, delay = 300) {
        let lastCall = 0;
        
        return function (...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                func.apply(this, args);
            }
        };
    }

    /**
     * 深拷贝对象
     * @param {Object} obj - 要拷贝的对象
     * @returns {Object} 拷贝后的对象
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }

        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }

        if (obj instanceof Object) {
            const clonedObj = {};
            Object.keys(obj).forEach(key => {
                clonedObj[key] = this.deepClone(obj[key]);
            });
            return clonedObj;
        }
    }

    /**
     * 生成唯一ID
     * @param {string} prefix - ID前缀
     * @returns {string} 唯一ID
     */
    static generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 验证电子邮件格式
     * @param {string} email - 电子邮件地址
     * @returns {boolean} 是否有效
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * 转义HTML特殊字符
     * @param {string} text - 要转义的文本
     * @returns {string} 转义后的文本
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 计算进度百分比
     * @param {number} current - 当前值
     * @param {number} total - 总值
     * @returns {number} 百分比
     */
    static calculateProgress(current, total) {
        if (total === 0) return 0;
        return Math.min(100, Math.round((current / total) * 100));
    }
}

/**
 * 状态管理类 - 管理应用状态
 */
class StateManager {
    constructor() {
        this.state = {
            events: [],
            categories: [],
            currentEvent: null,
            searchFilters: {},
            isLoading: false,
            error: null
        };
        
        this.listeners = [];
    }

    /**
     * 获取状态
     * @returns {Object} 当前状态
     */
    getState() {
        return Utils.deepClone(this.state);
    }

    /**
     * 设置状态
     * @param {Object} newState - 新状态
     */
    setState(newState) {
        const oldState = this.getState();
        this.state = { ...this.state, ...newState };
        this._notifyListeners(oldState, this.getState());
    }

    /**
     * 添加状态监听器
     * @param {Function} listener - 监听器函数
     */
    addListener(listener) {
        if (typeof listener === 'function') {
            this.listeners.push(listener);
        }
    }

    /**
     * 移除状态监听器
     * @param {Function} listener - 监听器函数
     */
    removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    /**
     * 通知所有监听器
     * @param {Object} oldState - 旧状态
     * @param {Object} newState - 新状态
     */
    _notifyListeners(oldState, newState) {
        this.listeners.forEach(listener => {
            try {
                listener(oldState, newState);
            } catch (error) {
                console.error('❌ Error in state listener:', error);
            }
        });
    }

    /**
     * 重置状态
     */
    reset() {
        this.setState({
            events: [],
            categories: [],
            currentEvent: null,
            searchFilters: {},
            isLoading: false,
            error: null
        });
    }
}

/**
 * 错误处理类 - 统一错误处理
 */
class ErrorHandler {
    /**
     * 处理API错误
     * @param {Error} error - 错误对象
     * @param {string} context - 错误上下文
     */
    static handleApiError(error, context = 'API request') {
        console.error(`❌ ${context} failed:`, error);
        
        // 这里可以集成错误报告服务（如Sentry）
        // this._reportError(error, context);
        
        // 显示用户友好的错误消息
        this._showUserError(error.message, context);
    }

    /**
     * 显示用户友好的错误消息
     * @param {string} message - 错误消息
     * @param {string} context - 错误上下文
     */
    static _showUserError(message, context) {
        // 在实际应用中，这里可以显示Toast通知或模态框
        console.warn(`⚠️ User-friendly error [${context}]: ${message}`);
        
        // 临时解决方案：在控制台显示用户友好消息
        const userMessage = this._getUserFriendlyMessage(message, context);
        if (typeof window !== 'undefined' && window.console) {
            console.warn('💡 User message:', userMessage);
        }
    }

    /**
     * 获取用户友好的错误消息
     * @param {string} technicalMessage - 技术错误消息
     * @param {string} context - 错误上下文
     * @returns {string} 用户友好消息
     */
    static _getUserFriendlyMessage(technicalMessage, context) {
        const messages = {
            'Network error': 'Please check your internet connection and try again.',
            'timeout': 'The request is taking longer than expected. Please try again.',
            'not found': 'The requested resource was not found.',
            'Failed to fetch': 'Unable to connect to the server. Please try again later.'
        };

        for (const [key, value] of Object.entries(messages)) {
            if (technicalMessage.includes(key)) {
                return value;
            }
        }

        return `Something went wrong while ${context}. Please try again.`;
    }
}

/**
 * 本地存储工具类
 */
class StorageManager {
    static STORAGE_KEYS = {
        SEARCH_FILTERS: 'charity_events_search_filters',
        RECENT_EVENTS: 'charity_events_recent',
        USER_PREFERENCES: 'charity_events_preferences'
    };

    /**
     * 设置存储项
     * @param {string} key - 存储键
     * @param {*} value - 存储值
     */
    static setItem(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
        } catch (error) {
            console.error(`❌ Error storing item ${key}:`, error);
        }
    }

    /**
     * 获取存储项
     * @param {string} key - 存储键
     * @param {*} defaultValue - 默认值
     * @returns {*} 存储值
     */
    static getItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`❌ Error retrieving item ${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * 移除存储项
     * @param {string} key - 存储键
     */
    static removeItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`❌ Error removing item ${key}:`, error);
        }
    }

    /**
     * 清空所有存储
     */
    static clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('❌ Error clearing storage:', error);
        }
    }
}

// 创建全局工具实例
window.DOMUtils = DOMUtils;
window.Utils = Utils;
window.StateManager = StateManager;
window.ErrorHandler = ErrorHandler;
window.StorageManager = StorageManager;

// 初始化全局状态管理器
window.appState = new StateManager();

console.log('🔧 Main utilities initialized');