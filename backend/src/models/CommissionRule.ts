import { Table, Column, Model, DataType, ForeignKey, BelongsTo, Index } from 'sequelize-typescript';
import { Worker } from './Worker';

export enum CommissionRuleType {
  GLOBAL = 'global',
  LEVEL = 'level',
  CUSTOM = 'custom'
}

export enum CommissionRuleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

@Table({
  tableName: 'commission_rules',
  timestamps: true,
  underscored: true,
  comment: '分成规则表'
})
export class CommissionRule extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID'
  })
  id!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    comment: '规则名称'
  })
  name!: string;

  @Column({
    type: DataType.ENUM(...Object.values(CommissionRuleType)),
    allowNull: false,
    comment: '规则类型：global-全局，level-级别，custom-自定义'
  })
  type!: CommissionRuleType;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    comment: '打手级别（仅level类型使用）'
  })
  worker_level?: string;

  @ForeignKey(() => Worker)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: '打手ID（仅custom类型使用）'
  })
  worker_id?: number;

  @Column({
    type: DataType.DECIMAL(5, 4),
    allowNull: false,
    comment: '分成比例（0.0000-1.0000）',
    validate: {
      min: 0,
      max: 1
    }
  })
  commission_rate!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
    comment: '最小金额限制'
  })
  min_amount?: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    comment: '最大金额限制'
  })
  max_amount?: number;

  @Column({
    type: DataType.ENUM(...Object.values(CommissionRuleStatus)),
    allowNull: false,
    defaultValue: CommissionRuleStatus.ACTIVE,
    comment: '状态'
  })
  status!: CommissionRuleStatus;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '优先级（数字越大优先级越高）'
  })
  priority!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: '备注'
  })
  remark?: string;

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
  @BelongsTo(() => Worker, 'worker_id')
  worker?: Worker;
}

export default CommissionRule;
