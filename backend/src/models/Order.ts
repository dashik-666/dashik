import { Table, Column, Model, DataType, BelongsTo, ForeignKey, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { Member } from './Member';
import { Worker } from './Worker';

export enum PayMethod {
  BALANCE = 'balance',
  SCAN = 'scan',
  MIXED = 'mixed'
}

export enum OrderStatus {
  PENDING = 'pending',    // 待上钟
  IN_SERVICE = 'in_service', // 服务中
  COMPLETED = 'completed',   // 已完成
  CANCELLED = 'cancelled'    // 已取消
}

@Table({
  tableName: 'orders',
  timestamps: true,
  underscored: true
})
export class Order extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => Member)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '会员ID'
  })
  member_id!: number;

  @ForeignKey(() => Worker)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '打手ID'
  })
  worker_id!: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    comment: '服务时长（小时）'
  })
  duration!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    comment: '原价（时长 × 单价）'
  })
  price_origin!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    comment: '优惠金额'
  })
  discount?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    comment: '实付金额'
  })
  price_final!: number;

  @Column({
    type: DataType.ENUM(...Object.values(PayMethod)),
    allowNull: false,
    comment: '支付方式'
  })
  pay_method!: PayMethod;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    comment: '使用余额金额'
  })
  pay_balance?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    comment: '扫码支付金额'
  })
  pay_scan?: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: '管理员备注（优惠原因/特殊情况说明）'
  })
  remark?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: '优惠原因（当价格调整时必填）'
  })
  discount_reason?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '上钟时间（开始服务时间）'
  })
  start_time?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: '下钟时间（结束服务时间）'
  })
  end_time?: Date;

  @Column({
    type: DataType.ENUM(...Object.values(OrderStatus)),
    allowNull: false,
    defaultValue: OrderStatus.PENDING,
    comment: '订单状态'
  })
  status!: OrderStatus;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    comment: '下单时间'
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
  @BelongsTo(() => Member)
  member!: Member;

  @BelongsTo(() => Worker)
  worker!: Worker;

  // 静态方法：计算原价
  static calculateOriginPrice(duration: number, hourlyRate: number): number {
    return Number((Number(duration) * Number(hourlyRate)).toFixed(2));
  }

  // 静态方法：计算实付金额
  static calculateFinalPrice(originPrice: number, discount: number = 0): number {
    return Number((Number(originPrice) - Number(discount)).toFixed(2));
  }

  // 静态方法：获取支付方式的中文描述
  static getPayMethodText(method: PayMethod): string {
    const methodMap = {
      [PayMethod.BALANCE]: '余额支付',
      [PayMethod.SCAN]: '扫码支付',
      [PayMethod.MIXED]: '混合支付'
    };
    return methodMap[method] || method;
  }

  // 静态方法：获取订单状态的中文描述
  static getStatusText(status: OrderStatus): string {
    const statusMap = {
      [OrderStatus.PENDING]: '待上钟',
      [OrderStatus.IN_SERVICE]: '服务中',
      [OrderStatus.COMPLETED]: '已完成',
      [OrderStatus.CANCELLED]: '已取消'
    };
    return statusMap[status] || status;
  }

  // 静态方法：获取订单状态的颜色
  static getStatusColor(status: OrderStatus): string {
    const colorMap = {
      [OrderStatus.PENDING]: '#909399',    // 灰色
      [OrderStatus.IN_SERVICE]: '#E6A23C', // 橙色
      [OrderStatus.COMPLETED]: '#67C23A',  // 绿色
      [OrderStatus.CANCELLED]: '#F56C6C'   // 红色
    };
    return colorMap[status] || '#909399';
  }

  // 实例方法：验证支付金额
  validatePaymentAmounts(): boolean {
    const finalPrice = Number(this.price_final);
    const balanceAmount = Number(this.pay_balance || 0);
    const scanAmount = Number(this.pay_scan || 0);

    // 检查总金额是否匹配
    const totalPayment = balanceAmount + scanAmount;
    if (Math.abs(totalPayment - finalPrice) > 0.01) {
      return false;
    }

    switch (this.pay_method) {
      case PayMethod.BALANCE:
        return balanceAmount > 0 && scanAmount === 0;
      case PayMethod.SCAN:
        return scanAmount > 0 && balanceAmount === 0;
      case PayMethod.MIXED:
        return balanceAmount > 0 && scanAmount > 0;
      default:
        return false;
    }
  }

  // 实例方法：获取订单编号（格式化ID）
  getOrderNumber(): string {
    const date = new Date(this.created_at);
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    return `ORD${dateStr}${this.id.toString().padStart(6, '0')}`;
  }

  // 实例方法：设置上钟时间
  setStartTime(time?: Date): void {
    // 如果没有提供时间，使用当前北京时间
    if (!time) {
      const now = new Date();
      // 获取当前UTC时间并转换为北京时间（UTC+8）
      const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      this.start_time = beijingTime;
    } else {
      this.start_time = time;
    }
    this.status = OrderStatus.IN_SERVICE;
    this.updateEndTime();
  }

  // 实例方法：更新下钟时间（根据上钟时间和服务时长计算）
  updateEndTime(): void {
    if (this.start_time && this.duration) {
      const endTime = new Date(this.start_time);
      endTime.setHours(endTime.getHours() + Math.floor(this.duration));
      endTime.setMinutes(endTime.getMinutes() + Math.round((this.duration % 1) * 60));
      this.end_time = endTime;
    }
  }

  // 实例方法：设置下钟时间
  setEndTime(time?: Date): void {
    // 如果没有提供时间，使用当前北京时间
    if (!time) {
      const now = new Date();
      // 获取当前UTC时间并转换为北京时间（UTC+8）
      const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      this.end_time = beijingTime;
    } else {
      this.end_time = time;
    }
    this.status = OrderStatus.COMPLETED;
  }

  // 实例方法：检查是否已上钟
  isStarted(): boolean {
    return this.status === OrderStatus.IN_SERVICE || this.status === OrderStatus.COMPLETED;
  }

  // 实例方法：检查是否已下钟
  isEnded(): boolean {
    return this.status === OrderStatus.COMPLETED;
  }

  // 实例方法：检查是否正在服务中
  isInService(): boolean {
    return this.status === OrderStatus.IN_SERVICE;
  }

  // 实例方法：检查是否待上钟
  isPending(): boolean {
    return this.status === OrderStatus.PENDING;
  }

  // 实例方法：获取剩余服务时间（分钟）
  getRemainingTime(): number {
    if (!this.start_time || !this.end_time) return 0;
    const now = new Date();
    const remaining = this.end_time.getTime() - now.getTime();
    return Math.max(0, Math.floor(remaining / (1000 * 60)));
  }
}