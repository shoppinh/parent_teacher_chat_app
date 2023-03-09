import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../shared/base.entity';

@Entity()
export class ConsumerDevices extends BaseEntity {
  @Column({ nullable: false })
  consumerId: number;

  @Column({ nullable: false })
  fcmToken: string;
}
