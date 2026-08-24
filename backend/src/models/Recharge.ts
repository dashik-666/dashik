import { Table, Column, Model, DataType, BelongsTo, ForeignKey, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { Member } from './Member';

export enum RechargeMethod {
  BALANCE = 'balance',
  SCAN = 'scan'
}

@Table({
  tableName: 'recharges',
  timestamps: true,
  underscored: true
})
export class Recharge extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
    comment: '充值编号'
  })
  recharge_no!: string;

  @ForeignKey(() => Member)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '会员ID'
  })
  member_id!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    comment: '充值金额'
  })
  amount!: number;

  @Column({
    type: DataType.ENUM(...Object.values(RechargeMethod)),
    allowNull: false,
    comment: '支付方式'
  })
  method!: RechargeMethod;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '操作人ID'
  })
  operator_id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    comment: '操作人姓名'
  })
  operator_name!: string;

  @Column({
    type: DataType.ENUM('active', 'cancelled'),
    allowNull: false,
    defaultValue: 'active',
    comment: '状态：active-有效，cancelled-已取消'
  })
  status!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '取消操作人ID'
  })
  cancelled_by?: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: '取消操作人姓名'
  })
  cancelled_by_name?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '取消时间'
  })
  cancelled_at?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    comment: '充值时间'
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
  @BelongsTo(() => Member)
  member!: Member;

  // 静态方法：获取充值方式的中文描述
  static getMethodText(method: RechargeMethod): string {
    const methodMap = {
      [RechargeMethod.BALANCE]: '余额充值',
      [RechargeMethod.SCAN]: '扫码充值'
    };
    return methodMap[method] || method;
  }
}