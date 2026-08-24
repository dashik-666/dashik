import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Worker } from './Worker';
import { User } from './User';

export enum SettlementStatus {
  PENDING = 'pending',      // 待核账
  CONFIRMED = 'confirmed',  // 已核账
  DISPUTED = 'disputed'     // 有争议
}

export enum SettlementType {
  DAILY = 'daily',          // 日结
  WEEKLY = 'weekly',        // 周结
  MONTHLY = 'monthly'       // 月结
}

@Table({
  tableName: 'worker_settlements',
  timestamps: true,
  underscored: true
})
export class WorkerSettlement extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => Worker)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '打手ID'
  })
  worker_id!: number;

  @Column({
    type: DataType.ENUM(...Object.values(SettlementType)),
    allowNull: false,
    comment: '结算类型'
  })
  settlement_type!: SettlementType;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '结算开始日期'
  })
  start_date!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    comment: '结算结束日期'
  })
  end_date!: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '订单数量'
  })
  order_count!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '订单总金额'
  })
  order_amount!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '小时数'
  })
  total_hours!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '小时单价'
  })
  hourly_rate!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '应得金额'
  })
  expected_amount!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '实发金额'
  })
  actual_amount!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '差额'
  })
  difference_amount!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '差额说明'
  })
  difference_reason?: string;

  @Column({
    type: DataType.ENUM(...Object.values(SettlementStatus)),
    allowNull: false,
    defaultValue: SettlementStatus.PENDING,
    comment: '核账状态'
  })
  status!: SettlementStatus;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '核账操作人ID'
  })
  confirmed_by?: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '核账时间'
  })
  confirmed_at?: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    comment: '核账备注'
  })
  confirmation_note?: string;

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
  @BelongsTo(() => Worker)
  worker!: Worker;

  @BelongsTo(() => User)
  confirmedByUser?: User;

  // 实例方法：计算差额
  calculateDifference(): void {
    this.difference_amount = this.actual_amount - this.expected_amount;
  }

  // 实例方法：确认核账
  confirm(confirmedBy: number, note?: string): void {
    this.status = SettlementStatus.CONFIRMED;
    this.confirmed_by = confirmedBy;
    this.confirmed_at = new Date();
    this.confirmation_note = note;
  }

  // 实例方法：标记争议
  markDisputed(reason: string): void {
    this.status = SettlementStatus.DISPUTED;
    this.difference_reason = reason;
  }

  // 静态方法：获取状态的中文描述
  static getStatusText(status: SettlementStatus): string {
    const statusMap = {
      [SettlementStatus.PENDING]: '待核账',
      [SettlementStatus.CONFIRMED]: '已核账',
      [SettlementStatus.DISPUTED]: '有争议'
    };
    return statusMap[status] || status;
  }

  // 静态方法：获取结算类型的中文描述
  static getTypeText(type: SettlementType): string {
    const typeMap = {
      [SettlementType.DAILY]: '日结',
      [SettlementType.WEEKLY]: '周结',
      [SettlementType.MONTHLY]: '月结'
    };
    return typeMap[type] || type;
  }
}
