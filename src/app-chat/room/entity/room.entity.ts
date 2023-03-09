import { MessageEntity } from 'src/app-chat/message/entity/message.entity';
import { BaseEntity } from 'src/shared/base.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { JoinedRoomEntity } from './joined-room.entity';

@Entity({ name: 'rooms' })
export class RoomEntity extends BaseEntity {
  @Column({ nullable: true })
  name?: string;

  @Column({ unique: true, nullable: false })
  @Index('rooms_roomKey_idx')
  roomKey: string;

  @Column({ default: true })
  started: boolean;

  @OneToMany(() => MessageEntity, (message) => message.room)
  messages?: Promise<MessageEntity[]>;

  @OneToMany(() => JoinedRoomEntity, (joinedRoom) => joinedRoom.room)
  joinedRooms?: Promise<JoinedRoomEntity[]>;
}
