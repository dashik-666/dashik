const { Sequelize } = require('sequelize');

async function checkDatabaseStructure() {
  const sequelize = new Sequelize({
    database: 'payboard',
    username: 'root',
    password: '123456',
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',
    timezone: '+08:00',
    logging: false
  });

  try {
    console.log('检查数据库结构...');

    // 检查 workers 表的所有字段
    const [columns] = await sequelize.query('SHOW COLUMNS FROM workers');
    console.log('Workers 表字段:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // 检查是否有 level 字段
    const levelColumn = columns.find(col => col.Field === 'level');
    if (!levelColumn) {
      console.log('\n⚠️ level 字段不存在，正在添加...');
      await sequelize.query(`
        ALTER TABLE workers 
        ADD COLUMN level VARCHAR(20) DEFAULT 'A' COMMENT '打手级别：A、S、SSR、魔王'
      `);
      console.log('✅ level 字段添加成功');
    } else {
      console.log('\n✅ level 字段已存在');
    }

    // 检查是否有 skills 字段
    const skillsColumn = columns.find(col => col.Field === 'skills');
    if (!skillsColumn) {
      console.log('\n⚠️ skills 字段不存在，正在添加...');
      await sequelize.query(`
        ALTER TABLE workers 
        ADD COLUMN skills JSON DEFAULT '[]' COMMENT '技能标签数组'
      `);
      console.log('✅ skills 字段添加成功');
    } else {
      console.log('\n✅ skills 字段已存在');
    }

    // 更新现有数据
    console.log('\n更新现有数据...');
    await sequelize.query('UPDATE workers SET level = "A" WHERE level IS NULL');
    await sequelize.query('UPDATE workers SET skills = "[]" WHERE skills IS NULL');

    // 验证数据
    const [workers] = await sequelize.query('SELECT id, name, level, skills FROM workers LIMIT 3');
    console.log('\n示例数据:');
    workers.forEach(worker => {
      console.log(`- ID: ${worker.id}, 姓名: ${worker.name}, 级别: ${worker.level}, 技能: ${worker.skills}`);
    });

  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    await sequelize.close();
  }
}

checkDatabaseStructure();
