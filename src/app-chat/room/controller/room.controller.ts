import { Controller } from '@nestjs/common';
import { RoomService } from '../service/room.service';
import { JoinedRoomService } from '../service/joined-room.service';
import { MessageService } from 'src/app-chat/message/service/message.service';

@Controller('api/room')
export class RoomController {
  constructor(
    private readonly roomService: RoomService,
    private readonly messageService: MessageService,
    private readonly joinedRoomService: JoinedRoomService,
  ) {}

  /*@Post('getRoom')
    async getRoom(@Body() joinRoomDTO: IJoinRoomDTO) {
      try {
        const room = await this.roomService.getRoomFromJoinDTO(joinRoomDTO);

        return new ApiResponse(room);
      } catch (error) {
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }*/
}
