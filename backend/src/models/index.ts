import 'dotenv/config';
import { Sequelize } from 'sequelize-typescript';
import { User } from './User';
import { Worker } from './Worker';
import { Order } from './Order';
import { Member } from './Member';
import { Recharge } from './Recharge';
import { CommissionRule } from './CommissionRule';
import { Role } from './Role';
import { UserRoleModel } from './UserRole';
import { WorkerSettlement } from './WorkerSettlement';
import { Review } from './Review';

// 数据库配置
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || '192.168.50.17',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'payboard',
  logging: (sql: string, timing?: number) => {
    // 仅在开发环境输出更详细的SQL日志
    if (process.env.NODE_ENV === 'development') {
      if (typeof timing === 'number') {
        const isSlow = timing >= 500; // 500ms 视为慢查询
        const prefix = isSlow ? '🐢 SLOW SQL' : 'SQL';
        console.log(`[${new Date().toISOString()}] ${prefix} (${timing}ms): ${sql}`);
      } else {
        console.log(`[${new Date().toISOString()}] SQL: ${sql}`);
      }
    }
  },
  benchmark: true,
  timezone: '+08:00',
  dialectOptions: {
    // 处理无效日期值
    dateStrings: true,
    typeCast: true,
    // 设置 MySQL 模式
    sql_mode: 'ALLOW_INVALID_DATES',
    // TiDB / 云端 MySQL 需要 TLS 时开启
    ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {})
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  }
});

// 添加模型
sequelize.addModels([
  User,
  Worker,
  Order,
  Member,
  Recharge,
  CommissionRule,
  Role,
  UserRoleModel,
  WorkerSettlement,
  Review
]);

// 初始化模型
export async function initializeModels() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 同步模型到数据库 - 使用 force: false 避免删除现有数据
    await sequelize.sync({ force: false, alter: false });
    console.log('数据库模型同步完成');
  } catch (error) {
    console.error('数据库连接或同步失败:', error);
    throw error;
  }
}

// 导出模型实例
export const models = {
  User,
  Worker,
  Order,
  Member,
  Recharge,
  CommissionRule,
  Role,
  UserRoleModel,
  WorkerSettlement,
  Review
};

// 导出单个模型
export { User, Worker, Order, Member, Recharge, CommissionRule, Role, UserRoleModel, WorkerSettlement };

// 导出类型
export type ModelType = typeof models;
export type ModelInstance = InstanceType<ModelType[keyof ModelType]>;

// 导出枚举
export { UserRole, UserStatus } from './User';
export { RoleStatus } from './Role';
export { SettlementStatus, SettlementType } from './WorkerSettlement';
export { MemberStatus } from './Member';
export { RechargeMethod } from './Recharge';
export { CommissionRuleType, CommissionRuleStatus } from './CommissionRule';
export { WorkerType, WorkerStatus } from './Worker';
export { PayMethod, OrderStatus } from './Order';

export default sequelize;