import { forwardRef, Module } from '@nestjs/common';
import { UMenuService } from './service/umenu.service';
import { UserModule } from '../user/user.module';
import { HttpModule } from '@nestjs/axios';
import { ApiClientService } from './service/api.client.service';
import { ChatModule } from '../app-chat.module';

@Module({
  imports: [
    forwardRef(() => ChatModule),
    forwardRef(() => UserModule),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  providers: [UMenuService, ApiClientService],
  exports: [UMenuService, ApiClientService],
})
export class UMenuModule {}
