const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');

// 数据库配置
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: '192.168.50.17',
  port: 3306,
  username: 'root',
  password: '123456',
  database: 'payboard',
  logging: false,
  timezone: '+08:00'
});

async function initDatabase() {
  try {
    // 测试连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 创建用户表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`username\` varchar(50) NOT NULL COMMENT '用户名',
        \`password\` varchar(255) NOT NULL COMMENT '密码',
        \`display_name\` varchar(100) DEFAULT NULL COMMENT '显示名称',
        \`role\` varchar(50) NOT NULL DEFAULT 'USER' COMMENT '角色',
        \`status\` enum('active','disabled') NOT NULL DEFAULT 'active' COMMENT '状态',
        \`last_login_at\` datetime DEFAULT NULL COMMENT '最后登录时间',
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_username\` (\`username\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
    `);
    console.log('✅ 用户表创建成功');

    // 创建角色表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`roles\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`name\` varchar(50) NOT NULL COMMENT '角色名称',
        \`code\` varchar(50) NOT NULL COMMENT '角色编码',
        \`description\` varchar(255) DEFAULT NULL COMMENT '角色描述',
        \`status\` enum('active','disabled') NOT NULL DEFAULT 'active' COMMENT '状态',
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_code\` (\`code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';
    `);
    console.log('✅ 角色表创建成功');

    // 插入默认角色
    await sequelize.query(`
      INSERT IGNORE INTO \`roles\` (\`name\`, \`code\`, \`description\`, \`status\`) VALUES
      ('超级管理员', 'ROOT', '拥有所有权限的超级管理员', 'active'),
      ('管理员', 'ADMIN', '系统管理员', 'active'),
      ('普通用户', 'USER', '普通用户', 'active');
    `);
    console.log('✅ 默认角色插入成功');

    // 生成密码哈希
    const password = '123456';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('✅ 密码哈希生成成功:', hashedPassword);

    // 插入默认管理员用户
    await sequelize.query(`
      INSERT IGNORE INTO \`users\` (\`username\`, \`password\`, \`display_name\`, \`role\`, \`status\`) VALUES
      ('admin', ?, '系统管理员', 'ROOT', 'active');
    `, {
      replacements: [hashedPassword]
    });
    console.log('✅ 默认管理员用户创建成功');

    // 创建用户角色关联表
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`user_roles\` (
        \`user_id\` int(11) NOT NULL COMMENT '用户ID',
        \`role_id\` int(11) NOT NULL COMMENT '角色ID',
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`user_id\`, \`role_id\`),
        KEY \`idx_user_id\` (\`user_id\`),
        KEY \`idx_role_id\` (\`role_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';
    `);
    console.log('✅ 用户角色关联表创建成功');

    // 关联默认用户和角色
    await sequelize.query(`
      INSERT IGNORE INTO \`user_roles\` (\`user_id\`, \`role_id\`) 
      SELECT u.id, r.id 
      FROM \`users\` u, \`roles\` r 
      WHERE u.username = 'admin' AND r.code = 'ROOT';
    `);
    console.log('✅ 用户角色关联成功');

    // 显示结果
    const [users] = await sequelize.query('SELECT COUNT(*) as count FROM `users`');
    const [roles] = await sequelize.query('SELECT COUNT(*) as count FROM `roles`');
    const [userRoles] = await sequelize.query('SELECT COUNT(*) as count FROM `user_roles`');

    console.log('\n📊 数据库初始化完成:');
    console.log(`   用户数量: ${users[0].count}`);
    console.log(`   角色数量: ${roles[0].count}`);
    console.log(`   用户角色关联数量: ${userRoles[0].count}`);
    console.log('\n🔑 默认登录信息:');
    console.log('   用户名: admin');
    console.log('   密码: 123456');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 运行初始化
initDatabase();
