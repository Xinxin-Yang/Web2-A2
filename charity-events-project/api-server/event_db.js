const mysql = require('mysql2');
require('dotenv').config();

// 创建数据库连接
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'yxx860818.', // 这里需要你的MySQL密码
    database: process.env.DB_NAME || 'charityevents_db',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4'
});

// 连接数据库
connection.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed: ' + err.stack);
        return;
    }
    console.log('✅ Connected to database as id ' + connection.threadId);
});

// 使用promise接口
const db = connection.promise();

module.exports = connection;