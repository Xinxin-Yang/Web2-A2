-- 删除现有数据库（如果存在）
DROP DATABASE IF EXISTS charityevents_db;

-- 创建数据库，明确指定字符集
CREATE DATABASE charityevents_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 选择数据库
USE charityevents_db;

-- 删除现有表格
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS categories;

-- 创建分类表，指定字符集
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建活动表，指定字符集
CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    short_description VARCHAR(500),
    full_description TEXT,
    date_time DATETIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    address TEXT,
    category_id INT NOT NULL,
    ticket_price DECIMAL(10,2) DEFAULT 0.00,
    ticket_type ENUM('free', 'paid') DEFAULT 'free',
    goal_amount DECIMAL(10,2) DEFAULT 0.00,
    current_amount DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    max_attendees INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建索引
CREATE INDEX idx_events_date ON events(date_time);
CREATE INDEX idx_events_location ON events(location);
CREATE INDEX idx_events_category ON events(category_id);
CREATE INDEX idx_events_active ON events(is_active);
CREATE INDEX idx_events_date_active ON events(date_time, is_active);