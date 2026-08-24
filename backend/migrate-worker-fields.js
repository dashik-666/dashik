const mysql = require('mysql2/promise');

async function migrateWorkerFields() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'daodao'
  });

  try {
    console.log('开始执行数据库迁移...');

    // 检查字段是否已存在
    const [columns] = await connection.execute('SHOW COLUMNS FROM workers LIKE "level"');
    if (columns.length === 0) {
      console.log('添加 level 字段...');
      await connection.execute(`
        ALTER TABLE workers 
        ADD COLUMN level VARCHAR(20) DEFAULT 'A' COMMENT '打手级别：A、S、SSR、魔王'
      `);
    } else {
      console.log('level 字段已存在');
    }

    const [skillsColumns] = await connection.execute('SHOW COLUMNS FROM workers LIKE "skills"');
    if (skillsColumns.length === 0) {
      console.log('添加 skills 字段...');
      await connection.execute(`
        ALTER TABLE workers 
        ADD COLUMN skills JSON DEFAULT '[]' COMMENT '技能标签数组'
      `);
    } else {
      console.log('skills 字段已存在');
    }

    // 更新现有数据
    console.log('更新现有数据...');
    await connection.execute('UPDATE workers SET level = "A" WHERE level IS NULL');
    await connection.execute('UPDATE workers SET skills = "[]" WHERE skills IS NULL');

    // 验证结果
    const [result] = await connection.execute('SELECT id, name, level, skills FROM workers LIMIT 5');
    console.log('迁移完成！示例数据:', result);

  } catch (error) {
    console.error('迁移失败:', error);
  } finally {
    await connection.end();
  }
}

migrateWorkerFields();
