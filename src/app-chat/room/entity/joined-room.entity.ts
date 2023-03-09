import { BaseEntity } from 'src/shared/base.entity';
import { Column, Entity, Index, ManyToOne, Unique } from 'typeorm';
import { RoomEntity } from './room.entity';

@Entity({ name: 'joined_rooms' })
@Unique('joined_rooms_userId_roomKey_idx', ['userId', 'roomKey'])
export class JoinedRoomEntity extends BaseEntity {
  @ManyToOne(() => RoomEntity, (room) => room.joinedRooms)
  room: RoomEntity;

  @Column({ default: 0 })
  @Index('joined_rooms_userId_idx')
  userId: number;

  @Column({ default: 0, nullable: true })
  toUserId: number;

  @Column({ default: 0 })
  @Index('joined_rooms_role_idx')
  role: number;

  @Column({ default: 0 })
  @Index('joined_rooms_toRole_idx')
  toRole: number;

  @Column()
  @Index('joined_rooms_roomKey_idx')
  roomKey: string;

  @Column({ default: 0 })
  countUnread: number;

  @Column({ default: 0 })
  latestMessageId: number;

  @Column({ type: 'timestamptz', nullable: true })
  pushedAt: Date;
}
