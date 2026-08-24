import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, BelongsToMany } from 'sequelize-typescript';
import bcrypt from 'bcryptjs';
import { Role } from './Role';
import { UserRoleModel } from './UserRole';

export enum UserRole {
  ROOT = 'ROOT',
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum UserStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled'
}

@Table({
  tableName: 'users',
  timestamps: true,
  underscored: true
})
export class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
    comment: '用户名'
  })
  username!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    comment: '密码哈希'
  })
  password!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '显示名称'
  })
  display_name!: string;

  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
    allowNull: false,
    defaultValue: UserRole.USER,
    comment: '角色'
  })
  role!: UserRole;

  @Column({
    type: DataType.ENUM(...Object.values(UserStatus)),
    allowNull: false,
    defaultValue: UserStatus.ACTIVE,
    comment: '状态'
  })
  status!: UserStatus;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '最后登录时间'
  })
  last_login_at?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    comment: '创建时间'
  })
  created_at!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    comment: '更新时间'
  })
  updated_at!: Date;

  // 关联关系
  @BelongsToMany(() => Role, () => UserRoleModel)
  roles!: Role[];

  // 实例方法：验证密码
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  // 实例方法：设置密码
  async setPassword(password: string): Promise<void> {
    const saltRounds = 10;
    this.password = await bcrypt.hash(password, saltRounds);
  }

  // 实例方法：更新最后登录时间
  async updateLastLogin(): Promise<void> {
    this.last_login_at = new Date();
    await this.save();
  }

  // 实例方法：检查是否为管理员
  isAdmin(): boolean {
    return this.role === UserRole.ROOT || this.role === UserRole.ADMIN;
  }

  // 实例方法：检查是否可用
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  // 静态方法：获取角色的中文描述
  static getRoleText(role: UserRole): string {
    const roleMap = {
      [UserRole.ROOT]: '超级管理员',
      [UserRole.ADMIN]: '管理员',
      [UserRole.USER]: '普通用户'
    };
    return roleMap[role] || role;
  }

  // 静态方法：获取状态的中文描述
  static getStatusText(status: UserStatus): string {
    const statusMap = {
      [UserStatus.ACTIVE]: '正常',
      [UserStatus.DISABLED]: '禁用'
    };
    return statusMap[status] || status;
  }

  // 序列化时排除密码字段
  toJSON(): any {
    const values = { ...this.get() };
    delete values.password;
    return values;
  }
}