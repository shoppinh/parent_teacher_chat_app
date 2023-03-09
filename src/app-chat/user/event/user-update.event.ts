import { UserService } from '../service/user.service';

export class UserUpdateEvent {
  mobilePhone: string;
  roleId: any;
  userService: UserService;

  constructor({ mobilePhone, roleId, userService }) {
    this.mobilePhone = mobilePhone;
    this.roleId = roleId;
    this.userService = userService;
  }
}
