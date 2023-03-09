import { MessageService } from '../service/message.service';
import { JoinedRoomService } from '../../room/service/joined-room.service';

export class MessageEvent {
  content: string;
  userId: any;
  roomId: any;
  contentType: string;
  menuGUID: string;
  createdAt: Date;
  msgService: MessageService;
  joinedRoomService: JoinedRoomService;

  constructor({ content, userId, roomId, contentType, menuGUID, createdAt, msgService, joinedRoomService }) {
    this.content = content;
    this.userId = userId;
    this.roomId = roomId;
    this.contentType = contentType;
    this.menuGUID = menuGUID;
    this.createdAt = createdAt;
    this.msgService = msgService;
    this.joinedRoomService = joinedRoomService;
  }
}
