import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, BelongsToMany } from 'sequelize-typescript';
import { User } from './User';
import { UserRoleModel } from './UserRole';

export enum RoleStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled'
}

@Table({
  tableName: 'roles',
  timestamps: true,
  underscored: true
})
export class Role extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
    comment: '角色名称'
  })
  name!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
    comment: '角色编码'
  })
  code!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: '角色描述'
  })
  description?: string;

  @Column({
    type: DataType.ENUM(...Object.values(RoleStatus)),
    allowNull: false,
    defaultValue: RoleStatus.ACTIVE,
    comment: '状态'
  })
  status!: RoleStatus;

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
  @BelongsToMany(() => User, () => UserRoleModel)
  users!: User[];
}
