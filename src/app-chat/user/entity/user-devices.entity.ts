import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../shared/base.entity';

@Entity()
export class UserDevices extends BaseEntity {
  @Column({ nullable: false })
  userId: number;

  @Column({ nullable: false })
  fcmToken: string;
}
