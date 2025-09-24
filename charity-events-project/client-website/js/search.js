/**
 * 搜索页管理类
 * 处理事件搜索、筛选和结果展示
 * 展示复杂的客户端交互和API集成
 */
class SearchPage {
    /**
     * 构造函数 - 初始化搜索页管理器
     */
    constructor() {
        // 页面配置
        this.config = {
            // 搜索配置
            search: {
                debounceDelay: 300,
                minSearchLength: 2,
                maxResults: 100
            },
            
            // 筛选配置
            filters: {
                dateFormat: 'YYYY-MM-DD',
                locationMaxLength: 50
            },
            
            // UI配置
            ui: {
                resultsPerPage: 12,
                animationDuration: 300,
                highlightSearchTerms: true
            }
        };
        
        // 状态管理
        this.state = {
            events: [],
            filteredEvents: [],
            categories: [],
            searchResults: [],
            isLoading: false,
            isSearching: false,
            hasSearched: false,
            hasError: false,
            errorMessage: '',
            currentFilters: {
                date: '',
                location: '',
                category: ''
            },
            searchQuery: '',
            currentPage: 1,
            totalPages: 1,
            sortBy: 'relevance',
            sortOrder: 'desc'
        };
        
        // DOM元素引用
        this.elements = {
            // 表单元素
            searchForm: null,
            dateFilter: null,
            locationFilter: null,
            categoryFilter: null,
            searchButton: null,
            clearButton: null,
            
            // 结果元素
            resultsContainer: null,
            resultsSummary: null,
            searchResults: null,
            noResults: null,
            
            // 状态元素
            searchLoading: null,
            searchError: null,
            
            // 控制元素
            sortSelect: null,
            viewToggle: null
        };
        
        // API实例
        this.api = window.charityEventsAPI;
        
        // 事件监听器引用
        this.eventListeners = [];
        
        // 搜索历史
        this.searchHistory = [];
        
        console.log('🔍 SearchPage initialized', { 
            config: this.config,
            hasAPI: !!this.api
        });
    }

    /**
     * 初始化搜索页
     */
    async init() {
        try {
            console.log('🚀 Initializing search page...');
            
            // 等待依赖项
            await this._waitForDependencies();
            
            this._cacheElements();
            this._validateDOMStructure();
            this._setupEventListeners();
            await this._loadInitialData();
            this._setupSearchHistory();
            this._restoreSearchState();
            
            console.log('✅ Search page initialized successfully');
            
            this._dispatchEvent('searchpage:ready', {
                categoriesCount: this.state.categories.length
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize search page:', error);
            this._handleInitializationError(error);
        }
    }

    /**
     * 等待依赖项就绪
     */
    async _waitForDependencies() {
        const maxWaitTime = 5000;
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
    }

    /**
     * 缓存DOM元素引用
     */
    _cacheElements() {
        this.elements = {
            // 表单元素
            searchForm: DOMUtils.getElement('#search-form'),
            dateFilter: DOMUtils.getElement('#date-filter'),
            locationFilter: DOMUtils.getElement('#location-filter'),
            categoryFilter: DOMUtils.getElement('#category-filter'),
            searchButton: DOMUtils.getElement('#search-button'),
            clearButton: DOMUtils.getElement('#clear-filters'),
            
            // 结果元素
            resultsContainer: DOMUtils.getElement('#search-results'),
            resultsSummary: DOMUtils.getElement('#results-summary'),
            searchResults: DOMUtils.getElement('#search-results'),
            noResults: DOMUtils.getElement('#no-results'),
            
            // 状态元素
            searchLoading: DOMUtils.getElement('#search-loading'),
            searchError: DOMUtils.getElement('#search-error'),
            
            // 控制元素
            sortSelect: DOMUtils.getElement('#sort-select'),
            viewToggle: DOMUtils.getElement('#view-toggle')
        };

        this._validateRequiredElements();
    }

    /**
     * 验证必需元素
     */
    _validateRequiredElements() {
        const requiredElements = [
            'searchForm',
            'resultsContainer',
            'searchLoading',
            'searchError',
            'noResults'
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
        if (!this.elements.searchForm) {
            this.elements.searchForm = DOMUtils.createElement('form', {
                'id': 'search-form',
                'class': 'search-form',
                'role': 'search'
            });
        }
        
        if (!this.elements.resultsContainer) {
            this.elements.resultsContainer = DOMUtils.createElement('div', {
                'id': 'search-results',
                'class': 'events-grid',
                'aria-live': 'polite'
            });
        }
    }

    /**
     * 验证DOM结构
     */
    _validateDOMStructure() {
        const requiredSections = ['search', 'results'];
        const missingSections = [];
        
        if (!this.elements.searchForm) missingSections.push('search');
        if (!this.elements.resultsContainer) missingSections.push('results');
        
        if (missingSections.length > 0) {
            console.warn('⚠️ Missing page sections:', missingSections);
        }
    }

    /**
     * 设置事件监听器
     */
    _setupEventListeners() {
        this._cleanupEventListeners();
        
        // 表单提交
        if (this.elements.searchForm) {
            this._addEventListener(this.elements.searchForm, 'submit', 
                (e) => this._handleFormSubmit(e));
        }
        
        // 筛选器变化
        if (this.elements.dateFilter) {
            this._addEventListener(this.elements.dateFilter, 'change', 
                () => this._handleFilterChange());
        }
        
        if (this.elements.locationFilter) {
            const locationHandler = Utils.debounce(
                () => this._handleFilterChange(), 
                this.config.search.debounceDelay
            );
            this._addEventListener(this.elements.locationFilter, 'input', locationHandler);
        }
        
        if (this.elements.categoryFilter) {
            this._addEventListener(this.elements.categoryFilter, 'change', 
                () => this._handleFilterChange());
        }
        
        // 清除按钮
        if (this.elements.clearButton) {
            this._addEventListener(this.elements.clearButton, 'click', 
                () => this._handleClearFilters());
        }
        
        // 排序控制
        if (this.elements.sortSelect) {
            this._addEventListener(this.elements.sortSelect, 'change', 
                (e) => this._handleSortChange(e));
        }
        
        // 错误重试
        const retryButton = DOMUtils.getElement('#search-retry');
        if (retryButton) {
            this._addEventListener(retryButton, 'click', 
                () => this._handleRetrySearch());
        }
        
        // 重置搜索
        const resetSearch = DOMUtils.getElement('#reset-search');
        if (resetSearch) {
            this._addEventListener(resetSearch, 'click', 
                () => this._handleResetSearch());
        }
        
        console.log('🎯 Search page event listeners setup complete');
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
     * 加载初始数据
     */
    async _loadInitialData() {
        try {
            console.log('📥 Loading initial data for search page...');
            
            this._showLoadingState();
            
            // 加载分类数据
            const categories = await this.api.fetchCategories();
            this.state.categories = categories;
            
            // 渲染分类筛选器
            this._renderCategoryFilter();
            
            // 加载所有事件用于客户端搜索
            const events = await this.api.fetchEvents();
            this.state.events = events;
            this.state.filteredEvents = events;
            
            this._hideLoadingState();
            
            console.log('✅ Initial data loaded', {
                categories: categories.length,
                events: events.length
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
        DOMUtils.hideElement(this.elements.searchError);
        DOMUtils.hideElement(this.elements.noResults);
        DOMUtils.hideElement(this.elements.resultsContainer);
        
        this.state.isLoading = true;
    }

    /**
     * 隐藏加载状态
     */
    _hideLoadingState() {
        this.state.isLoading = false;
    }

    /**
     * 处理数据加载错误
     */
    _handleDataLoadError(error) {
        this.state.isLoading = false;
        this.state.hasError = true;
        this.state.errorMessage = error.message;
        
        this._showErrorState();
        ErrorHandler.handleApiError(error, 'search page data loading');
    }

    /**
     * 显示错误状态
     */
    _showErrorState() {
        DOMUtils.showElement(this.elements.searchError);
        DOMUtils.hideElement(this.elements.noResults);
        DOMUtils.hideElement(this.elements.resultsContainer);
        
        // 更新错误消息
        const errorMessageElement = DOMUtils.getElement('#search-error-message');
        if (errorMessageElement) {
            const userFriendlyMessage = this._getUserFriendlyErrorMessage();
            DOMUtils.setText(errorMessageElement, userFriendlyMessage);
        }
    }

    /**
     * 获取用户友好的错误消息
     */
    _getUserFriendlyErrorMessage() {
        return 'We encountered an error while loading search data. Please try again.';
    }

    /**
     * 渲染分类筛选器
     */
    _renderCategoryFilter() {
        if (!this.elements.categoryFilter) return;
        
        const categories = this.state.categories;
        
        const optionsHTML = `
            <option value="">All Categories</option>
            ${categories.map(category => `
                <option value="${category.id}">${Utils.escapeHtml(category.name)}</option>
            `).join('')}
        `;
        
        DOMUtils.setHTML(this.elements.categoryFilter, optionsHTML);
    }

    /**
     * 设置搜索历史
     */
    _setupSearchHistory() {
        this.searchHistory = StorageManager.getItem('search_history', []);
        console.log('📚 Search history loaded:', this.searchHistory.length);
    }

    /**
     * 保存搜索状态
     */
    _saveSearchState() {
        const searchState = {
            filters: this.state.currentFilters,
            searchQuery: this.state.searchQuery,
            sortBy: this.state.sortBy,
            sortOrder: this.state.sortOrder
        };
        
        StorageManager.setItem('search_state', searchState);
    }

    /**
     * 恢复搜索状态
     */
    _restoreSearchState() {
        const savedState = StorageManager.getItem('search_state');
        
        if (savedState) {
            this.state.currentFilters = savedState.filters || {};
            this.state.searchQuery = savedState.searchQuery || '';
            this.state.sortBy = savedState.sortBy || 'relevance';
            this.state.sortOrder = savedState.sortOrder || 'desc';
            
            // 恢复表单值
            this._restoreFormValues();
            
            console.log('💾 Search state restored');
        }
    }

    /**
     * 恢复表单值
     */
    _restoreFormValues() {
        if (this.elements.dateFilter && this.state.currentFilters.date) {
            this.elements.dateFilter.value = this.state.currentFilters.date;
        }
        
        if (this.elements.locationFilter && this.state.currentFilters.location) {
            this.elements.locationFilter.value = this.state.currentFilters.location;
        }
        
        if (this.elements.categoryFilter && this.state.currentFilters.category) {
            this.elements.categoryFilter.value = this.state.currentFilters.category;
        }
    }

    /**
     * 处理表单提交
     */
    async _handleFormSubmit(event) {
        event.preventDefault();
        console.log('📤 Search form submitted');
        
        await this._performSearch();
    }

    /**
     * 处理筛选器变化
     */
    async _handleFilterChange() {
        console.log('🔄 Filters changed');
        
        // 更新状态
        this._updateFiltersState();
        
        // 自动搜索（如果有活动筛选器）
        if (this._hasActiveFilters()) {
            await this._performSearch();
        } else {
            // 清除结果
            this._clearResults();
        }
    }

    /**
     * 更新筛选器状态
     */
    _updateFiltersState() {
        this.state.currentFilters = {
            date: this.elements.dateFilter ? this.elements.dateFilter.value : '',
            location: this.elements.locationFilter ? this.elements.locationFilter.value : '',
            category: this.elements.categoryFilter ? this.elements.categoryFilter.value : ''
        };
        
        this._saveSearchState();
    }

    /**
     * 检查是否有活动筛选器
     */
    _hasActiveFilters() {
        return Object.values(this.state.currentFilters).some(value => value && value.trim() !== '');
    }

    /**
     * 执行搜索
     */
    async _performSearch() {
        try {
            console.log('🔍 Performing search...', this.state.currentFilters);
            
            this._showSearchLoading();
            this.state.isSearching = true;
            this.state.hasSearched = true;
            
            // 使用API搜索
            const searchResults = await this.api.searchEvents(this.state.currentFilters);
            
            // 处理搜索结果
            this.state.searchResults = searchResults;
            this.state.filteredEvents = this._sortEvents(searchResults);
            
            this._hideSearchLoading();
            this._renderSearchResults();
            this._updateSearchHistory();
            this._saveSearchState();
            
            console.log('✅ Search completed', {
                results: searchResults.length,
                filters: this.state.currentFilters
            });
            
            this._dispatchEvent('search:performed', {
                resultsCount: searchResults.length,
                filters: this.state.currentFilters
            });
            
        } catch (error) {
            console.error('❌ Search failed:', error);
            this._handleSearchError(error);
        }
    }

    /**
     * 显示搜索加载状态
     */
    _showSearchLoading() {
        if (this.elements.searchLoading) {
            DOMUtils.showElement(this.elements.searchLoading);
        }
        
        if (this.elements.searchButton) {
            const btnText = this.elements.searchButton.querySelector('.btn-text');
            const btnLoading = this.elements.searchButton.querySelector('.btn-loading');
            
            if (btnText && btnLoading) {
                DOMUtils.hideElement(btnText);
                DOMUtils.showElement(btnLoading);
            }
        }
        
        DOMUtils.hideElement(this.elements.searchError);
        DOMUtils.hideElement(this.elements.noResults);
        DOMUtils.hideElement(this.elements.resultsContainer);
    }

    /**
     * 隐藏搜索加载状态
     */
    _hideSearchLoading() {
        this.state.isSearching = false;
        
        if (this.elements.searchLoading) {
            DOMUtils.hideElement(this.elements.searchLoading);
        }
        
        if (this.elements.searchButton) {
            const btnText = this.elements.searchButton.querySelector('.btn-text');
            const btnLoading = this.elements.searchButton.querySelector('.btn-loading');
            
            if (btnText && btnLoading) {
                DOMUtils.showElement(btnText);
                DOMUtils.hideElement(btnLoading);
            }
        }
    }

    /**
     * 处理搜索错误
     */
    _handleSearchError(error) {
        this.state.isSearching = false;
        this.state.hasError = true;
        this.state.errorMessage = error.message;
        
        this._hideSearchLoading();
        this._showErrorState();
        
        ErrorHandler.handleApiError(error, 'event search');
    }

    /**
     * 渲染搜索结果
     */
    _renderSearchResults() {
        if (this.state.searchResults.length === 0) {
            this._showNoResults();
            return;
        }
        
        this._renderResultsSummary();
        this._renderEventsGrid();
        
        DOMUtils.hideElement(this.elements.searchError);
        DOMUtils.hideElement(this.elements.noResults);
        DOMUtils.showElement(this.elements.resultsContainer);
    }

    /**
     * 显示无结果状态
     */
    _showNoResults() {
        DOMUtils.hideElement(this.elements.searchError);
        DOMUtils.showElement(this.elements.noResults);
        DOMUtils.hideElement(this.elements.resultsContainer);
        
        // 更新无结果消息
        const noResultsMessage = this._getNoResultsMessage();
        const noResultsElement = DOMUtils.getElement('#no-results p');
        if (noResultsElement) {
            DOMUtils.setText(noResultsElement, noResultsMessage);
        }
    }

    /**
     * 获取无结果消息
     */
    _getNoResultsMessage() {
        const activeFilters = this._getActiveFilterNames();
        
        if (activeFilters.length > 0) {
            return `No events found matching your current filters: ${activeFilters.join(', ')}. Try adjusting your search criteria.`;
        }
        
        return 'No events found matching your search criteria. Try adjusting your filters or search terms.';
    }

    /**
     * 获取活动筛选器名称
     */
    _getActiveFilterNames() {
        const activeFilters = [];
        
        if (this.state.currentFilters.date) {
            activeFilters.push('date');
        }
        
        if (this.state.currentFilters.location) {
            activeFilters.push('location');
        }
        
        if (this.state.currentFilters.category) {
            const category = this.state.categories.find(cat => cat.id == this.state.currentFilters.category);
            activeFilters.push(category ? category.name : 'category');
        }
        
        return activeFilters;
    }

    /**
     * 渲染结果摘要
     */
    _renderResultsSummary() {
        if (!this.elements.resultsSummary) return;
        
        const resultsCount = this.state.searchResults.length;
        const filterText = this._getFilterDescription();
        
        const summaryText = resultsCount === 1 
            ? `1 event found${filterText}`
            : `${resultsCount} events found${filterText}`;
        
        DOMUtils.setText(this.elements.resultsSummary, summaryText);
    }

    /**
     * 获取筛选器描述
     */
    _getFilterDescription() {
        const descriptions = [];
        
        if (this.state.currentFilters.date) {
            const date = new Date(this.state.currentFilters.date);
            descriptions.push(`on ${Utils.formatDate(date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
        }
        
        if (this.state.currentFilters.location) {
            descriptions.push(`in ${this.state.currentFilters.location}`);
        }
        
        if (this.state.currentFilters.category) {
            const category = this.state.categories.find(cat => cat.id == this.state.currentFilters.category);
            if (category) {
                descriptions.push(`in ${category.name} category`);
            }
        }
        
        return descriptions.length > 0 ? ` ${descriptions.join(' ')}` : '';
    }

    /**
     * 渲染事件网格
     */
    _renderEventsGrid() {
        if (!this.elements.resultsContainer) return;
        
        const eventsHTML = this.state.filteredEvents.map((event, index) => 
            this._renderEventCard(event, index)
        ).join('');
        
        DOMUtils.setHTML(this.elements.resultsContainer, `
            <div class="events-grid" role="list" aria-label="Search results">
                ${eventsHTML}
            </div>
        `);
        
        // 添加动画
        this._animateResultsAppearance();
    }

    /**
     * 渲染事件卡片
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
        
        return `
            <div class="event-card" role="listitem" data-event-id="${event.id}" data-index="${index}">
                <div class="event-card-header">
                    <span class="event-category" aria-label="Event category: ${event.category_name}">
                        ${event.category_name}
                    </span>
                    <span class="event-price">${formattedPrice}</span>
                </div>
                
                <h3 class="event-title">${this._highlightSearchTerms(event.name)}</h3>
                
                <div class="event-meta">
                    <div class="event-date" aria-label="Event date and time">
                        <span class="meta-icon">📅</span>
                        <time datetime="${event.date_time.toISOString()}">${formattedDate}</time>
                    </div>
                    
                    <div class="event-location" aria-label="Event location">
                        <span class="meta-icon">📍</span>
                        <span>${this._highlightSearchTerms(event.location)}</span>
                    </div>
                </div>
                
                <p class="event-description">${this._highlightSearchTerms(event.short_description)}</p>
                
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
     * 高亮搜索术语
     */
    _highlightSearchTerms(text) {
        if (!this.config.ui.highlightSearchTerms || !this.state.currentFilters.location) {
            return Utils.escapeHtml(text);
        }
        
        const searchTerm = this.state.currentFilters.location.toLowerCase();
        const escapedText = Utils.escapeHtml(text);
        
        if (!text.toLowerCase().includes(searchTerm)) {
            return escapedText;
        }
        
        const regex = new RegExp(`(${this._escapeRegex(searchTerm)})`, 'gi');
        return escapedText.replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    /**
     * 转义正则表达式字符
     */
    _escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * 动画显示结果
     */
    _animateResultsAppearance() {
        const eventCards = DOMUtils.getElements('.event-card');
        
        eventCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('animate-in');
        });
    }

    /**
     * 处理清除筛选器
     */
    _handleClearFilters() {
        console.log('🧹 Clearing all filters');
        
        // 重置表单
        if (this.elements.searchForm) {
            this.elements.searchForm.reset();
        }
        
        // 重置状态
        this.state.currentFilters = {
            date: '',
            location: '',
            category: ''
        };
        
        this.state.searchResults = [];
        this.state.hasSearched = false;
        
        // 清除结果
        this._clearResults();
        this._saveSearchState();
        
        this._dispatchEvent('search:filtersCleared');
    }

    /**
     * 清除结果
     */
    _clearResults() {
        DOMUtils.hideElement(this.elements.searchError);
        DOMUtils.hideElement(this.elements.noResults);
        DOMUtils.hideElement(this.elements.resultsContainer);
        
        if (this.elements.resultsSummary) {
            DOMUtils.setText(this.elements.resultsSummary, '');
        }
    }

    /**
     * 处理排序变化
     */
    _handleSortChange(event) {
        const [sortBy, sortOrder] = event.target.value.split('_');
        
        this.state.sortBy = sortBy;
        this.state.sortOrder = sortOrder;
        this.state.filteredEvents = this._sortEvents(this.state.searchResults);
        this._renderEventsGrid();
        
        this._dispatchEvent('search:sorted', { sortBy, sortOrder });
    }

    /**
     * 排序事件
     */
    _sortEvents(events) {
        return [...events].sort((a, b) => {
            let aValue, bValue;
            
            switch (this.state.sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'date':
                    aValue = a.date_time;
                    bValue = b.date_time;
                    break;
                case 'price':
                    aValue = a.ticket_price;
                    bValue = b.ticket_price;
                    break;
                case 'location':
                    aValue = a.location.toLowerCase();
                    bValue = b.location.toLowerCase();
                    break;
                case 'relevance':
                default:
                    // 默认按日期排序
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
    }

    /**
     * 处理重试搜索
     */
    async _handleRetrySearch() {
        console.log('🔄 Retrying search...');
        await this._performSearch();
    }

    /**
     * 处理重置搜索
     */
    _handleResetSearch() {
        this._handleClearFilters();
    }

    /**
     * 更新搜索历史
     */
    _updateSearchHistory() {
        const searchEntry = {
            filters: { ...this.state.currentFilters },
            resultsCount: this.state.searchResults.length,
            timestamp: new Date().toISOString()
        };
        
        // 添加到历史
        this.searchHistory.unshift(searchEntry);
        
        // 保持历史长度
        if (this.searchHistory.length > 10) {
            this.searchHistory = this.searchHistory.slice(0, 10);
        }
        
        // 保存到本地存储
        StorageManager.setItem('search_history', this.searchHistory);
    }

    /**
     * 处理初始化错误
     */
    _handleInitializationError(error) {
        console.error('❌ Search page initialization failed:', error);
        
        if (this.elements.resultsContainer) {
            DOMUtils.setHTML(this.elements.resultsContainer, `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Page Loading Error</h3>
                    <p>We're having trouble loading the search page. Please try refreshing.</p>
                    <button onclick="window.location.reload()" class="btn btn-primary">
                        Refresh Page
                    </button>
                </div>
            `);
        }
        
        ErrorHandler.handleApiError(error, 'search page initialization');
    }

    /**
     * 分发自定义事件
     */
    _dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail: {
                timestamp: new Date().toISOString(),
                source: 'SearchPage',
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
            config: { ...this.config },
            searchHistory: [...this.searchHistory]
        };
    }

    /**
     * 手动执行搜索
     */
    async search(filters = {}) {
        this.state.currentFilters = { ...this.state.currentFilters, ...filters };
        await this._performSearch();
    }

    /**
     * 销毁实例
     */
    destroy() {
        this._cleanupEventListeners();
        console.log('🧹 SearchPage destroyed');
    }
}

// 搜索页特定样式
const searchPageStyles = `
/* 搜索页特定样式 */
.search-highlight {
    background-color: #fff3cd;
    padding: 0.1em 0.2em;
    border-radius: var(--radius-sm);
    font-weight: var(--font-bold);
}

.search-form {
    background: var(--white);
    border-radius: var(--radius-xl);
    padding: var(--space-6);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--gray-200);
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--space-6);
    margin-bottom: var(--space-6);
}

.form-group {
    display: flex;
    flex-direction: column;
}

.form-label {
    font-weight: var(--font-semibold);
    color: var(--gray-700);
    margin-bottom: var(--space-2);
    font-size: var(--text-sm);
}

.form-input, .form-select {
    padding: var(--space-3) var(--space-4);
    border: 2px solid var(--gray-300);
    border-radius: var(--radius-lg);
    font-size: var(--text-base);
    transition: all var(--transition-fast);
    background-color: var(--white);
}

.form-input:focus, .form-select:focus {
    outline: none;
    border-color: var(--primary-light);
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-actions {
    display: flex;
    gap: var(--space-4);
    justify-content: center;
    flex-wrap: wrap;
}

.results-summary {
    font-size: var(--text-lg);
    color: var(--gray-600);
    background: var(--white);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-lg);
    border: 1px solid var(--gray-200);
}

/* 加载状态 */
#search-loading {
    text-align: center;
    padding: var(--space-8);
}

.btn-loading {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
}

.btn-loading::after {
    content: '';
    width: 12px;
    height: 12px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: var(--radius-full);
    animation: spin 1s linear infinite;
}

/* 响应式设计 */
@media (max-width: 767px) {
    .form-grid {
        grid-template-columns: 1fr;
        gap: var(--space-4);
    }
    
    .form-actions {
        flex-direction: column;
    }
    
    .form-actions .btn {
        width: 100%;
    }
    
    .results-summary {
        font-size: var(--text-base);
        text-align: center;
    }
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;

// 注入搜索页样式
const searchStyleElement = DOMUtils.createElement('style');
DOMUtils.setText(searchStyleElement, searchPageStyles);
document.head.appendChild(searchStyleElement);

// 创建全局搜索页实例
window.searchPage = new SearchPage();

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    window.searchPage.init().catch(error => {
        console.error('❌ Failed to initialize search page:', error);
    });
});

console.log('🔍 Search page module loaded');