import { Table, Column, Model, DataType, BelongsTo, ForeignKey, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import { Member } from './Member';
import { Worker } from './Worker';
import { Order } from './Order';

@Table({
  tableName: 'reviews',
  timestamps: true,
  underscored: true,
})
export class Review extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: false, comment: '关联订单ID' })
  order_id!: number;

  @ForeignKey(() => Member)
  @Column({ type: DataType.INTEGER, allowNull: false, comment: '会员ID' })
  member_id!: number;

  @ForeignKey(() => Worker)
  @Column({ type: DataType.INTEGER, allowNull: false, comment: '陪玩师ID' })
  worker_id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false, comment: '评分 1-5' })
  rating!: number;

  @Column({ type: DataType.STRING(500), allowNull: true, comment: '评价内容' })
  content?: string;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW, comment: '评价时间' })
  created_at!: Date;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW, comment: '更新时间' })
  updated_at!: Date;

  @BelongsTo(() => Member)
  member!: Member;

  @BelongsTo(() => Worker)
  worker!: Worker;

  @BelongsTo(() => Order)
  order!: Order;
}
