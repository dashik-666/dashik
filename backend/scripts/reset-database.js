const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('正在删除现有表...');
    
    // 删除表（注意外键约束顺序）
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await connection.execute('DROP TABLE IF EXISTS orders');
    await connection.execute('DROP TABLE IF EXISTS recharges');
    await connection.execute('DROP TABLE IF EXISTS members');
    await connection.execute('DROP TABLE IF EXISTS workers');
    await connection.execute('DROP TABLE IF EXISTS users');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('现有表已删除');
    
    // 读取并执行初始化脚本
    const fs = require('fs');
    const path = require('path');
    const sqlScript = fs.readFileSync(path.join(__dirname, 'init-database.sql'), 'utf8');
    
    // 分割SQL语句并执行
    const statements = sqlScript.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }
    
    console.log('数据库重置完成！');
    
  } catch (error) {
    console.error('数据库重置失败:', error);
  } finally {
    await connection.end();
  }
}

resetDatabase();