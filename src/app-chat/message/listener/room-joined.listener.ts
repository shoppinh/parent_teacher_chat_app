import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UPDATE_MEMBER_TO_ROOM } from '../../../shared/constant/event.constant';
import { RoomJoinedEvent } from '../event/room-joined.event';

@Injectable()
export class RoomJoinedListener {
  @OnEvent(UPDATE_MEMBER_TO_ROOM)
  handleRoomJoinedListener(event: RoomJoinedEvent) {
    try {
      (async () => {
        //update latest messageId
        await event.joinedRoomService.updateMemberToRoom(event.user, event.room, event.isRole);
      })();
    } catch (e) {}
  }
}
