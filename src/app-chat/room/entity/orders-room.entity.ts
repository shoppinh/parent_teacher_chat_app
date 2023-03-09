import { BaseEntity } from 'src/shared/base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity({ name: 'orders_room' })
export class OrdersRoomEntity extends BaseEntity {
  @Column({ default: 0 })
  @Index('order_rooms_roomId_idx')
  roomId: number;

  @Column({ default: '0', nullable: true })
  @Index('order_rooms_orderId_idx')
  orderId: string;
}
