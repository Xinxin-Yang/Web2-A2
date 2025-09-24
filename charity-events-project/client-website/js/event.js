/**
 * 详情页管理类
 * 处理单个活动详情的展示和交互
 * 展示复杂的数据展示和用户交互
 */
class EventPage {
    /**
     * 构造函数 - 初始化详情页管理器
     */
    constructor() {
        // 页面配置
        this.config = {
            // 数据配置
            data: {
                maxDescriptionLength: 1000,
                dateFormat: 'full'
            },
            
            // UI配置
            ui: {
                animationDuration: 400,
                modalTransition: 300,
                progressUpdateInterval: 5000
            },
            
            // 功能配置
            features: {
                enableSharing: true,
                enableRegistration: true,
                enableProgressUpdates: true
            }
        };
        
        // 状态管理
        this.state = {
            event: null,
            isLoading: true,
            hasError: false,
            errorMessage: '',
            isModalOpen: false,
            currentEventId: null,
            relatedEvents: [],
            progressInterval: null
        };
        
        // DOM元素引用
        this.elements = {
            // 容器元素
            eventDetails: null,
            eventLoading: null,
            eventError: null,
            
            // 模态框元素
            registerModal: null,
            modalOverlay: null,
            modalClose: null,
            
            // 内容元素
            eventTitle: null,
            eventDescription: null,
            eventMeta: null,
            progressBar: null
        };
        
        // API实例
        this.api = window.charityEventsAPI;
        
        // 事件监听器引用
        this.eventListeners = [];
        
        console.log('📄 EventPage initialized', { 
            config: this.config,
            hasAPI: !!this.api
        });
    }

    /**
     * 初始化详情页
     */
    async init() {
        try {
            console.log('🚀 Initializing event page...');
            
            // 等待依赖项
            await this._waitForDependencies();
            
            this._cacheElements();
            this._validateDOMStructure();
            this._setupEventListeners();
            
            // 获取事件ID并加载数据
            const eventId = this._getEventIdFromURL();
            if (eventId) {
                this.state.currentEventId = eventId;
                await this._loadEventData(eventId);
            } else {
                this._handleInvalidEventId();
            }
            
            console.log('✅ Event page initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize event page:', error);
            this._handleInitializationError(error);
        }
    }

    /**
     * 等待依赖项就绪
     */
    async _waitForDependencies() {
        const maxWaitTime = 5000;
        const startTime = Date.now();
        
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        while (!this.api && (Date.now() - startTime) < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, 100));
            this.api = window.charityEventsAPI;
        }
        
        if (!this.api) {
            throw new Error('API dependency not available');
        }
    }

    /**
     * 缓存DOM元素引用
     */
    _cacheElements() {
        this.elements = {
            // 容器元素
            eventDetails: DOMUtils.getElement('#event-details'),
            eventLoading: DOMUtils.getElement('#event-loading'),
            eventError: DOMUtils.getElement('#event-error'),
            
            // 模态框元素
            registerModal: DOMUtils.getElement('#register-modal'),
            modalOverlay: DOMUtils.getElements('[data-close-modal]'),
            modalClose: DOMUtils.getElement('.modal-close'),
            
            // 动态创建的元素引用
            registerButton: null,
            shareButton: null
        };

        this._validateRequiredElements();
    }

    /**
     * 验证必需元素
     */
    _validateRequiredElements() {
        const requiredElements = [
            'eventDetails',
            'eventLoading', 
            'eventError'
        ];
        
        const missingElements = requiredElements.filter(key => !this.elements[key]);
        
        if (missingElements.length > 0) {
            console.warn('⚠️ Missing required elements:', missingElements);
            this._createFallbackElements();
        }
    }

    /**
     * 创建备用元素
     */
    _createFallbackElements() {
        if (!this.elements.eventDetails) {
            this.elements.eventDetails = DOMUtils.createElement('div', {
                'id': 'event-details',
                'class': 'event-details-container'
            });
            
            const mainContent = DOMUtils.getElement('main');
            if (mainContent) {
                mainContent.appendChild(this.elements.eventDetails);
            }
        }
    }

    /**
     * 验证DOM结构
     */
    _validateDOMStructure() {
        if (!this.elements.eventDetails) {
            console.error('❌ Event details container not found');
        }
    }

    /**
     * 设置事件监听器
     */
    _setupEventListeners() {
        this._cleanupEventListeners();
        
        // 模态框关闭
        if (this.elements.modalOverlay) {
            this.elements.modalOverlay.forEach(element => {
                this._addEventListener(element, 'click', 
                    () => this._closeModal());
            });
        }
        
        if (this.elements.modalClose) {
            this._addEventListener(this.elements.modalClose, 'click', 
                () => this._closeModal());
        }
        
        // 键盘事件
        this._addEventListener(document, 'keydown', 
            (e) => this._handleKeydown(e));
        
        console.log('🎯 Event page event listeners setup complete');
    }

    /**
     * 清理事件监听器
     */
    _cleanupEventListeners() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];
    }

    /**
     * 添加事件监听器
     */
    _addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.eventListeners.push({ element, event, handler });
    }

    /**
     * 从URL获取事件ID
     */
    _getEventIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');
        
        console.log('🔗 Event ID from URL:', eventId);
        
        if (!eventId || isNaN(Number(eventId))) {
            return null;
        }
        
        return parseInt(eventId);
    }

    /**
     * 处理无效事件ID
     */
    _handleInvalidEventId() {
        this.state.hasError = true;
        this.state.errorMessage = 'Invalid event ID provided';
        
        this._showErrorState();
        
        console.error('❌ Invalid event ID');
    }

    /**
     * 加载事件数据
     */
    async _loadEventData(eventId) {
        try {
            console.log(`📥 Loading event data for ID: ${eventId}`);
            
            this._showLoadingState();
            
            const event = await this.api.fetchEventById(eventId);
            
            // 验证事件数据
            if (!event || !event.id) {
                throw new Error('Event not found');
            }
            
            this.state.event = event;
            this.state.isLoading = false;
            
            // 渲染事件详情
            this._renderEventDetails();
            
            // 设置进度更新（如果启用）
            if (this.config.features.enableProgressUpdates && event.goal_amount > 0) {
                this._setupProgressUpdates();
            }
            
            // 更新页面标题
            this._updatePageTitle(event.name);
            
            console.log('✅ Event data loaded successfully', {
                eventId: event.id,
                eventName: event.name
            });
            
            this._dispatchEvent('event:loaded', {
                eventId: event.id,
                eventName: event.name
            });
            
        } catch (error) {
            console.error('❌ Failed to load event data:', error);
            this._handleEventLoadError(error);
        }
    }

    /**
     * 显示加载状态
     */
    _showLoadingState() {
        DOMUtils.showElement(this.elements.eventLoading);
        DOMUtils.hideElement(this.elements.eventError);
        DOMUtils.hideElement(this.elements.eventDetails);
        
        this.state.isLoading = true;
    }

    /**
     * 隐藏加载状态
     */
    _hideLoadingState() {
        this.state.isLoading = false;
    }

    /**
     * 处理事件加载错误
     */
    _handleEventLoadError(error) {
        this.state.isLoading = false;
        this.state.hasError = true;
        this.state.errorMessage = error.message;
        
        this._showErrorState();
        ErrorHandler.handleApiError(error, 'event data loading');
    }

    /**
     * 显示错误状态
     */
    _showErrorState() {
        DOMUtils.hideElement(this.elements.eventLoading);
        DOMUtils.showElement(this.elements.eventError);
        DOMUtils.hideElement(this.elements.eventDetails);
        
        // 更新错误消息
        const errorMessage = this._getUserFriendlyErrorMessage();
        const errorElement = DOMUtils.getElement('#event-error p');
        if (errorElement) {
            DOMUtils.setText(errorElement, errorMessage);
        }
    }

    /**
     * 获取用户友好的错误消息
     */
    _getUserFriendlyErrorMessage() {
        if (this.state.errorMessage.includes('not found')) {
            return 'The event you are looking for does not exist or has been removed.';
        }
        
        if (this.state.errorMessage.includes('Network error')) {
            return 'Unable to load event details. Please check your internet connection.';
        }
        
        return 'We encountered an error while loading the event details. Please try again.';
    }

    /**
     * 渲染事件详情
     */
    _renderEventDetails() {
        if (!this.state.event || !this.elements.eventDetails) return;
        
        const event = this.state.event;
        
        const eventHTML = this._generateEventHTML(event);
        DOMUtils.setHTML(this.elements.eventDetails, eventHTML);
        
        // 显示详情容器
        DOMUtils.hideElement(this.elements.eventLoading);
        DOMUtils.hideElement(this.elements.eventError);
        DOMUtils.showElement(this.elements.eventDetails);
        
        // 缓存动态创建的元素
        this._cacheDynamicElements();
        
        // 添加动画
        this._animateEventAppearance();
        
        console.log('🎨 Event details rendered');
    }

    /**
     * 生成事件HTML
     */
    _generateEventHTML(event) {
        const formattedDate = Utils.formatDate(event.date_time, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const formattedPrice = event.ticket_price > 0 
            ? Utils.formatCurrency(event.ticket_price)
            : 'Free';
        
        const progressPercentage = Utils.calculateProgress(event.current_amount, event.goal_amount);
        
        return `
            <article class="event-detail" aria-labelledby="event-title">
                <header class="event-header">
                    <h1 id="event-title" class="event-title">${Utils.escapeHtml(event.name)}</h1>
                    <span class="event-category-badge">${Utils.escapeHtml(event.category_name)}</span>
                </header>
                
                <div class="event-content">
                    <div class="event-meta-grid">
                        <div class="event-meta-item">
                            <span class="meta-label">Date & Time</span>
                            <span class="meta-value">
                                <time datetime="${event.date_time.toISOString()}">${formattedDate}</time>
                            </span>
                        </div>
                        
                        <div class="event-meta-item">
                            <span class="meta-label">Location</span>
                            <span class="meta-value">${Utils.escapeHtml(event.location)}</span>
                        </div>
                        
                        <div class="event-meta-item">
                            <span class="meta-label">Ticket Price</span>
                            <span class="meta-value">${formattedPrice}</span>
                        </div>
                        
                        ${event.max_attendees ? `
                        <div class="event-meta-item">
                            <span class="meta-label">Capacity</span>
                            <span class="meta-value">${event.max_attendees} attendees</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="event-description">
                        <h2>About This Event</h2>
                        <p>${Utils.escapeHtml(event.full_description || event.short_description)}</p>
                    </div>
                    
                    ${event.address ? `
                    <div class="event-venue">
                        <h3>Venue Details</h3>
                        <p>${Utils.escapeHtml(event.address)}</p>
                    </div>
                    ` : ''}
                    
                    ${event.goal_amount > 0 ? `
                    <div class="fundraising-progress">
                        <h3>Fundraising Progress</h3>
                        <div class="progress-bar" role="progressbar" 
                             aria-valuenow="${progressPercentage}" 
                             aria-valuemin="0" 
                             aria-valuemax="100">
                            <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                        </div>
                        <div class="progress-text">
                            <span>${Utils.formatCurrency(event.current_amount)} raised</span>
                            <span>${Utils.formatCurrency(event.goal_amount)} goal</span>
                            <span>${progressPercentage}%</span>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="event-actions">
                        ${this.config.features.enableRegistration ? `
                        <button id="register-button" class="btn btn-primary btn-large">
                            Register for This Event
                        </button>
                        ` : ''}
                        
                        ${this.config.features.enableSharing ? `
                        <button id="share-button" class="btn btn-secondary">
                            Share Event
                        </button>
                        ` : ''}
                    </div>
                </div>
            </article>
        `;
    }

    /**
     * 缓存动态创建的元素
     */
    _cacheDynamicElements() {
        this.elements.registerButton = DOMUtils.getElement('#register-button');
        this.elements.shareButton = DOMUtils.getElement('#share-button');
        this.elements.progressBar = DOMUtils.getElement('.progress-fill');
        this.elements.progressText = DOMUtils.getElement('.progress-text');
        
        // 设置事件监听器
        if (this.elements.registerButton) {
            this._addEventListener(this.elements.registerButton, 'click', 
                () => this._handleRegistration());
        }
        
        if (this.elements.shareButton) {
            this._addEventListener(this.elements.shareButton, 'click', 
                () => this._handleShare());
        }
    }

    /**
     * 动画显示事件
     */
    _animateEventAppearance() {
        const eventDetail = DOMUtils.getElement('.event-detail');
        if (eventDetail) {
            eventDetail.style.animation = `fadeInUp ${this.config.ui.animationDuration}ms ease-out`;
        }
    }

    /**
     * 设置进度更新
     */
    _setupProgressUpdates() {
        if (this.state.progressInterval) {
            clearInterval(this.state.progressInterval);
        }
        
        this.state.progressInterval = setInterval(() => {
            this._updateProgressDisplay();
        }, this.config.ui.progressUpdateInterval);
        
        console.log('🔄 Progress updates enabled');
    }

    /**
     * 更新进度显示
     */
    _updateProgressDisplay() {
        if (!this.state.event || !this.elements.progressBar) return;
        
        // 模拟进度更新（在实际应用中，这会从API获取）
        const currentAmount = this.state.event.current_amount;
        const goalAmount = this.state.event.goal_amount;
        
        // 随机增加一点进度用于演示
        const newAmount = currentAmount + (Math.random() * 100);
        const progressPercentage = Utils.calculateProgress(newAmount, goalAmount);
        
        // 更新进度条
        this.elements.progressBar.style.width = `${progressPercentage}%`;
        this.elements.progressBar.setAttribute('aria-valuenow', progressPercentage);
        
        // 更新进度文本
        if (this.elements.progressText) {
            const progressElements = this.elements.progressText.querySelectorAll('span');
            if (progressElements.length >= 3) {
                DOMUtils.setText(progressElements[0], `${Utils.formatCurrency(newAmount)} raised`);
                DOMUtils.setText(progressElements[2], `${progressPercentage}%`);
            }
        }
    }

    /**
     * 更新页面标题
     */
    _updatePageTitle(eventName) {
        document.title = `${eventName} - CharityEvents`;
    }

    /**
     * 处理注册
     */
    _handleRegistration() {
        console.log('🎫 Registration button clicked');
        
        if (this.config.features.enableRegistration) {
            this._openModal();
        } else {
            console.warn('⚠️ Registration feature is disabled');
        }
        
        this._dispatchEvent('event:registrationInitiated', {
            eventId: this.state.event.id,
            eventName: this.state.event.name
        });
    }

    /**
     * 处理分享
     */
    _handleShare() {
        console.log('📤 Share button clicked');
        
        if (navigator.share) {
            // 使用Web Share API
            navigator.share({
                title: this.state.event.name,
                text: this.state.event.short_description,
                url: window.location.href
            }).then(() => {
                console.log('✅ Event shared successfully');
            }).catch(error => {
                console.error('❌ Share failed:', error);
                this._fallbackShare();
            });
        } else {
            this._fallbackShare();
        }
        
        this._dispatchEvent('event:shared', {
            eventId: this.state.event.id,
            eventName: this.state.event.name
        });
    }

    /**
     * 备用分享方法
     */
    _fallbackShare() {
        // 复制链接到剪贴板
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            alert('Event link copied to clipboard!');
        }).catch(() => {
            // 最终备用方案
            prompt('Copy this link to share:', url);
        });
    }

    /**
     * 打开模态框
     */
    _openModal() {
        if (!this.elements.registerModal) return;
        
        this.state.isModalOpen = true;
        
        DOMUtils.showElement(this.elements.registerModal);
        DOMUtils.removeClass(this.elements.registerModal, 'hidden');
        
        // 防止背景滚动
        document.body.style.overflow = 'hidden';
        
        // 焦点管理
        setTimeout(() => {
            const firstFocusable = this.elements.registerModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }, this.config.ui.modalTransition);
        
        console.log('📱 Registration modal opened');
        
        this._dispatchEvent('modal:opened');
    }

    /**
     * 关闭模态框
     */
    _closeModal() {
        if (!this.elements.registerModal) return;
        
        this.state.isModalOpen = false;
        
        DOMUtils.addClass(this.elements.registerModal, 'hidden');
        
        // 恢复背景滚动
        document.body.style.overflow = '';
        
        // 恢复焦点到触发按钮
        if (this.elements.registerButton) {
            this.elements.registerButton.focus();
        }
        
        console.log('📱 Registration modal closed');
        
        this._dispatchEvent('modal:closed');
    }

    /**
     * 处理键盘事件
     */
    _handleKeydown(event) {
        // ESC键关闭模态框
        if (event.key === 'Escape' && this.state.isModalOpen) {
            this._closeModal();
        }
        
        // 模态框内的焦点陷阱
        if (event.key === 'Tab' && this.state.isModalOpen) {
            this._trapFocus(event);
        }
    }

    /**
     * 模态框焦点陷阱
     */
    _trapFocus(event) {
        if (!this.elements.registerModal) return;
        
        const focusableElements = this.elements.registerModal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (event.shiftKey) {
            if (document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    }

    /**
     * 处理初始化错误
     */
    _handleInitializationError(error) {
        console.error('❌ Event page initialization failed:', error);
        
        if (this.elements.eventDetails) {
            DOMUtils.setHTML(this.elements.eventDetails, `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Page Loading Error</h3>
                    <p>We're having trouble loading the event page. Please try refreshing.</p>
                    <button onclick="window.location.reload()" class="btn btn-primary">
                        Refresh Page
                    </button>
                </div>
            `);
        }
        
        ErrorHandler.handleApiError(error, 'event page initialization');
    }

    /**
     * 分发自定义事件
     */
    _dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail: {
                timestamp: new Date().toISOString(),
                source: 'EventPage',
                ...detail
            },
            bubbles: true,
            cancelable: true
        });
        
        document.dispatchEvent(event);
    }

    /**
     * 获取页面状态
     */
    getState() {
        return {
            ...this.state,
            config: { ...this.config }
        };
    }

    /**
     * 重新加载事件数据
     */
    async reload() {
        if (this.state.currentEventId) {
            await this._loadEventData(this.state.currentEventId);
        }
    }

    /**
     * 销毁实例
     */
    destroy() {
        this._cleanupEventListeners();
        
        if (this.state.progressInterval) {
            clearInterval(this.state.progressInterval);
        }
        
        console.log('🧹 EventPage destroyed');
    }
}

// 详情页特定样式
const eventPageStyles = `
/* 详情页特定样式 */
.event-details-container {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--space-8) var(--space-4);
}

.event-detail {
    background: var(--white);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    opacity: 0;
    transform: translateY(20px);
}

.event-detail {
    animation: fadeInUp 0.6s ease-out forwards;
}

.event-header {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
    color: var(--white);
    padding: var(--space-8);
    text-align: center;
    position: relative;
}

.event-title {
    font-size: var(--text-4xl);
    font-weight: var(--font-bold);
    margin-bottom: var(--space-4);
    color: var(--white);
    line-height: 1.2;
}

.event-category-badge {
    display: inline-block;
    background: rgba(255, 255, 255, 0.2);
    color: var(--white);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    backdrop-filter: blur(10px);
}

.event-content {
    padding: var(--space-8);
}

.event-meta-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-6);
    margin-bottom: var(--space-8);
    padding: var(--space-6);
    background: var(--gray-50);
    border-radius: var(--radius-lg);
    border: 1px solid var(--gray-200);
}

.event-meta-item {
    text-align: center;
    padding: var(--space-4);
}

.meta-label {
    display: block;
    font-size: var(--text-sm);
    color: var(--gray-600);
    margin-bottom: var(--space-2);
    font-weight: var(--font-medium);
}

.meta-value {
    display: block;
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--gray-800);
}

.event-description {
    margin-bottom: var(--space-8);
}

.event-description h2 {
    color: var(--primary-color);
    margin-bottom: var(--space-4);
    font-size: var(--text-2xl);
}

.event-description p {
    line-height: var(--leading-relaxed);
    color: var(--gray-700);
    font-size: var(--text-lg);
}

.event-venue {
    background: var(--gray-50);
    padding: var(--space-6);
    border-radius: var(--radius-lg);
    border: 1px solid var(--gray-200);
    margin-bottom: var(--space-8);
}

.event-venue h3 {
    color: var(--primary-color);
    margin-bottom: var(--space-3);
}

.fundraising-progress {
    background: var(--white);
    padding: var(--space-6);
    border-radius: var(--radius-lg);
    border: 2px solid var(--gray-200);
    margin-bottom: var(--space-8);
}

.fundraising-progress h3 {
    color: var(--primary-color);
    margin-bottom: var(--space-4);
    text-align: center;
}

.progress-bar {
    width: 100%;
    height: 12px;
    background: var(--gray-200);
    border-radius: var(--radius-full);
    overflow: hidden;
    margin: var(--space-4) 0;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--success-color), var(--accent-color));
    border-radius: var(--radius-full);
    transition: width var(--transition-slow);
}

.progress-text {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-sm);
    color: var(--gray-600);
    font-weight: var(--font-medium);
}

.event-actions {
    display: flex;
    gap: var(--space-4);
    justify-content: center;
    flex-wrap: wrap;
    padding: var(--space-6);
    background: var(--gray-50);
    border-radius: var(--radius-lg);
    border: 1px solid var(--gray-200);
}

.btn-large {
    padding: var(--space-4) var(--space-8);
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
}

/* 模态框样式 */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: var(--z-modal);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
}

.modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
}

.modal-content {
    position: relative;
    background: var(--white);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl);
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    z-index: var(--z-modal);
    transform: scale(0.9);
    opacity: 0;
    transition: all var(--transition-base);
}

.modal:not(.hidden) .modal-content {
    transform: scale(1);
    opacity: 1;
}

.modal-close {
    position: absolute;
    top: var(--space-4);
    right: var(--space-4);
    background: none;
    border: none;
    font-size: var(--text-2xl);
    color: var(--gray-500);
    cursor: pointer;
    padding: var(--space-1);
    border-radius: var(--radius-full);
    transition: all var(--transition-fast);
}

.modal-close:hover {
    background: var(--gray-100);
    color: var(--gray-700);
}

.modal-header {
    padding: var(--space-6) var(--space-6) 0;
}

.modal-body {
    padding: var(--space-6);
}

.modal-footer {
    padding: 0 var(--space-6) var(--space-6);
    display: flex;
    justify-content: flex-end;
    gap: var(--space-4);
}

.under-construction {
    text-align: center;
    padding: var(--space-8);
}

.construction-icon {
    font-size: var(--text-5xl);
    margin-bottom: var(--space-4);
}

/* 动画 */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 响应式设计 */
@media (max-width: 767px) {
    .event-details-container {
        padding: var(--space-4);
    }
    
    .event-header {
        padding: var(--space-6);
    }
    
    .event-title {
        font-size: var(--text-2xl);
    }
    
    .event-content {
        padding: var(--space-6);
    }
    
    .event-meta-grid {
        grid-template-columns: 1fr;
        gap: var(--space-4);
        padding: var(--space-4);
    }
    
    .event-actions {
        flex-direction: column;
    }
    
    .event-actions .btn {
        width: 100%;
    }
    
    .progress-text {
        flex-direction: column;
        gap: var(--space-2);
        text-align: center;
    }
    
    .modal {
        padding: var(--space-2);
    }
    
    .modal-content {
        margin: var(--space-2);
    }
}

@media (min-width: 768px) and (max-width: 1023px) {
    .event-meta-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
`;

// 注入详情页样式
const eventStyleElement = DOMUtils.createElement('style');
DOMUtils.setText(eventStyleElement, eventPageStyles);
document.head.appendChild(eventStyleElement);

// 创建全局详情页实例
window.eventPage = new EventPage();

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    window.eventPage.init().catch(error => {
        console.error('❌ Failed to initialize event page:', error);
    });
});

console.log('📄 Event page module loaded');