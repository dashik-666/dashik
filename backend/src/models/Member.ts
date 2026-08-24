import { Table, Column, Model, DataType, HasMany, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { Recharge } from './Recharge';
import { Order } from './Order';

export enum MemberStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled'
}

@Table({
  tableName: 'members',
  timestamps: true,
  underscored: true
})
export class Member extends Model {
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
    type: DataType.STRING(50),
    allowNull: false,
    comment: '会员昵称'
  })
  nickname!: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    comment: '手机号'
  })
  phone?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: '登录密码（bcrypt，玩家端注册用户使用）'
  })
  password?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: '头像'
  })
  avatar?: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: '游戏ID'
  })
  game_id?: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '当前余额'
  })
  balance!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '累计充值金额'
  })
  total_recharge!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '累计消费金额'
  })
  total_consume!: number;

  @Column({
    type: DataType.ENUM(...Object.values(MemberStatus)),
    allowNull: false,
    defaultValue: MemberStatus.ACTIVE,
    comment: '状态'
  })
  status!: MemberStatus;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    comment: '注册时间'
  })
  created_at!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    comment: '最近更新时间'
  })
  updated_at!: Date;

  // 关联关系
  @HasMany(() => Recharge)
  recharges!: Recharge[];

  @HasMany(() => Order)
  orders!: Order[];

  // 实例方法
  async updateBalance(amount: number, isRecharge: boolean = true): Promise<void> {
    if (isRecharge) {
      this.balance = Number(this.balance) + Number(amount);
      this.total_recharge = Number(this.total_recharge) + Number(amount);
    } else {
      this.balance = Number(this.balance) - Number(amount);
      this.total_consume = Number(this.total_consume) + Number(amount);
    }
    await this.save();
  }

  // 检查余额是否足够
  hasEnoughBalance(amount: number): boolean {
    return Number(this.balance) >= Number(amount);
  }
}