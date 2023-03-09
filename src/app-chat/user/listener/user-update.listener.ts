import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserUpdateEvent } from '../event/user-update.event';
import { UMENU_USER_UPDATE } from '../../../shared/constant/event.constant';

@Injectable()
export class UserUpdateListener {
  @OnEvent(UMENU_USER_UPDATE)
  handleUserUpdateEvent(event: UserUpdateEvent) {
    try {
      (async () => {
        await event.userService.getUserFromUMenu(event.mobilePhone, event.roleId);
      })();
    } catch (e) {
      console.log(e);
    }
  }
}
