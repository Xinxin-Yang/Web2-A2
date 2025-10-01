/**
 * 首页管理类
 * 处理首页的动态内容加载、事件展示和用户交互
 * 展示对客户端技术的深刻理解和应用
 */
class HomePage {
    /**
     * 构造函数 - 初始化首页管理器
     */
    constructor() {
        // 页面配置
        this.config = {
            // API配置
            api: {
                eventsEndpoint: '/events',
                retryAttempts: 3,
                timeout: 10000
            },
            
            // UI配置
            ui: {
                eventsPerPage: 12,
                animationDuration: 300,
                lazyLoadOffset: 100
            },
            
            // 内容配置
            content: {
                organizationName: 'CharityEvents',
                missionStatement: 'Connecting compassionate people with meaningful charity events to create positive change in our community.',
                contactEmail: 'info@charityevents.org',
                contactPhone: '(555) 123-4567'
            }
        };
        
        // 状态管理
        this.state = {
            events: [],
            filteredEvents: [],
            categories: [],
            isLoading: true,
            hasError: false,
            errorMessage: '',
            currentView: 'grid', // 'grid' or 'list'
            sortBy: 'date', // 'date', 'name', 'location'
            sortOrder: 'asc', // 'asc' or 'desc'
            currentPage: 1,
            totalPages: 1,
            searchQuery: ''
        };
        
        // DOM元素引用
        this.elements = {
            // 容器元素
            eventsContainer: null,
            loadingState: null,
            errorState: null,
            emptyState: null,
            
            // 控制元素
            retryButton: null,
            viewToggle: null,
            sortSelect: null,
            searchInput: null,
            
            // 内容元素
            heroSection: null,
            missionSection: null,
            statsContainer: null
        };
        
        // API实例
        this.api = window.charityEventsAPI;
        
        // 事件监听器引用
        this.eventListeners = [];
        
        console.log('🏠 HomePage initialized', { 
            config: this.config,
            hasAPI: !!this.api
        });
    }

    /**
     * 初始化首页
     */
    async init() {
        try {
            console.log('🚀 Initializing home page...');
            
            // 等待DOM和导航就绪
            await this._waitForDependencies();
            
            this._cacheElements();
            this._validateDOMStructure();
            this._setupEventListeners();
            this._renderStaticContent();
            await this._loadInitialData();
            this._setupIntersectionObserver();
            
            console.log('✅ Home page initialized successfully');
            
            // 触发自定义事件
            this._dispatchEvent('homepage:ready', {
                eventsCount: this.state.events.length,
                categoriesCount: this.state.categories.length
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize home page:', error);
            this._handleInitializationError(error);
        }
    }

    /**
     * 等待依赖项就绪
     */
    async _waitForDependencies() {
        const maxWaitTime = 5000; // 5秒超时
        const startTime = Date.now();
        
        // 等待DOM就绪
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        // 等待API就绪
        while (!this.api && (Date.now() - startTime) < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, 100));
            this.api = window.charityEventsAPI;
        }
        
        if (!this.api) {
            throw new Error('API dependency not available');
        }
        
        console.log('📦 Dependencies loaded successfully');
    }

    /**
     * 缓存DOM元素引用
     */
    _cacheElements() {
        this.elements = {
            // 容器元素
            eventsContainer: DOMUtils.getElement('#events-container'),
            loadingState: DOMUtils.getElement('#loading-state'),
            errorState: DOMUtils.getElement('#error-state'),
            emptyState: DOMUtils.getElement('#empty-state'),
            
            // 控制元素
            retryButton: DOMUtils.getElement('#retry-button'),
            viewToggle: DOMUtils.getElement('#view-toggle'),
            sortSelect: DOMUtils.getElement('#sort-select'),
            searchInput: DOMUtils.getElement('#search-input'),
            
            // 内容元素
            heroSection: DOMUtils.getElement('.hero'),
            missionSection: DOMUtils.getElement('.organization-info'),
            statsContainer: DOMUtils.getElement('.mission-stats'),
            
            // 动态创建的元素引用
            eventsGrid: null,
            eventsList: null,
            pagination: null
        };

        // 验证必需元素
        this._validateRequiredElements();
    }

    /**
     * 验证必需元素
     */
    _validateRequiredElements() {
        const requiredElements = [
            'eventsContainer',
            'loadingState', 
            'errorState',
            'emptyState'
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
        console.log('🛠️ Creating fallback elements...');
        
        if (!this.elements.eventsContainer) {
            this.elements.eventsContainer = DOMUtils.createElement('div', {
                'id': 'events-container',
                'class': 'events-grid',
                'aria-live': 'polite'
            });
            
            const eventsSection = DOMUtils.getElement('.events-section');
            if (eventsSection) {
                eventsSection.appendChild(this.elements.eventsContainer);
            }
        }
        
        // 创建其他备用元素...
    }

    /**
     * 验证DOM结构
     */
    _validateDOMStructure() {
        const requiredSections = ['hero', 'mission', 'events'];
        const missingSections = [];
        
        if (!this.elements.heroSection) missingSections.push('hero');
        if (!this.elements.missionSection) missingSections.push('mission');
        if (!this.elements.eventsContainer) missingSections.push('events');
        
        if (missingSections.length > 0) {
            console.warn('⚠️ Missing page sections:', missingSections);
        }
        
        console.log('🏗️ DOM structure validated', {
            sections: requiredSections.length - missingSections.length,
            missing: missingSections
        });
    }

    /**
     * 设置事件监听器
     */
    _setupEventListeners() {
        this._cleanupEventListeners();
        
        // 重试按钮
        if (this.elements.retryButton) {
            this._addEventListener(this.elements.retryButton, 'click', 
                () => this._handleRetry());
        }
        
        // 视图切换
        if (this.elements.viewToggle) {
            this._addEventListener(this.elements.viewToggle, 'change', 
                (e) => this._handleViewToggle(e));
        }
        
        // 排序选择
        if (this.elements.sortSelect) {
            this._addEventListener(this.elements.sortSelect, 'change', 
                (e) => this._handleSortChange(e));
        }
        
        // 搜索输入
        if (this.elements.searchInput) {
            const searchHandler = Utils.debounce(
                (e) => this._handleSearch(e), 
                300
            );
            this._addEventListener(this.elements.searchInput, 'input', searchHandler);
        }
        
        // 窗口事件
        this._addEventListener(window, 'resize', 
            Utils.debounce(() => this._handleResize(), 250));
        
        // 自定义事件
        this._addEventListener(document, 'homepage:refresh', 
            () => this._handleRefresh());
        
        console.log('🎯 Home page event listeners setup complete');
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
     * 渲染静态内容
     */
    _renderStaticContent() {
        this._renderHeroSection();
        this._renderMissionSection();
        this._renderStats();
        
        console.log('📝 Static content rendered');
    }

    /**
     * 渲染英雄区域
     */
    _renderHeroSection() {
        if (!this.elements.heroSection) return;
        
        const heroContent = `
            <div class="hero-content">
                <h1 id="hero-heading">Make a Difference Through Charity Events</h1>
                <p class="hero-subtitle">Join meaningful events that create positive change in our community</p>
                <div class="hero-actions">
                    <a href="#upcoming-events" class="btn btn-primary" data-scroll-to-events>
                        View Upcoming Events
                    </a>
                    <a href="search.html" class="btn btn-secondary">
                        Find Specific Events
                    </a>
                </div>
            </div>
        `;
        
        DOMUtils.setHTML(this.elements.heroSection, heroContent);
        
        // 添加滚动事件监听
        const scrollButton = DOMUtils.getElement('[data-scroll-to-events]');
        if (scrollButton) {
            this._addEventListener(scrollButton, 'click', (e) => {
                e.preventDefault();
                this._scrollToEvents();
            });
        }
    }

    /**
     * 滚动到活动区域
     */
    _scrollToEvents() {
        const eventsSection = DOMUtils.getElement('#upcoming-events');
        if (eventsSection) {
            eventsSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
            
            // 为可访问性添加焦点
            setTimeout(() => {
                eventsSection.setAttribute('tabindex', '-1');
                eventsSection.focus();
                setTimeout(() => eventsSection.removeAttribute('tabindex'), 1000);
            }, 500);
        }
    }

    /**
     * 渲染使命区域
     */
    _renderMissionSection() {
        if (!this.elements.missionSection) return;
        
        const missionContent = `
            <div class="container">
                <h2 id="about-heading" class="section-title">About Our Mission</h2>
                <div class="mission-content">
                    <div class="mission-text">
                        <p>At ${this.config.content.organizationName}, we believe that everyone can make a difference. We connect compassionate individuals and organizations with meaningful charity events that create lasting positive impact in our community.</p>
                        <p>Since our founding, we've helped raise over <strong>$2 million</strong> for various causes and connected <strong>50,000+ participants</strong> with opportunities to give back.</p>
                    </div>
                    <div class="mission-stats">
                        <div class="stat">
                            <span class="stat-number">500+</span>
                            <span class="stat-label">Events Hosted</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">$2M+</span>
                            <span class="stat-label">Funds Raised</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">50K+</span>
                            <span class="stat-label">Participants</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        DOMUtils.setHTML(this.elements.missionSection, missionContent);
    }

    /**
     * 渲染统计数据
     */
    _renderStats() {
        if (!this.elements.statsContainer) return;
        
        // 统计数据可以通过API动态获取，这里使用静态数据
        const stats = [
            { number: '500+', label: 'Events Hosted' },
            { number: '$2M+', label: 'Funds Raised' },
            { number: '50K+', label: 'Participants' }
        ];
        
        const statsHTML = stats.map(stat => `
            <div class="stat">
                <span class="stat-number">${stat.number}</span>
                <span class="stat-label">${stat.label}</span>
            </div>
        `).join('');
        
        DOMUtils.setHTML(this.elements.statsContainer, statsHTML);
    }

    /**
     * 加载初始数据
     */
    async _loadInitialData() {
        try {
            console.log('📥 Loading initial data...');
            
            this._showLoadingState();
            this._updateLoadingProgress(0);
            
            // 并行加载事件和分类数据
            const [events, categories] = await Promise.all([
                this.api.fetchEvents(),
                this.api.fetchCategories()
            ]);
            
            this._updateLoadingProgress(50);
            
            // 更新状态
            this.state.events = events;
            this.state.categories = categories;
            this.state.filteredEvents = this._filterAndSortEvents(events);
            this.state.isLoading = false;
            
            this._updateLoadingProgress(100);
            
            // 渲染动态内容
            this._renderDynamicContent();
            
            console.log('✅ Initial data loaded', {
                events: events.length,
                categories: categories.length
            });
            
            this._dispatchEvent('homepage:dataLoaded', {
                eventsCount: events.length,
                categoriesCount: categories.length
            });
            
        } catch (error) {
            console.error('❌ Failed to load initial data:', error);
            this._handleDataLoadError(error);
        }
    }

    /**
     * 显示加载状态
     */
    _showLoadingState() {
        DOMUtils.showElement(this.elements.loadingState);
        DOMUtils.hideElement(this.elements.errorState);
        DOMUtils.hideElement(this.elements.emptyState);
        DOMUtils.hideElement(this.elements.eventsContainer);
        
        this.state.isLoading = true;
        this.state.hasError = false;
    }

    /**
     * 更新加载进度
     */
    _updateLoadingProgress(percent) {
        const progressElement = DOMUtils.getElement('.loading-progress');
        if (!progressElement) return;
        
        progressElement.style.width = `${percent}%`;
        progressElement.setAttribute('aria-valuenow', percent);
    }

    /**
     * 处理数据加载错误
     */
    _handleDataLoadError(error) {
        this.state.isLoading = false;
        this.state.hasError = true;
        this.state.errorMessage = error.message;
        
        DOMUtils.hideElement(this.elements.loadingState);
        DOMUtils.showElement(this.elements.errorState);
        DOMUtils.hideElement(this.elements.emptyState);
        DOMUtils.hideElement(this.elements.eventsContainer);
        
        // 更新错误消息
        const errorMessageElement = DOMUtils.getElement('#error-message');
        if (errorMessageElement) {
            const userFriendlyMessage = this._getUserFriendlyErrorMessage(error);
            DOMUtils.setText(errorMessageElement, userFriendlyMessage);
        }
        
        ErrorHandler.handleApiError(error, 'home page data loading');
        
        this._dispatchEvent('homepage:dataLoadError', {
            error: error.message,
            userMessage: this.state.errorMessage
        });
    }

    /**
     * 获取用户友好的错误消息
     */
    _getUserFriendlyErrorMessage(error) {
        const errorMessages = {
            'Network error': 'Unable to connect to the server. Please check your internet connection and try again.',
            'Failed to fetch': 'We are having trouble loading events. Please try refreshing the page.',
            'timeout': 'The request is taking longer than expected. Please try again.',
            'not found': 'The events data is currently unavailable. Please check back later.'
        };
        
        for (const [key, message] of Object.entries(errorMessages)) {
            if (error.message.includes(key)) {
                return message;
            }
        }
        
        return 'We encountered an unexpected error while loading events. Please try again later.';
    }

    /**
     * 渲染动态内容
     */
    _renderDynamicContent() {
        if (this.state.hasError) {
            this._showErrorState();
            return;
        }
        
        if (this.state.filteredEvents.length === 0) {
            this._showEmptyState();
            return;
        }
        
        this._renderEvents();
        this._renderControls();
        
        DOMUtils.hideElement(this.elements.loadingState);
        DOMUtils.hideElement(this.elements.errorState);
        DOMUtils.hideElement(this.elements.emptyState);
        DOMUtils.showElement(this.elements.eventsContainer);
        
        console.log('🎨 Dynamic content rendered', {
            events: this.state.filteredEvents.length,
            view: this.state.currentView
        });
    }

    /**
     * 显示错误状态
     */
    _showErrorState() {
        DOMUtils.hideElement(this.elements.loadingState);
        DOMUtils.showElement(this.elements.errorState);
        DOMUtils.hideElement(this.elements.emptyState);
        DOMUtils.hideElement(this.elements.eventsContainer);
    }

    /**
     * 显示空状态
     */
    _showEmptyState() {
        DOMUtils.hideElement(this.elements.loadingState);
        DOMUtils.hideElement(this.elements.errorState);
        DOMUtils.showElement(this.elements.emptyState);
        DOMUtils.hideElement(this.elements.eventsContainer);
        
        // 更新空状态消息
        const emptyMessage = this.state.searchQuery 
            ? `No events found matching "${this.state.searchQuery}". Try adjusting your search criteria.`
            : 'There are no upcoming events at the moment. Please check back later for new opportunities to make a difference.';
        
        const emptyMessageElement = DOMUtils.getElement('.empty-state p');
        if (emptyMessageElement) {
            DOMUtils.setText(emptyMessageElement, emptyMessage);
        }
    }

    /**
     * 渲染活动列表
     */
    _renderEvents() {
        if (!this.elements.eventsContainer) return;
        
        const events = this.state.filteredEvents;
        
        if (this.state.currentView === 'grid') {
            this._renderEventsGrid(events);
        } else {
            this._renderEventsList(events);
        }
        
        // 添加动画效果
        this._animateEventsAppearance();
        
        console.log('📋 Events rendered', {
            count: events.length,
            view: this.state.currentView
        });
    }

    /**
     * 渲染网格视图
     */
    _renderEventsGrid(events) {
        const eventsHTML = events.map((event, index) => this._renderEventCard(event, index)).join('');
        
        DOMUtils.setHTML(this.elements.eventsContainer, `
            <div class="events-grid" role="list" aria-label="Upcoming charity events">
                ${eventsHTML}
            </div>
        `);
        
        // 更新网格引用
        this.elements.eventsGrid = DOMUtils.getElement('.events-grid');
    }

    /**
     * 渲染列表视图
     */
    _renderEventsList(events) {
        const eventsHTML = events.map((event, index) => this._renderEventListItem(event, index)).join('');
        
        DOMUtils.setHTML(this.elements.eventsContainer, `
            <div class="events-list" role="list" aria-label="Upcoming charity events">
                ${eventsHTML}
            </div>
        `);
        
        // 更新列表引用
        this.elements.eventsList = DOMUtils.getElement('.events-list');
    }

    /**
     * 渲染活动卡片
     */
    _renderEventCard(event, index) {
        const formattedDate = Utils.formatDate(event.date_time, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const formattedPrice = Utils.formatCurrency(event.ticket_price);
        const progressPercentage = Utils.calculateProgress(event.current_amount, event.goal_amount);
        
        const viewDetailsBtn = `
            <button class="view-details-btn" 
                    onclick="window.location.href='event.html?id=${event.id}'"
                    aria-label="View details for ${Utils.escapeHtml(event.name)}">
                View Details
            </button>
        `;

        return `
            <div class="event-card" role="listitem" data-event-id="${event.id}" data-index="${index}">
                <div class="event-card-header">
                    <span class="event-category" aria-label="Event category: ${event.category_name}">
                        ${event.category_name}
                    </span>
                    <span class="event-price">${formattedPrice}</span>
                </div>
                
                <h3 class="event-title">${Utils.escapeHtml(event.name)}</h3>
                
                <div class="event-meta">
                    <div class="event-date" aria-label="Event date and time">
                        <span class="meta-icon">📅</span>
                        <time datetime="${event.date_time.toISOString()}">${formattedDate}</time>
                    </div>
                    
                    <div class="event-location" aria-label="Event location">
                        <span class="meta-icon">📍</span>
                        <span>${Utils.escapeHtml(event.location)}</span>
                    </div>
                </div>
                
                <p class="event-description">${Utils.escapeHtml(event.short_description)}</p>
                
                ${event.goal_amount > 0 ? `
                <div class="fundraising-progress" aria-label="Fundraising progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercentage}%"
                             aria-valuenow="${progressPercentage}" 
                             aria-valuemin="0" 
                             aria-valuemax="100">
                        </div>
                    </div>
                    <div class="progress-text">
                        <span>${Utils.formatCurrency(event.current_amount)} raised</span>
                        <span>${progressPercentage}%</span>
                    </div>
                </div>
                ` : ''}
                
                <div class="event-actions">
                    <button class="view-details-btn" 
                            onclick="window.location.href='event.html?id=${event.id}'"
                            aria-label="View details for ${Utils.escapeHtml(event.name)}">
                        View Details
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 渲染活动列表项
     */
    _renderEventListItem(event, index) {
        const formattedDate = Utils.formatDate(event.date_time, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const formattedPrice = Utils.formatCurrency(event.ticket_price);
        
        return `
            <div class="event-list-item" role="listitem" data-event-id="${event.id}" data-index="${index}">
                <div class="event-list-main">
                    <div class="event-list-header">
                        <h3 class="event-title">${Utils.escapeHtml(event.name)}</h3>
                        <span class="event-price">${formattedPrice}</span>
                    </div>
                    
                    <div class="event-list-meta">
                        <span class="event-category">${event.category_name}</span>
                        <span class="event-date">📅 ${formattedDate}</span>
                        <span class="event-location">📍 ${Utils.escapeHtml(event.location)}</span>
                    </div>
                    
                    <p class="event-description">${Utils.escapeHtml(event.short_description)}</p>
                </div>
                
                <div class="event-list-actions">
                    <button class="view-details-btn" 
                            onclick="window.location.href='event.html?id=${event.id}'"
                            aria-label="View details for ${Utils.escapeHtml(event.name)}">
                        View Details
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 渲染控制元素
     */
    _renderControls() {
        this._renderViewToggle();
        this._renderSortControls();
        this._renderSearchControls();
        this._renderPagination();
    }

    /**
     * 渲染视图切换
     */
    _renderViewToggle() {
        if (!this.elements.viewToggle) return;
        
        const viewToggleHTML = `
            <div class="view-controls" role="group" aria-label="Event view options">
                <button class="view-option ${this.state.currentView === 'grid' ? 'active' : ''}" 
                        data-view="grid"
                        aria-label="Grid view"
                        aria-pressed="${this.state.currentView === 'grid'}">
                    ⏹️ Grid
                </button>
                <button class="view-option ${this.state.currentView === 'list' ? 'active' : ''}" 
                        data-view="list"
                        aria-label="List view"
                        aria-pressed="${this.state.currentView === 'list'}">
                    📋 List
                </button>
            </div>
        `;
        
        DOMUtils.setHTML(this.elements.viewToggle, viewToggleHTML);
        
        // 添加事件监听
        const viewOptions = DOMUtils.getElements('.view-option');
        viewOptions.forEach(option => {
            this._addEventListener(option, 'click', (e) => {
                const view = e.target.getAttribute('data-view');
                this._setView(view);
            });
        });
    }

    /**
     * 设置视图模式
     */
    _setView(view) {
        if (this.state.currentView === view) return;
        
        this.state.currentView = view;
        this._renderEvents();
        
        // 更新ARIA状态
        const viewOptions = DOMUtils.getElements('.view-option');
        viewOptions.forEach(option => {
            const isActive = option.getAttribute('data-view') === view;
            option.setAttribute('aria-pressed', isActive);
            option.classList.toggle('active', isActive);
        });
        
        this._dispatchEvent('homepage:viewChanged', { view });
    }

    /**
     * 渲染排序控制
     */
    _renderSortControls() {
        if (!this.elements.sortSelect) return;
        
        const sortOptions = [
            { value: 'date_asc', label: 'Date (Earliest First)' },
            { value: 'date_desc', label: 'Date (Latest First)' },
            { value: 'name_asc', label: 'Name (A-Z)' },
            { value: 'name_desc', label: 'Name (Z-A)' },
            { value: 'location_asc', label: 'Location (A-Z)' },
            { value: 'location_desc', label: 'Location (Z-A)' },
            { value: 'price_asc', label: 'Price (Low to High)' },
            { value: 'price_desc', label: 'Price (High to Low)' }
        ];
        
        const currentSort = `${this.state.sortBy}_${this.state.sortOrder}`;
        
        const sortHTML = `
            <select class="sort-select" aria-label="Sort events by">
                ${sortOptions.map(option => `
                    <option value="${option.value}" ${currentSort === option.value ? 'selected' : ''}>
                        ${option.label}
                    </option>
                `).join('')}
            </select>
        `;
        
        DOMUtils.setHTML(this.elements.sortSelect, sortHTML);
        
        // 更新元素引用
        this.elements.sortSelect = DOMUtils.getElement('.sort-select');
        if (this.elements.sortSelect) {
            this._addEventListener(this.elements.sortSelect, 'change', 
                (e) => this._handleSortChange(e));
        }
    }

    /**
     * 渲染搜索控制
     */
    _renderSearchControls() {
        if (!this.elements.searchInput) return;
        
        const searchHTML = `
            <div class="search-control" role="search" aria-label="Search events">
                <input type="search" 
                       class="search-input" 
                       placeholder="Search events by name, location, or description..."
                       value="${Utils.escapeHtml(this.state.searchQuery)}"
                       aria-label="Search events">
                <button class="search-clear" aria-label="Clear search">✕</button>
            </div>
        `;
        
        DOMUtils.setHTML(this.elements.searchInput, searchHTML);
        
        // 更新元素引用
        this.elements.searchInput = DOMUtils.getElement('.search-input');
        const clearButton = DOMUtils.getElement('.search-clear');
        
        if (this.elements.searchInput) {
            const searchHandler = Utils.debounce(
                (e) => this._handleSearch(e), 
                300
            );
            this._addEventListener(this.elements.searchInput, 'input', searchHandler);
        }
        
        if (clearButton) {
            this._addEventListener(clearButton, 'click', () => this._clearSearch());
        }
    }

    /**
     * 渲染分页
     */
    _renderPagination() {
        // 简单的分页实现 - 可以根据需要扩展
        if (this.state.filteredEvents.length <= this.config.ui.eventsPerPage) {
            return;
        }
        
        // 这里可以添加分页逻辑...
    }

    /**
     * 设置交叉观察器（用于懒加载等）
     */
    _setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) return;
        
        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this._handleElementInView(entry.target);
                    }
                });
            },
            {
                rootMargin: `${this.config.ui.lazyLoadOffset}px`,
                threshold: 0.1
            }
        );
        
        console.log('👀 Intersection Observer setup complete');
    }

    /**
     * 处理元素进入视图
     */
    _handleElementInView(element) {
        // 可以在这里实现懒加载图片等
        if (element.classList.contains('event-card')) {
            element.classList.add('in-view');
        }
    }

    /**
     * 动画显示活动
     */
    _animateEventsAppearance() {
        const eventCards = DOMUtils.getElements('.event-card, .event-list-item');
        
        eventCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('animate-in');
        });
    }

    /**
     * 处理重试
     */
    async _handleRetry() {
        console.log('🔄 Retrying data load...');
        await this._loadInitialData();
    }

    /**
     * 处理视图切换
     */
    _handleViewToggle(event) {
        const view = event.target.value;
        this._setView(view);
    }

    /**
     * 处理排序变化
     */
    _handleSortChange(event) {
        const [sortBy, sortOrder] = event.target.value.split('_');
        
        this.state.sortBy = sortBy;
        this.state.sortOrder = sortOrder;
        this.state.filteredEvents = this._filterAndSortEvents(this.state.events);
        this._renderEvents();
        
        this._dispatchEvent('homepage:sorted', { sortBy, sortOrder });
    }

    /**
     * 处理搜索
     */
    _handleSearch(event) {
        const query = event.target.value.trim();
        this.state.searchQuery = query;
        this.state.filteredEvents = this._filterAndSortEvents(this.state.events);
        this._renderDynamicContent();
        
        this._dispatchEvent('homepage:searched', { query });
    }

    /**
     * 清除搜索
     */
    _clearSearch() {
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
        }
        
        this.state.searchQuery = '';
        this.state.filteredEvents = this._filterAndSortEvents(this.state.events);
        this._renderDynamicContent();
        
        this._dispatchEvent('homepage:searchCleared');
    }

    /**
     * 处理窗口大小变化
     */
    _handleResize() {
        const width = window.innerWidth;
        const isMobile = width < 768;
        
        // 在移动端自动切换到列表视图
        if (isMobile && this.state.currentView === 'grid') {
            this._setView('list');
        }
        
        this._dispatchEvent('homepage:resized', { width, isMobile });
    }

    /**
     * 处理刷新
     */
    async _handleRefresh() {
        console.log('🔄 Refreshing home page data...');
        await this._loadInitialData();
    }

    /**
     * 过滤和排序活动
     */
    _filterAndSortEvents(events) {
        let filtered = events;
        
        // 应用搜索过滤
        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            filtered = filtered.filter(event => 
                event.name.toLowerCase().includes(query) ||
                event.location.toLowerCase().includes(query) ||
                event.short_description.toLowerCase().includes(query) ||
                event.category_name.toLowerCase().includes(query)
            );
        }
        
        // 应用排序
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch (this.state.sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'location':
                    aValue = a.location.toLowerCase();
                    bValue = b.location.toLowerCase();
                    break;
                case 'price':
                    aValue = a.ticket_price;
                    bValue = b.ticket_price;
                    break;
                case 'date':
                default:
                    aValue = a.date_time;
                    bValue = b.date_time;
                    break;
            }
            
            if (this.state.sortOrder === 'desc') {
                [aValue, bValue] = [bValue, aValue];
            }
            
            if (aValue < bValue) return -1;
            if (aValue > bValue) return 1;
            return 0;
        });
        
        return filtered;
    }

    /**
     * 处理初始化错误
     */
    _handleInitializationError(error) {
        console.error('❌ Home page initialization failed:', error);
        
        // 显示基本的错误UI
        if (this.elements.eventsContainer) {
            DOMUtils.setHTML(this.elements.eventsContainer, `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Page Loading Error</h3>
                    <p>We're having trouble loading the home page. Please try refreshing.</p>
                    <button onclick="window.location.reload()" class="btn btn-primary">
                        Refresh Page
                    </button>
                </div>
            `);
        }
        
        ErrorHandler.handleApiError(error, 'home page initialization');
    }

    /**
     * 分发自定义事件
     */
    _dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail: {
                timestamp: new Date().toISOString(),
                source: 'HomePage',
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
     * 手动刷新数据
     */
    async refresh() {
        await this._loadInitialData();
    }

    /**
     * 销毁实例
     */
    destroy() {
        this._cleanupEventListeners();
        
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        console.log('🧹 HomePage destroyed');
    }
}

// 添加首页特定样式
const homePageStyles = `
/* 首页特定样式 */
.events-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: var(--space-6);
    margin-top: var(--space-8);
}

.events-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    margin-top: var(--space-8);
}

.event-card {
    background: var(--white);
    border-radius: var(--radius-xl);
    padding: var(--space-6);
    box-shadow: var(--shadow-md);
    transition: all var(--transition-base);
    border: 1px solid var(--gray-200);
    position: relative;
    overflow: hidden;
    opacity: 0;
    transform: translateY(20px);
}

.event-card.animate-in {
    animation: slideUp 0.6s ease-out forwards;
}

.event-card.in-view {
    opacity: 1;
    transform: translateY(0);
}

.event-card:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-xl);
    border-color: var(--primary-light);
}

.event-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--space-4);
}

.event-category {
    display: inline-block;
    background: var(--gray-100);
    color: var(--gray-600);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
}

.event-price {
    font-size: var(--text-lg);
    font-weight: var(--font-bold);
    color: var(--secondary-color);
}

.event-title {
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    color: var(--primary-color);
    margin-bottom: var(--space-3);
    line-height: var(--leading-tight);
}

.event-meta {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-bottom: var(--space-4);
}

.event-date, .event-location {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--gray-600);
    font-size: var(--text-sm);
}

.meta-icon {
    font-size: var(--text-base);
    width: 16px;
    text-align: center;
}

.event-description {
    color: var(--gray-700);
    line-height: var(--leading-relaxed);
    margin-bottom: var(--space-4);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.fundraising-progress {
    margin: var(--space-4) 0;
}

.progress-bar {
    width: 100%;
    height: 8px;
    background: var(--gray-200);
    border-radius: var(--radius-full);
    overflow: hidden;
    margin-bottom: var(--space-2);
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
}

.event-actions {
    margin-top: var(--space-4);
}

.view-details-btn {
    width: 100%;
    margin-top: var(--space-4);
}

/* 列表视图样式 */
.event-list-item {
    background: var(--white);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--gray-200);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-6);
    transition: all var(--transition-base);
    opacity: 0;
    transform: translateX(-20px);
}

.event-list-item.animate-in {
    animation: slideRight 0.6s ease-out forwards;
}

.event-list-item:hover {
    transform: translateX(-4px);
    box-shadow: var(--shadow-lg);
    border-color: var(--primary-light);
}

.event-list-main {
    flex: 1;
}

.event-list-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--space-3);
}

.event-list-meta {
    display: flex;
    gap: var(--space-4);
    margin-bottom: var(--space-3);
    flex-wrap: wrap;
}

.event-list-meta > span {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--gray-600);
}

.event-list-actions {
    flex-shrink: 0;
}

/* 控制元素样式 */
.view-controls {
    display: flex;
    gap: var(--space-2);
    background: var(--white);
    padding: var(--space-2);
    border-radius: var(--radius-lg);
    border: 1px solid var(--gray-200);
}

.view-option {
    padding: var(--space-2) var(--space-4);
    border: none;
    background: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: var(--text-sm);
}

.view-option.active {
    background: var(--primary-light);
    color: var(--white);
}

.view-option:hover:not(.active) {
    background: var(--gray-100);
}

.sort-select, .search-input {
    width: 100%;
    max-width: 300px;
}

.search-control {
    position: relative;
    max-width: 400px;
}

.search-input {
    padding-right: var(--space-10);
}

.search-clear {
    position: absolute;
    right: var(--space-3);
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--gray-500);
    cursor: pointer;
    padding: var(--space-1);
    border-radius: var(--radius-full);
}

.search-clear:hover {
    background: var(--gray-100);
    color: var(--gray-700);
}

/* 动画 */
@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes slideRight {
    from {
        opacity: 0;
        transform: translateX(-20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

/* 加载进度条 */
.loading-progress {
    width: 0%;
    height: 3px;
    background: linear-gradient(90deg, var(--primary-light), var(--secondary-color));
    border-radius: var(--radius-full);
    transition: width 0.3s ease;
    position: absolute;
    top: 0;
    left: 0;
}

/* 响应式设计 */
@media (max-width: 767px) {
    .events-grid {
        grid-template-columns: 1fr;
        gap: var(--space-4);
    }
    
    .event-list-item {
        flex-direction: column;
        align-items: stretch;
        gap: var(--space-4);
    }
    
    .event-list-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-2);
    }
    
    .event-list-meta {
        flex-direction: column;
        gap: var(--space-2);
    }
    
    .view-controls {
        width: 100%;
        justify-content: center;
    }
}

@media (min-width: 768px) and (max-width: 1023px) {
    .events-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (min-width: 1024px) {
    .events-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}
`;

// 注入首页样式
const homeStyleElement = DOMUtils.createElement('style');
DOMUtils.setText(homeStyleElement, homePageStyles);
document.head.appendChild(homeStyleElement);

// 创建全局首页实例
window.homePage = new HomePage();

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    window.homePage.init().catch(error => {
        console.error('❌ Failed to initialize home page:', error);
    });
});

console.log('🏠 Home page module loaded');