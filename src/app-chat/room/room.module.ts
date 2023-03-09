import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageModule } from '../message/message.module';
import { RoomController } from './controller/room.controller';
import { JoinedRoomEntity } from './entity/joined-room.entity';
import { RoomEntity } from './entity/room.entity';
import { JoinedRoomService } from './service/joined-room.service';
import { RoomService } from './service/room.service';
import { UserModule } from '../user/user.module';
import { UMenuModule } from '../umenu/umenu.module';
import { OrdersRoomEntity } from './entity/orders-room.entity';
import { OrdersRoomService } from './service/orders-room.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoomEntity, JoinedRoomEntity, OrdersRoomEntity]),
    forwardRef(() => MessageModule),
    forwardRef(() => UMenuModule),
    UserModule,
  ],
  controllers: [RoomController],
  providers: [RoomService, JoinedRoomService, OrdersRoomService],
  exports: [RoomService, JoinedRoomService, OrdersRoomService],
})
export class RoomModule {}
