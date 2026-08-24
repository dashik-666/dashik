const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectTimeout: 10000
  };

  console.log('尝试连接数据库...');
  console.log('配置:', {
    host: config.host,
    port: config.port,
    user: config.user,
    password: '***'
  });

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ 数据库连接成功!');
    
    // 测试创建数据库
    await connection.execute('CREATE DATABASE IF NOT EXISTS `payboard` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('✅ 数据库创建成功!');
    
    await connection.end();
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.error('错误代码:', error.code);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n可能的解决方案:');
      console.log('1. 检查用户名和密码是否正确');
      console.log('2. 确保MySQL用户有远程连接权限');
      console.log('3. 检查MySQL服务器是否允许从当前IP连接');
    }
  }
}

testConnection();