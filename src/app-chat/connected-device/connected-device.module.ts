import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectedDeviceEntity } from './entity/connected-device.entity';
import { ConnectedDeviceService } from './service/connected-device.service';
import { ChatModule } from '../app-chat.module';

@Module({
  imports: [TypeOrmModule.forFeature([ConnectedDeviceEntity]), forwardRef(() => ChatModule)],
  providers: [ConnectedDeviceService],
  exports: [ConnectedDeviceService],
})
export class ConnectedDeviceModule {}
