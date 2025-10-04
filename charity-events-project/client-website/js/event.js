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
            weekday: 'long',
            year: 'numeric',
            month: 'long',
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

// 从URL获取事件ID
function getEventIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    
    console.log('🔗 Event ID from URL:', eventId);
    
    if (!eventId || isNaN(Number(eventId))) {
        console.error('❌ Invalid event ID:', eventId);
        return null;
    }
    
    return parseInt(eventId);
}

// 显示事件详情
function displayEventDetails(event) {
    console.log('🎨 Displaying event details:', event);
    
    const container = document.getElementById('event-details');
    const loading = document.getElementById('event-loading');
    const error = document.getElementById('event-error');
    
    // 隐藏其他状态
    if (loading) loading.classList.add('hidden');
    if (error) error.classList.add('hidden');
    
    // 显示详情容器
    if (container) {
        container.classList.remove('hidden');
        
        const formattedDate = formatDate(event.date_time);
        const formattedPrice = event.ticket_price > 0 ? formatCurrency(event.ticket_price) : 'Free';
        const progressPercentage = calculateProgress(event.current_amount, event.goal_amount);
        
        const eventHTML = `
            <article class="event-detail">
                <header class="event-header">
                    <h1 class="event-title">${escapeHtml(event.name)}</h1>
                    <span class="event-category-badge">${escapeHtml(event.category_name)}</span>
                </header>
                
                <div class="event-content">
                    <div class="event-meta-grid">
                        <div class="event-meta-item">
                            <span class="meta-label">📅 Date & Time</span>
                            <span class="meta-value">
                                <time datetime="${event.date_time}">${formattedDate}</time>
                            </span>
                        </div>
                        
                        <div class="event-meta-item">
                            <span class="meta-label">📍 Location</span>
                            <span class="meta-value">${escapeHtml(event.location)}</span>
                        </div>
                        
                        <div class="event-meta-item">
                            <span class="meta-label">🎫 Ticket Price</span>
                            <span class="meta-value">${formattedPrice}</span>
                        </div>
                        
                        ${event.max_attendees ? `
                        <div class="event-meta-item">
                            <span class="meta-label">👥 Capacity</span>
                            <span class="meta-value">${event.max_attendees} attendees</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="event-description">
                        <h2>About This Event</h2>
                        <p>${escapeHtml(event.full_description || event.short_description)}</p>
                        ${event.full_description && event.short_description && event.full_description !== event.short_description ? `
                        <p>${escapeHtml(event.short_description)}</p>
                        ` : ''}
                    </div>
                    
                    ${event.address ? `
                    <div class="event-venue">
                        <h3>Venue Details</h3>
                        <p>${escapeHtml(event.address)}</p>
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
                            <span>${formatCurrency(event.current_amount)} raised</span>
                            <span>${formatCurrency(event.goal_amount)} goal</span>
                            <span>${progressPercentage}%</span>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="event-actions">
                        <button id="register-button" class="btn btn-large">
                            🎫 Register for This Event
                        </button>
                    </div>
                </div>
            </article>
        `;
        
        container.innerHTML = eventHTML;
        
        // 设置注册按钮事件
        const registerButton = document.getElementById('register-button');
        if (registerButton) {
            registerButton.addEventListener('click', openModal);
        }
    }
}

function showEventError(message) {
    const loading = document.getElementById('event-loading');
    const error = document.getElementById('event-error');
    
    if (loading) loading.classList.add('hidden');
    if (error) {
        document.getElementById('event-error-message').textContent = message;
        error.classList.remove('hidden');
    }
}

// 加载事件详情
async function loadEventDetails(eventId) {
    console.log('📥 Loading event details for ID:', eventId);
    
    try {
        const response = await fetch(`http://localhost:3000/api/events/${eventId}`);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Event not found');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Event details:', data);
        
        if (data.success && data.data) {
            displayEventDetails(data.data);
        } else {
            throw new Error('Event data not available');
        }
        
    } catch (error) {
        console.error('❌ Failed to load event details:', error);
        showEventError(error.message);
    }
}

// 模态框功能
function setupModal() {
    const modal = document.getElementById('register-modal');
    const closeButtons = document.querySelectorAll('[data-close-modal]');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        });
    });
    
    // ESC键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });
}

function openModal() {
    const modal = document.getElementById('register-modal');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Event page loaded');
    
    // 设置模态框
    setupModal();
    
    // 获取事件ID并加载详情
    const eventId = getEventIdFromURL();
    if (eventId) {
        loadEventDetails(eventId);
    } else {
        showEventError('Invalid event ID provided in URL');
    }
});