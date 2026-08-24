const { Sequelize } = require('sequelize');

async function migrateWorkerFields() {
  const sequelize = new Sequelize({
    database: 'daodao',
    username: 'root',
    password: '123456',
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',
    timezone: '+08:00',
    logging: console.log
  });

  try {
    console.log('开始执行数据库迁移...');

    // 测试连接
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 检查字段是否已存在
    const [levelResult] = await sequelize.query('SHOW COLUMNS FROM workers LIKE "level"');
    if (levelResult.length === 0) {
      console.log('添加 level 字段...');
      await sequelize.query(`
        ALTER TABLE workers 
        ADD COLUMN level VARCHAR(20) DEFAULT 'A' COMMENT '打手级别：A、S、SSR、魔王'
      `);
    } else {
      console.log('level 字段已存在');
    }

    const [skillsResult] = await sequelize.query('SHOW COLUMNS FROM workers LIKE "skills"');
    if (skillsResult.length === 0) {
      console.log('添加 skills 字段...');
      await sequelize.query(`
        ALTER TABLE workers 
        ADD COLUMN skills JSON DEFAULT '[]' COMMENT '技能标签数组'
      `);
    } else {
      console.log('skills 字段已存在');
    }

    // 更新现有数据
    console.log('更新现有数据...');
    await sequelize.query('UPDATE workers SET level = "A" WHERE level IS NULL');
    await sequelize.query('UPDATE workers SET skills = "[]" WHERE skills IS NULL');

    // 验证结果
    const [result] = await sequelize.query('SELECT id, name, level, skills FROM workers LIMIT 5');
    console.log('迁移完成！示例数据:', result);

  } catch (error) {
    console.error('迁移失败:', error);
  } finally {
    await sequelize.close();
  }
}

migrateWorkerFields();
