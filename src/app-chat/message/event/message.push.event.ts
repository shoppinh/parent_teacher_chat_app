import { MessageService } from '../service/message.service';
import { JoinedRoomService } from '../../room/service/joined-room.service';

export class MessageSendPushEvent {
  roomId: number;
  title: string;
  message: string;
  mobilePhone: string;
  menuGUID: string;
  fromUserId: number;
  onlineUser: any;
  msgService: MessageService;
  joinedRoomService: JoinedRoomService;

  constructor({
    roomId,
    title,
    message,
    mobilePhone,
    menuGUID,
    fromUserId,
    onlineUser,
    msgService,
    joinedRoomService,
  }) {
    this.roomId = roomId;
    this.title = title;
    this.message = message;
    this.mobilePhone = mobilePhone;
    this.menuGUID = menuGUID;
    this.fromUserId = fromUserId;
    this.onlineUser = onlineUser;
    this.msgService = msgService;
    this.joinedRoomService = joinedRoomService;
  }
}
