/**
 * 数据库配置模块
 * 集中管理数据库连接配置和连接池设置
 */

/*const mysql = require('mysql2');
require('dotenv').config();

class DatabaseConfig {
    constructor() {
        this.config = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'charityevents_db',
            port: process.env.DB_PORT || 3306,
            charset: 'utf8mb4',
            timezone: 'local',
            
            // 连接池配置
            pool: {
                max: 10,                    // 最大连接数
                min: 2,                     // 最小连接数
                acquireTimeout: 30000,      // 获取连接超时时间
                idleTimeout: 60000,         // 空闲连接超时时间
                reapInterval: 1000,         // 回收间隔
            },
            
            // 连接选项
            connection: {
                connectTimeout: 10000,      // 连接超时时间
                timeout: 60000,             // 查询超时时间
                stringifyObjects: false,    // 不字符串化对象
                typeCast: true,             // 类型转换
                dateStrings: true           // 日期作为字符串返回
            }
        };
        
        this.pool = null;
        this.connection = null;
    }


    createPool() {
        try {
            this.pool = mysql.createPool(this.config);
            
            // 创建promise接口
            const promisePool = this.pool.promise();
            
            console.log('✅ Database connection pool created successfully');
            return promisePool;
            
        } catch (error) {
            console.error('❌ Failed to create database connection pool:', error);
            throw error;
        }
    }


    createConnection() {
        try {
            this.connection = mysql.createConnection(this.config);
            
            // 创建promise接口
            const promiseConnection = this.connection.promise();
            
            console.log('✅ Database connection created successfully');
            return promiseConnection;
            
        } catch (error) {
            console.error('❌ Failed to create database connection:', error);
            throw error;
        }
    }


    async testConnection() {
        try {
            const connection = this.createConnection();
            const [rows] = await connection.execute('SELECT 1 as test');
            
            console.log('✅ Database connection test successful:', rows[0].test === 1);
            return true;
            
        } catch (error) {
            console.error('❌ Database connection test failed:', error);
            return false;
        }
    }


    async getDatabaseStatus() {
        try {
            const connection = this.createConnection();
            const [status] = await connection.execute(`
                SELECT 
                    @@version as version,
                    NOW() as server_time,
                    DATABASE() as database_name,
                    (SELECT COUNT(*) FROM events) as events_count,
                    (SELECT COUNT(*) FROM categories) as categories_count
            `);
            
            return {
                status: 'connected',
                ...status[0],
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                status: 'disconnected',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }


    async closePool() {
        if (this.pool) {
            await this.pool.end();
            console.log('✅ Database connection pool closed');
        }
    }


    async closeConnection() {
        if (this.connection) {
            await this.connection.end();
            console.log('✅ Database connection closed');
        }
    }
}

// 创建全局数据库配置实例
const databaseConfig = new DatabaseConfig();

module.exports = databaseConfig;*/
const mysql = require('mysql2');
require('dotenv').config();

class Database {
    constructor() {
        this.pool = null;
        this.init();
    }

    init() {
        try {
            this.pool = mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'charityevents_db',
                port: process.env.DB_PORT || 3306,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                acquireTimeout: 60000,
                timeout: 60000,
                reconnect: true
            });

            console.log('✅ Database pool created successfully');
            
            // 测试连接
            this.testConnection();
            
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    async testConnection() {
        try {
            const connection = await this.pool.promise().getConnection();
            console.log('✅ Database connection test successful');
            connection.release();
            return true;
        } catch (error) {
            console.error('❌ Database connection test failed:', error);
            return false;
        }
    }

    getPool() {
        return this.pool;
    }

    async closePool() {
        if (this.pool) {
            await this.pool.end();
            console.log('✅ Database pool closed');
        }
    }
}

module.exports = new Database();