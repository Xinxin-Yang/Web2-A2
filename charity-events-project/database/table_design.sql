-- 分类表 - categories
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    -- 分类名称，唯一且不能为空
    name VARCHAR(100) NOT NULL UNIQUE,
    -- 分类描述，可以为空
    description TEXT,
    -- 自动记录创建时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- 最后更新时间  
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 活动表 - events (核心表)
CREATE TABLE events (
    -- 主键，自动递增
    id INT PRIMARY KEY AUTO_INCREMENT,
    
    -- 活动基本信息
    name VARCHAR(255) NOT NULL,
    short_description VARCHAR(500),
    full_description TEXT,
    
    -- 时间地点信息
    date_time DATETIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    address TEXT,
    
    -- 分类关系
    category_id INT NOT NULL,
    
    -- 票务信息
    ticket_price DECIMAL(10,2) DEFAULT 0.00,
    ticket_type ENUM('free', 'paid') DEFAULT 'free',
    
    -- 筹款信息
    goal_amount DECIMAL(10,2) DEFAULT 0.00,
    current_amount DECIMAL(10,2) DEFAULT 0.00,
    
    -- 状态管理
    is_active BOOLEAN DEFAULT TRUE,
    max_attendees INT,
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 外键约束
    FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);