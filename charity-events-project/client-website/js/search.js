// 整合了原main.js中的通用功能和search.js的搜索功能

// 工具函数 - 原main.js中的通用功能
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatCurrency(amount) {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// 修复日期显示问题 - 增强版日期格式化函数

// 工具函数
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatCurrency(amount) {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return 'Invalid Date';
    }
}

function calculateProgress(current, total) {
    if (!total || total === 0) return 0;
    return Math.min(100, Math.round((current / total) * 100));
}

// 状态管理
let categories = [];

// 加载分类数据
async function loadCategories() {
    try {
        console.log('📥 Loading categories...');
        const response = await fetch('http://localhost:3000/api/categories');
        const data = await response.json();
        
        if (data.success && data.data) {
            categories = data.data;
            populateCategoryFilter();
        }
    } catch (error) {
        console.error('❌ Failed to load categories:', error);
    }
}

// 填充分类筛选器
function populateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter && categories.length > 0) {
        const optionsHTML = categories.map(category => 
            `<option value="${category.id}">${escapeHtml(category.name)}</option>`
        ).join('');
        categoryFilter.innerHTML = '<option value="">All Categories</option>' + optionsHTML;
    }
}

// 显示搜索结果
function displaySearchResults(events, filters = {}) {
    console.log('🎨 Displaying search results:', events);
    
    const container = document.getElementById('search-results');
    const loading = document.getElementById('search-loading');
    const error = document.getElementById('search-error');
    const empty = document.getElementById('no-results');
    const summary = document.getElementById('results-summary');
    
    // 隐藏其他状态
    if (loading) loading.classList.add('hidden');
    if (error) error.classList.add('hidden');
    if (empty) empty.classList.add('hidden');
    
    // 更新结果摘要
    if (summary) {
        const filterText = getFilterDescription(filters);
        const resultsCount = events.length;
        const summaryText = resultsCount === 1 
            ? `1 event found${filterText}`
            : `${resultsCount} events found${filterText}`;
        summary.textContent = summaryText;
    }
    
    if (events.length === 0) {
        if (empty) {
            const message = getNoResultsMessage(filters);
            document.getElementById('no-results-message').textContent = message;
            empty.classList.remove('hidden');
        }
        return;
    }
    
    // 显示结果容器
    if (container) {
        container.classList.remove('hidden');
        
        // 生成活动卡片HTML
        const eventsHTML = events.map(event => `
            <div class="event-card">
                <div class="event-card-header">
                    <span class="event-category">${escapeHtml(event.category_name || 'Uncategorized')}</span>
                    <span class="event-price">${formatCurrency(event.ticket_price)}</span>
                </div>
                
                <h3 class="event-title">${escapeHtml(event.name)}</h3>
                
                <div class="event-meta">
                    <div class="event-date">
                        <span class="meta-icon">📅</span>
                        <time>${formatDate(event.date_time)}</time>
                    </div>
                    
                    <div class="event-location">
                        <span class="meta-icon">📍</span>
                        <span>${escapeHtml(event.location)}</span>
                    </div>
                </div>
                
                <p class="event-description">${escapeHtml(event.short_description)}</p>
                
                ${event.goal_amount > 0 ? `
                <div class="fundraising-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${calculateProgress(event.current_amount, event.goal_amount)}%"></div>
                    </div>
                    <div class="progress-text">
                        <span>${formatCurrency(event.current_amount)} raised</span>
                        <span>${calculateProgress(event.current_amount, event.goal_amount)}%</span>
                    </div>
                </div>
                ` : ''}
                
                <div class="event-actions">
                    <button class="view-details-btn" onclick="window.location.href='event.html?id=${event.id}'">
                        View Details
                    </button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = eventsHTML;
    }
}

function getFilterDescription(filters) {
    const descriptions = [];
    
    if (filters.date) {
        const date = new Date(filters.date);
        descriptions.push(`on ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
    }
    
    if (filters.location) {
        descriptions.push(`in ${filters.location}`);
    }
    
    if (filters.category) {
        const category = categories.find(cat => cat.id == filters.category);
        if (category) {
            descriptions.push(`in ${category.name} category`);
        }
    }
    
    return descriptions.length > 0 ? ` ${descriptions.join(' ')}` : '';
}

function getNoResultsMessage(filters) {
    const activeFilters = [];
    
    if (filters.date) activeFilters.push('date');
    if (filters.location) activeFilters.push('location');
    if (filters.category) {
        const category = categories.find(cat => cat.id == filters.category);
        activeFilters.push(category ? category.name : 'category');
    }
    
    if (activeFilters.length > 0) {
        return `No events found matching your current filters: ${activeFilters.join(', ')}. Try adjusting your search criteria.`;
    }
    
    return 'No events found matching your search criteria. Try adjusting your filters or search terms.';
}

function showSearchLoading() {
    const loading = document.getElementById('search-loading');
    const error = document.getElementById('search-error');
    const empty = document.getElementById('no-results');
    const results = document.getElementById('search-results');
    
    if (loading) loading.classList.remove('hidden');
    if (error) error.classList.add('hidden');
    if (empty) empty.classList.add('hidden');
    if (results) results.classList.add('hidden');
}

function showSearchError(error) {
    const loading = document.getElementById('search-loading');
    const errorDiv = document.getElementById('search-error');
    
    if (loading) loading.classList.add('hidden');
    if (errorDiv) {
        document.getElementById('search-error-message').textContent = 
            error.message || 'We encountered an error while searching. Please try again.';
        errorDiv.classList.remove('hidden');
    }
}

// 搜索函数
async function performSearch(filters = {}) {
    console.log('🔍 Performing search with filters:', filters);
    showSearchLoading();
    
    try {
        // 方法1: 使用搜索端点
        let url = 'http://localhost:3000/api/events/search';
        const params = new URLSearchParams();
        
        if (filters.date) params.append('date', filters.date);
        if (filters.location) params.append('location', filters.location);
        if (filters.category) params.append('category', filters.category);
        
        const queryString = params.toString();
        if (queryString) {
            url += '?' + queryString;
        }
        
        console.log('🌐 Searching:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            // 如果搜索端点失败，尝试备用方案
            console.log('🔄 Search endpoint failed, trying client-side filtering');
            throw new Error(`Search endpoint returned ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Search results from API:', data);
        
        // 处理不同的响应格式
        const events = data.data || data || [];
        displaySearchResults(events, filters);
        
    } catch (error) {
        console.error('❌ Search API failed, trying alternative method:', error);
        
        // 备用方案：获取所有事件然后在客户端筛选
        try {
            await performClientSideSearch(filters);
        } catch (fallbackError) {
            console.error('❌ Fallback search also failed:', fallbackError);
            showSearchError(error);
        }
    }
}

// 备用方案：客户端搜索
async function performClientSideSearch(filters = {}) {
    console.log('🔄 Using client-side search as fallback');
    
    try {
        // 获取所有事件
        const response = await fetch('http://localhost:3000/api/events');
        if (!response.ok) {
            throw new Error(`Failed to fetch events: ${response.status}`);
        }
        
        const data = await response.json();
        const allEvents = data.data || data || [];
        
        console.log('📊 Total events for client-side filtering:', allEvents.length);
        
        // 在客户端进行筛选
        let filteredEvents = allEvents.filter(event => {
            let matches = true;
            
            // 日期筛选
            if (filters.date) {
                const eventDate = new Date(event.date_time).toISOString().split('T')[0];
                matches = matches && (eventDate === filters.date);
            }
            
            // 地点筛选
            if (filters.location) {
                const searchLocation = filters.location.toLowerCase();
                const eventLocation = event.location.toLowerCase();
                const eventName = event.name.toLowerCase();
                matches = matches && (
                    eventLocation.includes(searchLocation) || 
                    eventName.includes(searchLocation)
                );
            }
            
            // 分类筛选
            if (filters.category) {
                matches = matches && (event.category_id == filters.category);
            }
            
            return matches;
        });
        
        console.log('✅ Client-side filtered events:', filteredEvents.length);
        displaySearchResults(filteredEvents, filters);
        
    } catch (error) {
        throw new Error(`Client-side search failed: ${error.message}`);
    }
}

// 清除筛选器
function clearFilters() {
    document.getElementById('search-form').reset();
    document.getElementById('search-results').classList.add('hidden');
    document.getElementById('results-summary').textContent = '';
    document.getElementById('no-results').classList.add('hidden');
    document.getElementById('search-error').classList.add('hidden');
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Search page loaded');
    
    // 加载分类数据
    loadCategories();
    
    // 设置事件监听器
    const searchForm = document.getElementById('search-form');
    const clearButton = document.getElementById('clear-filters');
    const retryButton = document.getElementById('search-retry');
    const resetButton = document.getElementById('reset-search');
    
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const filters = {
                date: document.getElementById('date-filter').value,
                location: document.getElementById('location-filter').value,
                category: document.getElementById('category-filter').value
            };
            
            performSearch(filters);
        });
    }
    
    if (clearButton) {
        clearButton.addEventListener('click', clearFilters);
    }
    
    if (retryButton) {
        retryButton.addEventListener('click', function() {
            const filters = {
                date: document.getElementById('date-filter').value,
                location: document.getElementById('location-filter').value,
                category: document.getElementById('category-filter').value
            };
            performSearch(filters);
        });
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', clearFilters);
    }
});

// 在文件末尾添加以下代码，在DOMContentLoaded事件内部
class CustomDatePicker {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.modal = document.getElementById('date-picker-modal');
        this.dateInput = document.getElementById('date-filter');
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderCalendar();
    }

    bindEvents() {
        // 日期输入框点击事件
        this.dateInput.addEventListener('click', () => this.openModal());
        
        // 日期选择器切换按钮
        document.querySelector('.date-picker-toggle').addEventListener('click', () => this.openModal());
        
        // 模态框关闭事件
        document.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        document.querySelector('.modal-overlay').addEventListener('click', () => this.closeModal());
        
        // 月份导航
        document.querySelector('.prev-month').addEventListener('click', () => this.previousMonth());
        document.querySelector('.next-month').addEventListener('click', () => this.nextMonth());
        
        // 操作按钮
        document.getElementById('clear-date').addEventListener('click', () => this.clearDate());
        document.getElementById('today-date').addEventListener('click', () => this.selectToday());
        document.getElementById('confirm-date').addEventListener('click', () => this.confirmDate());
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    openModal() {
        this.modal.classList.remove('hidden');
        this.renderCalendar();
    }

    closeModal() {
        this.modal.classList.add('hidden');
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    selectToday() {
        const today = new Date();
        // 使用UTC日期
        this.selectedDate = new Date(Date.UTC(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        ));
        this.renderCalendar();
    }

    clearDate() {
        this.selectedDate = null;
        this.dateInput.value = '';
        this.renderCalendar();
    }

    confirmDate() {
        if (this.selectedDate) {
            // 使用UTC日期来格式化，避免时区转换
            const year = this.selectedDate.getUTCFullYear();
            const month = String(this.selectedDate.getUTCMonth() + 1).padStart(2, '0');
            const day = String(this.selectedDate.getUTCDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            
            this.dateInput.value = formattedDate;
        }
        this.closeModal();
    }

    selectDate(day) {
        // 使用UTC时间避免时区问题
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // 创建UTC日期对象
        this.selectedDate = new Date(Date.UTC(year, month, day));
        this.renderCalendar();
    }

    renderCalendar() {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        // 更新月份年份显示
        document.getElementById('current-month').textContent = monthNames[this.currentDate.getMonth()];
        document.getElementById('current-year').textContent = this.currentDate.getFullYear();

        const daysContainer = document.getElementById('date-picker-days');
        daysContainer.innerHTML = '';

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // 获取当月第一天和最后一天
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        // 获取当月第一天是星期几 (0 = Sunday, 6 = Saturday)
        const firstDayIndex = firstDay.getDay();

        // 添加上个月的日期
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            const dayElement = document.createElement('button');
            dayElement.className = 'date-picker-day other-month disabled';
            dayElement.textContent = prevMonthLastDay - i;
            dayElement.disabled = true;
            daysContainer.appendChild(dayElement);
        }

        // 添加当月的日期
        const today = new Date();
        const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('button');
            dayElement.className = 'date-picker-day';
            dayElement.textContent = day;

            // 使用UTC日期进行比较
            const currentDate = new Date(Date.UTC(year, month, day));
            
            // 检查是否是今天（使用UTC日期）
            if (currentDate.getTime() === todayUTC.getTime()) {
                dayElement.classList.add('today');
            }

            // 检查是否是选中的日期（使用UTC日期）
            if (this.selectedDate && currentDate.getTime() === this.selectedDate.getTime()) {
                dayElement.classList.add('selected');
            }

            // 所有日期都可以点击
            dayElement.addEventListener('click', () => this.selectDate(day));

            daysContainer.appendChild(dayElement);
        }

        // 添加下个月的日期以填满网格
        const totalCells = 42; // 6行 × 7天
        const remainingCells = totalCells - (firstDayIndex + daysInMonth);
        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = document.createElement('button');
            dayElement.className = 'date-picker-day other-month disabled';
            dayElement.textContent = day;
            dayElement.disabled = true;
            daysContainer.appendChild(dayElement);
        }
    }


}

// 在DOMContentLoaded事件中初始化日期选择器
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Search page loaded');
    
    // 加载分类数据
    loadCategories();
    
    // 初始化自定义日期选择器
    new CustomDatePicker();
    
    // ... 其他现有的事件监听器代码保持不变
    const searchForm = document.getElementById('search-form');
    const clearButton = document.getElementById('clear-filters');
    const retryButton = document.getElementById('search-retry');
    const resetButton = document.getElementById('reset-search');
    
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const filters = {
                date: document.getElementById('date-filter').value,
                location: document.getElementById('location-filter').value,
                category: document.getElementById('category-filter').value
            };
            
            performSearch(filters);
        });
    }
    
    if (clearButton) {
        clearButton.addEventListener('click', clearFilters);
    }
    
    if (retryButton) {
        retryButton.addEventListener('click', function() {
            const filters = {
                date: document.getElementById('date-filter').value,
                location: document.getElementById('location-filter').value,
                category: document.getElementById('category-filter').value
            };
            performSearch(filters);
        });
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', clearFilters);
    }
});