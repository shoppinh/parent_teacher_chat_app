import { BaseEntity } from 'src/shared/base.entity';
import { Column, Entity, Index, Unique } from 'typeorm';

@Entity({ name: 'users' })
@Unique('users_mobilePhone_roleId_idx', ['mobilePhone', 'roleId'])
export class UserEntity extends BaseEntity {
  @Column({ nullable: true })
  email: string;

  @Column({ unique: false })
  @Index('users_mobilePhone_idx')
  mobilePhone: string;

  @Column({ nullable: true })
  @Index('users_userName_idx')
  userName?: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  fullName?: string;

  @Column({ nullable: true })
  userUniqueId?: string;

  @Column({ default: 2 })
  @Index('users_roleId_idx')
  roleId: number;

  @Column({ nullable: true })
  @Index('users_outletOwnerMobilePhone_idx')
  outletOwnerMobilePhone: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLogin: Date;

  @Column({ nullable: true })
  avatar: string;
}
