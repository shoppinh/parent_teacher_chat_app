import { BaseEntity } from 'src/shared/base.entity';
import {Column, Entity, Index} from 'typeorm';

@Entity({ name: 'connected_devices' })
export class ConnectedDeviceEntity extends BaseEntity {
  @Column()
  socketId: string;

  @Column()
  @Index("connected_devices_mobilePhone_idx")
  mobilePhone: string;

  @Column()
  @Index("connected_devices_userId_idx")
  userId: number;

  @Column()
  @Index("connected_devices_roleId_idx")
  roleId: number;

  @Column({ default: 0 })
  roomId: number;
}
