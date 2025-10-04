// 首页专用脚本

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

// 获取事件类型对应的CSS类
function getEventTypeClass(categoryName) {
    const typeMap = {
        'Fun Run': 'run',
        'Gala Dinner': 'gala', 
        'Silent Auction': 'auction',
        'Concert': 'concert',
        'Workshop': 'workshop',
        'Sports Tournament': 'sports'
    };
    return typeMap[categoryName] || 'run';
}

// 获取事件类型对应的图标文本
function getEventIcon(categoryName) {
    const iconMap = {
        'Fun Run': '🏃',
        'Gala Dinner': '🍽️',
        'Silent Auction': '🎨',
        'Concert': '🎵',
        'Workshop': '🔧',
        'Sports Tournament': '⚽'
    };
    return iconMap[categoryName] || '📅';
}

// 显示活动数据
function displayEvents(events) {
    console.log('🎨 Displaying events:', events);
    
    const container = document.getElementById('events-container');
    const loading = document.getElementById('loading-state');
    const error = document.getElementById('error-state');
    const empty = document.getElementById('empty-state');
    
    // 隐藏其他状态
    if (loading) loading.classList.add('hidden');
    if (error) error.classList.add('hidden');
    if (empty) empty.classList.add('hidden');
    
    // 显示容器
    if (container) {
        container.classList.remove('hidden');
        
        // 生成活动卡片HTML
        const eventsHTML = events.map(event => {
            const eventType = getEventTypeClass(event.category_name);
            const eventIcon = getEventIcon(event.category_name);
            
            return `
                <div class="event-card">
                    <div class="event-image ${eventType}" aria-label="${event.category_name} event">
                        <div style="font-size: 48px; margin-bottom: 8px;">${eventIcon}</div>
                        <div>${escapeHtml(event.category_name)}</div>
                    </div>
                    <div class="event-card-content">
                        <div class="event-card-header">
                            <span class="event-category ${eventType}">${escapeHtml(event.category_name || 'Uncategorized')}</span>
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
                </div>
            `;
        }).join('');
        
        container.innerHTML = eventsHTML;
    }
}

function showNoEvents() {
    const loading = document.getElementById('loading-state');
    const empty = document.getElementById('empty-state');
    
    if (loading) loading.classList.add('hidden');
    if (empty) empty.classList.remove('hidden');
}

function showConnectionError() {
    const loading = document.getElementById('loading-state');
    const error = document.getElementById('error-state');
    
    if (loading) loading.classList.add('hidden');
    if (error) error.classList.remove('hidden');
}

// 重试加载函数
function retryLoading() {
    console.log('🔄 Retrying...');
    loadEvents();
}

// 主要加载函数
async function loadEvents() {
    console.log('🚀 Loading events from API...');
    
    try {
        const response = await fetch('http://localhost:3000/api/events');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ API response:', data);
        
        if (data.success && data.data && data.data.length > 0) {
            displayEvents(data.data);
        } else {
            showNoEvents();
        }
        
    } catch (error) {
        console.error('❌ Failed to load events:', error);
        showConnectionError();
    }
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 Home page loaded - starting event loading...');
    loadEvents();
});
    