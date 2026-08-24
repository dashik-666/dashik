import { sequelize } from '../src/config/database';
import { Member } from '../src/models/Member';
import { Worker } from '../src/models/Worker';
import { Order } from '../src/models/Order';
import { Recharge } from '../src/models/Recharge';
import { User } from '../src/models/User';
import bcrypt from 'bcryptjs';

async function syncDatabase() {
  try {
    console.log('开始同步数据库...');
    
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 同步所有模型到数据库
    await sequelize.sync({ force: false, alter: true });
    console.log('数据库表结构同步完成');
    
    // 检查是否存在管理员用户
    const adminUser = await User.findOne({ where: { username: 'admin' } });
    if (!adminUser) {
      // 创建默认管理员用户
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        password: hashedPassword,
        display_name: '系统管理员',
        role: 'admin',
        status: 'active'
      });
      console.log('默认管理员用户创建成功 (用户名: admin, 密码: admin123)');
    } else {
      console.log('管理员用户已存在');
    }
    
    // 检查是否有测试数据
    const memberCount = await Member.count();
    if (memberCount === 0) {
      // 创建测试会员
      await Member.bulkCreate([
        {
          username: 'zhangsan',
          nickname: '张三',
          phone: '13800138001',
          balance: 500.0,
          total_recharge: 1000.0,
          total_consume: 500.0,
          status: 'active'
        },
        {
          username: 'lisi',
          nickname: '李四',
          phone: '13800138002',
          balance: 200.0,
          total_recharge: 500.0,
          total_consume: 300.0,
          status: 'active'
        },
        {
          username: 'wangwu',
          nickname: '王五',
          phone: '13800138003',
          balance: 0.0,
          total_recharge: 0.0,
          total_consume: 0.0,
          status: 'active'
        }
      ]);
      console.log('测试会员数据创建成功');
    }
    
    const workerCount = await Worker.count();
    if (workerCount === 0) {
      // 创建测试打手
      await Worker.bulkCreate([
        {
          name: '小明',
          real_name: '张小明',
          id_number: '110101199001011234',
          phone: '13900139001',
          wechat_id: 'xiaoming_wx',
          price_hour: 50.0,
          type: '跑刀',
          status: '在职'
        },
        {
          name: '小红',
          real_name: '李小红',
          id_number: '110101199002022345',
          phone: '13900139002',
          wechat_id: 'xiaohong_wx',
          price_hour: 45.0,
          type: '陪玩',
          status: '在职'
        },
        {
          name: '小刚',
          real_name: '王小刚',
          id_number: '110101199003033456',
          phone: '13900139003',
          wechat_id: 'xiaogang_wx',
          price_hour: 55.0,
          type: '陪练',
          status: '在职'
        }
      ]);
      console.log('测试打手数据创建成功');
    }
    
    console.log('数据库初始化完成！');
    
  } catch (error) {
    console.error('数据库同步失败:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  syncDatabase();
}

export { syncDatabase };