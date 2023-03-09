import { JoinedRoomService } from '../../room/service/joined-room.service';
import { UserEntity } from '../../user/entity/user.entity';
import { RoomEntity } from '../../room/entity/room.entity';

export class RoomJoinedEvent {
  user: UserEntity;
  room: RoomEntity;
  joinedRoomService: JoinedRoomService;
  isRole: number;

  constructor({ user, room, joinedRoomService, isRole }) {
    this.user = user;
    this.room = room;
    this.isRole = isRole;
    this.joinedRoomService = joinedRoomService;
  }
}
