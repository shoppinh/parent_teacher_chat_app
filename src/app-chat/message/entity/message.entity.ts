import { RoomEntity } from '../../room/entity/room.entity';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/shared/base.entity';

@Entity({ name: 'messages' })
export class MessageEntity extends BaseEntity {
  @Column()
  content: string;

  /**
   * text | file | image | order | link | ...
   */
  @Column({ default: 'text' })
  contentType?: string;

  @Column()
  @Index('messages_roomId_idx')
  roomId: number;

  @ManyToOne(() => RoomEntity, (room) => room.messages)
  room: RoomEntity;

  /**
   * userId
   */
  @Column()
  @Index('messages_userId_idx')
  userId: number;

  @Column({ nullable: true })
  @Index('messages_menuGUID_idx')
  menuGUID: string;

  @Column({ nullable: true })
  imagePath: string;

  @Column({ default: true })
  isRead: boolean;
}
