/**
 * 导航管理类
 * 处理网站导航、路由、面包屑和移动端菜单
 * 遵循可访问性最佳实践和性能优化
 */
class NavigationManager {
    /**
     * 构造函数 - 初始化导航管理器
     */
    constructor() {
        // 导航配置
        this.config = {
            // 导航项定义
            navItems: [
                {
                    id: 'home',
                    label: 'Home',
                    href: 'index.html',
                    icon: '🏠',
                    description: 'Go to homepage',
                    requiresAuth: false
                },
                {
                    id: 'search',
                    label: 'Search Events',
                    href: 'search.html', 
                    icon: '🔍',
                    description: 'Search for charity events',
                    requiresAuth: false
                }
            ],
            
            // 响应式断点
            breakpoints: {
                mobile: 768,
                tablet: 1024,
                desktop: 1200
            },
            
            // 动画配置
            animations: {
                menuSlide: 300,
                fadeIn: 200
            },
            
            // 可访问性配置
            accessibility: {
                skipLinkText: 'Skip to main content',
                mobileMenuLabel: 'Main menu',
                closeMenuText: 'Close menu'
            }
        };
        
        // 状态管理
        this.state = {
            isMobileMenuOpen: false,
            currentPage: this._getCurrentPage(),
            previousPage: null,
            scrollPosition: 0,
            isScrolled: false
        };
        
        // DOM元素引用
        this.elements = {
            navbar: null,
            navContainer: null,
            navMenu: null,
            mobileMenuButton: null,
            skipLink: null
        };
        
        // 事件监听器引用（用于清理）
        this.eventListeners = [];
        
        console.log('🧭 NavigationManager initialized', { 
            currentPage: this.state.currentPage,
            navItems: this.config.navItems.length
        });
    }

    /**
     * 初始化导航系统
     */
    async init() {
        try {
            console.log('🚀 Initializing navigation system...');
            
            // 等待DOM加载完成
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this._initialize());
            } else {
                this._initialize();
            }
        } catch (error) {
            console.error('❌ Failed to initialize navigation:', error);
            ErrorHandler.handleApiError(error, 'navigation initialization');
        }
    }

    /**
     * 内部初始化方法
     */
    _initialize() {
        this._cacheElements();
        this._createSkipLink();
        this._renderNavigation();
        this._setupEventListeners();
        this._setupScrollEffects();
        this._setupPageTransitions();
        
        console.log('✅ Navigation system initialized successfully');
        
        // 触发自定义事件通知其他组件
        this._dispatchEvent('navigation:ready', {
            currentPage: this.state.currentPage,
            navItems: this.config.navItems
        });
    }

    /**
     * 缓存DOM元素引用
     */
    _cacheElements() {
        this.elements = {
            navbar: DOMUtils.getElement('.navbar'),
            navContainer: DOMUtils.getElement('.nav-container'),
            navMenu: DOMUtils.getElement('.nav-menu'),
            mobileMenuButton: DOMUtils.createElement('button', {
                'class': 'mobile-menu-button',
                'aria-label': 'Toggle mobile menu',
                'aria-expanded': 'false',
                'aria-controls': 'nav-menu'
            })
        };

        // 如果导航元素不存在，创建基本结构
        if (!this.elements.navbar) {
            this._createBasicNavigation();
        }
    }

    /**
     * 创建基本导航结构（备用方案）
     */
    _createBasicNavigation() {
        console.warn('⚠️ Navigation elements not found, creating basic structure');
        
        this.elements.navbar = DOMUtils.createElement('nav', {
            'class': 'navbar',
            'role': 'navigation',
            'aria-label': 'Main navigation'
        });
        
        this.elements.navContainer = DOMUtils.createElement('div', {
            'class': 'nav-container'
        });
        
        this.elements.navMenu = DOMUtils.createElement('ul', {
            'class': 'nav-menu',
            'id': 'nav-menu',
            'role': 'menubar'
        });
        
        this.elements.navbar.appendChild(this.elements.navContainer);
        this.elements.navContainer.appendChild(this.elements.navMenu);
        
        // 插入到页面开始位置
        const body = document.body;
        const firstChild = body.firstChild;
        body.insertBefore(this.elements.navbar, firstChild);
    }

    /**
     * 创建跳过链接（可访问性功能）
     */
    _createSkipLink() {
        this.elements.skipLink = DOMUtils.createElement('a', {
            'href': '#main-content',
            'class': 'skip-link sr-only',
            'aria-label': this.config.accessibility.skipLinkText
        }, this.config.accessibility.skipLinkText);
        
        document.body.insertBefore(this.elements.skipLink, document.body.firstChild);
    }

    /**
     * 渲染导航菜单
     */
    _renderNavigation() {
        if (!this.elements.navMenu) {
            console.error('❌ Navigation menu element not found');
            return;
        }

        // 清空现有内容
        DOMUtils.setHTML(this.elements.navMenu, '');

        // 创建Logo/品牌区域
        this._renderBrand();

        // 创建导航项
        this._renderNavItems();

        // 创建移动端菜单按钮
        this._renderMobileMenuButton();

        console.log('🎨 Navigation menu rendered', {
            items: this.config.navItems.length,
            currentPage: this.state.currentPage
        });
    }

    /**
     * 渲染品牌/Logo区域
     */
    _renderBrand() {
        const brandLink = DOMUtils.createElement('a', {
            'href': 'index.html',
            'class': 'nav-logo',
            'aria-label': 'CharityEvents Home'
        });
        
        const logoIcon = DOMUtils.createElement('span', {
            'class': 'logo-icon',
            'aria-hidden': 'true'
        }, '❤️');
        
        const logoText = DOMUtils.createElement('span', {
            'class': 'logo-text'
        }, 'CharityEvents');
        
        brandLink.appendChild(logoIcon);
        brandLink.appendChild(logoText);
        
        // 插入到导航容器开始位置
        this.elements.navContainer.insertBefore(brandLink, this.elements.navContainer.firstChild);
    }

    /**
     * 渲染导航项
     */
    _renderNavItems() {
        this.config.navItems.forEach(navItem => {
            const listItem = DOMUtils.createElement('li', {
                'class': 'nav-item',
                'role': 'none'
            });
            
            const link = DOMUtils.createElement('a', {
                'href': navItem.href,
                'class': 'nav-link',
                'role': 'menuitem',
                'aria-describedby': `nav-desc-${navItem.id}`,
                'data-nav-id': navItem.id
            });
            
            // 添加图标（如果存在）
            if (navItem.icon) {
                const icon = DOMUtils.createElement('span', {
                    'class': 'nav-icon',
                    'aria-hidden': 'true'
                }, navItem.icon);
                link.appendChild(icon);
            }
            
            // 添加文本
            const text = DOMUtils.createElement('span', {
                'class': 'nav-text'
            }, navItem.label);
            link.appendChild(text);
            
            // 设置当前页面状态
            if (this.state.currentPage === navItem.id) {
                link.setAttribute('aria-current', 'page');
                DOMUtils.addClass(link, 'active');
            }
            
            // 添加描述（可访问性）
            const description = DOMUtils.createElement('span', {
                'id': `nav-desc-${navItem.id}`,
                'class': 'sr-only'
            }, navItem.description);
            
            link.appendChild(description);
            listItem.appendChild(link);
            this.elements.navMenu.appendChild(listItem);
        });
    }

    /**
     * 渲染移动端菜单按钮
     */
    _renderMobileMenuButton() {
        const button = DOMUtils.createElement('button', {
            'class': 'mobile-menu-button hidden',
            'aria-label': this.config.accessibility.mobileMenuLabel,
            'aria-expanded': 'false',
            'aria-controls': 'nav-menu',
            'data-mobile-menu-toggle': 'true'
        });
        
        // 汉堡菜单图标
        const icon = DOMUtils.createElement('span', {
            'class': 'mobile-menu-icon',
            'aria-hidden': 'true'
        }, '☰');
        
        button.appendChild(icon);
        this.elements.navContainer.appendChild(button);
        
        this.elements.mobileMenuButton = button;
    }

    /**
     * 设置事件监听器
     */
    _setupEventListeners() {
        this._cleanupEventListeners();
        
        // 窗口大小变化监听
        const resizeHandler = Utils.debounce(() => this._handleResize(), 250);
        this._addEventListener(window, 'resize', resizeHandler);
        
        // 移动端菜单切换
        if (this.elements.mobileMenuButton) {
            this._addEventListener(this.elements.mobileMenuButton, 'click', 
                () => this._toggleMobileMenu());
        }
        
        // 跳过链接功能
        if (this.elements.skipLink) {
            this._addEventListener(this.elements.skipLink, 'click', 
                (e) => this._handleSkipLink(e));
        }
        
        // 导航链接点击处理
        this._addEventListener(this.elements.navMenu, 'click', 
            (e) => this._handleNavClick(e));
        
        // 键盘导航支持
        this._addEventListener(this.elements.navMenu, 'keydown', 
            (e) => this._handleNavKeydown(e));
        
        // 点击外部关闭移动菜单
        this._addEventListener(document, 'click', 
            (e) => this._handleDocumentClick(e));
        
        console.log('🎯 Navigation event listeners setup complete');
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
     * 添加事件监听器（带清理跟踪）
     */
    _addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.eventListeners.push({ element, event, handler });
    }

    /**
     * 处理窗口大小变化
     */
    _handleResize() {
        const width = window.innerWidth;
        const isMobile = width < this.config.breakpoints.mobile;
        
        // 显示/隐藏移动菜单按钮
        if (this.elements.mobileMenuButton) {
            if (isMobile) {
                DOMUtils.showElement(this.elements.mobileMenuButton);
            } else {
                DOMUtils.hideElement(this.elements.mobileMenuButton);
                // 在桌面端确保菜单是打开的
                this._closeMobileMenu();
            }
        }
        
        // 触发自定义事件
        this._dispatchEvent('navigation:resize', { width, isMobile });
    }

    /**
     * 切换移动端菜单
     */
    _toggleMobileMenu() {
        if (this.state.isMobileMenuOpen) {
            this._closeMobileMenu();
        } else {
            this._openMobileMenu();
        }
    }

    /**
     * 打开移动端菜单
     */
    _openMobileMenu() {
        this.state.isMobileMenuOpen = true;
        this.state.scrollPosition = window.pageYOffset;
        
        // 更新按钮状态
        if (this.elements.mobileMenuButton) {
            this.elements.mobileMenuButton.setAttribute('aria-expanded', 'true');
            this.elements.mobileMenuButton.setAttribute('aria-label', 
                this.config.accessibility.closeMenuText);
        }
        
        // 显示菜单
        DOMUtils.showElement(this.elements.navMenu);
        DOMUtils.addClass(this.elements.navMenu, 'mobile-open');
        DOMUtils.addClass(document.body, 'mobile-menu-open');
        
        // 防止背景滚动
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.top = `-${this.state.scrollPosition}px`;
        
        console.log('📱 Mobile menu opened');
        this._dispatchEvent('navigation:mobileMenuOpen');
    }

    /**
     * 关闭移动端菜单
     */
    _closeMobileMenu() {
        this.state.isMobileMenuOpen = false;
        
        // 更新按钮状态
        if (this.elements.mobileMenuButton) {
            this.elements.mobileMenuButton.setAttribute('aria-expanded', 'false');
            this.elements.mobileMenuButton.setAttribute('aria-label', 
                this.config.accessibility.mobileMenuLabel);
        }
        
        // 隐藏菜单
        DOMUtils.removeClass(this.elements.navMenu, 'mobile-open');
        DOMUtils.removeClass(document.body, 'mobile-menu-open');
        
        // 恢复背景滚动
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        
        // 恢复滚动位置
        window.scrollTo(0, this.state.scrollPosition);
        
        console.log('📱 Mobile menu closed');
        this._dispatchEvent('navigation:mobileMenuClose');
    }

    /**
     * 处理跳过链接点击
     */
    _handleSkipLink(event) {
        event.preventDefault();
        
        const mainContent = DOMUtils.getElement('main, [role="main"], .main-content');
        if (mainContent) {
            mainContent.setAttribute('tabindex', '-1');
            mainContent.focus();
            
            // 移除tabindex以避免干扰正常导航
            setTimeout(() => {
                mainContent.removeAttribute('tabindex');
            }, 1000);
        }
        
        console.log('🎯 Skip link activated');
    }

    /**
     * 处理导航链接点击
     */
    _handleNavClick(event) {
        const link = event.target.closest('.nav-link');
        if (!link) return;
        
        const navId = link.getAttribute('data-nav-id');
        const navItem = this.config.navItems.find(item => item.id === navId);
        
        if (navItem) {
            console.log('🧭 Navigation click:', navItem.label);
            
            // 触发自定义事件
            this._dispatchEvent('navigation:click', {
                navItem,
                event
            });
            
            // 如果是移动端，点击后关闭菜单
            if (this.state.isMobileMenuOpen) {
                this._closeMobileMenu();
            }
        }
    }

    /**
     * 处理导航键盘事件
     */
    _handleNavKeydown(event) {
        const link = event.target.closest('.nav-link');
        if (!link) return;
        
        switch (event.key) {
            case 'Enter':
            case ' ':
                event.preventDefault();
                link.click();
                break;
                
            case 'ArrowDown':
            case 'ArrowRight':
                event.preventDefault();
                this._focusNextNavItem(link);
                break;
                
            case 'ArrowUp':
            case 'ArrowLeft':
                event.preventDefault();
                this._focusPreviousNavItem(link);
                break;
                
            case 'Home':
                event.preventDefault();
                this._focusFirstNavItem();
                break;
                
            case 'End':
                event.preventDefault();
                this._focusLastNavItem();
                break;
                
            case 'Escape':
                if (this.state.isMobileMenuOpen) {
                    event.preventDefault();
                    this._closeMobileMenu();
                    this.elements.mobileMenuButton?.focus();
                }
                break;
        }
    }

    /**
     * 聚焦下一个导航项
     */
    _focusNextNavItem(currentLink) {
        const links = Array.from(this.elements.navMenu.querySelectorAll('.nav-link'));
        const currentIndex = links.indexOf(currentLink);
        const nextIndex = (currentIndex + 1) % links.length;
        links[nextIndex]?.focus();
    }

    /**
     * 聚焦上一个导航项
     */
    _focusPreviousNavItem(currentLink) {
        const links = Array.from(this.elements.navMenu.querySelectorAll('.nav-link'));
        const currentIndex = links.indexOf(currentLink);
        const previousIndex = (currentIndex - 1 + links.length) % links.length;
        links[previousIndex]?.focus();
    }

    /**
     * 聚焦第一个导航项
     */
    _focusFirstNavItem() {
        const firstLink = this.elements.navMenu.querySelector('.nav-link');
        firstLink?.focus();
    }

    /**
     * 聚焦最后一个导航项
     */
    _focusLastNavItem() {
        const links = this.elements.navMenu.querySelectorAll('.nav-link');
        const lastLink = links[links.length - 1];
        lastLink?.focus();
    }

    /**
     * 处理文档点击（关闭移动菜单）
     */
    _handleDocumentClick(event) {
        if (!this.state.isMobileMenuOpen) return;
        
        const isClickInsideNav = this.elements.navbar.contains(event.target);
        const isClickOnMenuButton = this.elements.mobileMenuButton?.contains(event.target);
        
        if (!isClickInsideNav && !isClickOnMenuButton) {
            this._closeMobileMenu();
        }
    }

    /**
     * 设置滚动效果
     */
    _setupScrollEffects() {
        const scrollHandler = Utils.throttle(() => this._handleScroll(), 100);
        this._addEventListener(window, 'scroll', scrollHandler);
        
        // 初始检查
        this._handleScroll();
    }

    /**
     * 处理滚动事件
     */
    _handleScroll() {
        const scrollY = window.pageYOffset;
        const isScrolled = scrollY > 50;
        
        if (isScrolled !== this.state.isScrolled) {
            this.state.isScrolled = isScrolled;
            
            if (this.elements.navbar) {
                if (isScrolled) {
                    DOMUtils.addClass(this.elements.navbar, 'scrolled');
                } else {
                    DOMUtils.removeClass(this.elements.navbar, 'scrolled');
                }
            }
            
            this._dispatchEvent('navigation:scroll', { scrollY, isScrolled });
        }
    }

    /**
     * 设置页面过渡效果
     */
    _setupPageTransitions() {
        // 监听所有内部链接点击
        this._addEventListener(document, 'click', (event) => {
            const link = event.target.closest('a');
            if (!link) return;
            
            const href = link.getAttribute('href');
            if (href && this._isInternalLink(href)) {
                this._handleInternalLinkClick(event, link, href);
            }
        });
    }

    /**
     * 处理内部链接点击
     */
    _handleInternalLinkClick(event, link, href) {
        // 可以在这里添加页面过渡动画
        console.log('🔗 Internal link clicked:', href);
        
        // 触发自定义事件
        this._dispatchEvent('navigation:internalLinkClick', {
            link,
            href,
            event
        });
    }

    /**
     * 判断是否为内部链接
     */
    _isInternalLink(href) {
        return href && (
            href.startsWith('/') || 
            href.startsWith('./') || 
            href.startsWith('../') ||
            href.includes(window.location.hostname) ||
            !href.includes('://')
        );
    }

    /**
     * 获取当前页面标识
     */
    _getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        
        // 映射文件名到页面ID
        const pageMap = {
            'index.html': 'home',
            'search.html': 'search',
            'event.html': 'event'
        };
        
        return pageMap[page] || 'home';
    }

    /**
     * 分发自定义事件
     */
    _dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail: {
                timestamp: new Date().toISOString(),
                source: 'NavigationManager',
                ...detail
            },
            bubbles: true,
            cancelable: true
        });
        
        document.dispatchEvent(event);
    }

    /**
     * 更新当前页面状态
     */
    updateCurrentPage() {
        const previousPage = this.state.currentPage;
        this.state.currentPage = this._getCurrentPage();
        this.state.previousPage = previousPage;
        
        // 更新导航项激活状态
        this._updateActiveStates();
        
        this._dispatchEvent('navigation:pageChange', {
            previousPage,
            currentPage: this.state.currentPage
        });
    }

    /**
     * 更新激活状态
     */
    _updateActiveStates() {
        const links = this.elements.navMenu?.querySelectorAll('.nav-link');
        if (!links) return;
        
        links.forEach(link => {
            const navId = link.getAttribute('data-nav-id');
            const isActive = navId === this.state.currentPage;
            
            if (isActive) {
                link.setAttribute('aria-current', 'page');
                DOMUtils.addClass(link, 'active');
            } else {
                link.removeAttribute('aria-current');
                DOMUtils.removeClass(link, 'active');
            }
        });
    }

    /**
     * 获取导航状态
     */
    getState() {
        return {
            ...this.state,
            config: { ...this.config }
        };
    }

    /**
     * 销毁实例（清理资源）
     */
    destroy() {
        this._cleanupEventListeners();
        this._closeMobileMenu();
        
        console.log('🧹 NavigationManager destroyed');
    }
}

// 添加移动端导航样式
const mobileNavStyles = `
/* 移动端导航样式 */
@media (max-width: 767px) {
    .mobile-menu-button {
        display: flex !important;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        background: none;
        border: 2px solid var(--gray-300);
        border-radius: var(--radius-md);
        color: var(--gray-700);
        cursor: pointer;
        transition: all var(--transition-fast);
    }
    
    .mobile-menu-button:hover {
        border-color: var(--primary-light);
        color: var(--primary-color);
    }
    
    .mobile-menu-button[aria-expanded="true"] {
        background: var(--primary-light);
        border-color: var(--primary-light);
        color: white;
    }
    
    .mobile-menu-icon {
        font-size: 1.25rem;
        line-height: 1;
    }
    
    .nav-menu {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--white);
        box-shadow: var(--shadow-lg);
        flex-direction: column;
        padding: var(--space-4);
        display: none;
        z-index: var(--z-dropdown);
    }
    
    .nav-menu.mobile-open {
        display: flex;
        animation: slideDown 0.3s ease-out;
    }
    
    .nav-item {
        width: 100%;
    }
    
    .nav-link {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-md);
        width: 100%;
        text-align: left;
    }
    
    .nav-icon {
        font-size: 1.125rem;
        width: 20px;
        text-align: center;
    }
    
    body.mobile-menu-open {
        overflow: hidden;
    }
    
    .navbar.scrolled {
        box-shadow: var(--shadow-lg);
    }
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 跳过链接样式 */
.skip-link {
    position: absolute;
    top: -40px;
    left: 6px;
    background: var(--primary-color);
    color: white;
    padding: var(--space-2) var(--space-4);
    text-decoration: none;
    border-radius: var(--radius-md);
    z-index: var(--z-tooltip);
    transition: top 0.2s ease;
}

.skip-link:focus {
    top: 6px;
}

/* 导航滚动效果 */
.navbar {
    transition: all var(--transition-base);
    position: sticky;
    top: 0;
    z-index: var(--z-sticky);
}

.navbar.scrolled {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    box-shadow: var(--shadow-md);
}
`;

// 注入移动端样式
const styleElement = DOMUtils.createElement('style');
DOMUtils.setText(styleElement, mobileNavStyles);
document.head.appendChild(styleElement);

// 创建全局导航管理器实例
window.navigationManager = new NavigationManager();

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    window.navigationManager.init().catch(error => {
        console.error('❌ Failed to initialize navigation:', error);
    });
});

console.log('🧭 Navigation module loaded');