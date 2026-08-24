import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, ForeignKey } from 'sequelize-typescript';
import { User } from './User';
import { Role } from './Role';

@Table({
  tableName: 'user_roles',
  timestamps: true,
  underscored: true
})
export class UserRoleModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '用户ID'
  })
  user_id!: number;

  @ForeignKey(() => Role)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: '角色ID'
  })
  role_id!: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    comment: '创建时间'
  })
  created_at!: Date;
}

// 导出别名以保持兼容性
export { UserRoleModel as UserRole };
