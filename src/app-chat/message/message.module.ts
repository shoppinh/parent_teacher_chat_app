import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomModule } from '../room/room.module';
import { MessageController } from './controller/message.controller';
import { MessageEntity } from './entity/message.entity';
import { MessageService } from './service/message.service';
import { UserModule } from '../user/user.module';
import { MessageListener } from './listener/message.listener';
import { MessageSendPushListener } from './listener/message.push.listener';
import { AuthModule } from '../../auth/auth.module';
import { UMenuModule } from '../umenu/umenu.module';
import { RoomJoinedListener } from './listener/room-joined.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageEntity]),
    forwardRef(() => RoomModule),
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => UMenuModule),
  ],
  controllers: [MessageController],
  providers: [MessageService, MessageListener, MessageSendPushListener, RoomJoinedListener],
  exports: [MessageService],
})
export class MessageModule {}
