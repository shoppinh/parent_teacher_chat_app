import { UserEntity } from '../../user/entity/user.entity';

export interface IMessageSend {
  content: string;
  fromUser: UserEntity;
  toUser: UserEntity;
  roomId: number;
  contentType?: string;
  menuGUID?: string;
  createdAt?: Date;
}
