import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { UserService } from './service/user.service';
import { UMenuModule } from '../umenu/umenu.module';
import { UserUpdateListener } from './listener/user-update.listener';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), UMenuModule],
  providers: [UserService, UserUpdateListener],
  exports: [UserService],
})
export class UserModule {}
