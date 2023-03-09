import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MessageEvent } from '../event/message.event';
import { MessageEntity } from '../entity/message.entity';
import { MESSAGE_SAVE } from '../../../shared/constant/event.constant';

@Injectable()
export class MessageListener {
  @OnEvent(MESSAGE_SAVE)
  handleMessageEvent(event: MessageEvent) {
    try {
      (async () => {
        let msgEntity = new MessageEntity();
        msgEntity.content = event.content;
        msgEntity.roomId = event.roomId;
        msgEntity.userId = event.userId;
        msgEntity.contentType = event.contentType;
        msgEntity.menuGUID = event.menuGUID;
        msgEntity.createdAt = event.createdAt;
        msgEntity.updatedAt = event.createdAt;
        msgEntity = await event.msgService.save(msgEntity);

        //update latest messageId
        await event.joinedRoomService.updateLastMessageId(event.userId, event.roomId, msgEntity.id);
      })();
    } catch (e) {
      console.log(e);
    }
  }
}
