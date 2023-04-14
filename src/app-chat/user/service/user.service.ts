import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/shared/base.service';
import { Repository } from 'typeorm';
import { UserEntity } from '../entity/user.entity';
import { UMenuService } from '../../umenu/service/umenu.service';
import { mapStringRoleToNumber } from 'src/shared/util';

@Injectable()
export class UserService extends BaseService<UserEntity> {
  constructor(
    @InjectRepository(UserEntity)
    private readonly _userRepository: Repository<UserEntity>,
    private readonly umenuService: UMenuService,
  ) {
    super();
    this._repository = this._userRepository;
  }

  async saveUserFromUMenu(userUMenu): Promise<any> {
    const results = {
      user: null,
      userOutlet: null,
    };

    let user = await this.findOne({ mobilePhone: userUMenu.user.mobilePhone, roleId: userUMenu.user.roleId });
    if (!user) {
      user = new UserEntity();
    }
    user.mobilePhone = userUMenu.user.mobilePhone;
    user.roleId = userUMenu.user.roleId;
    user.userName = userUMenu.user.userName;
    user.firstName = userUMenu.user.firstName;
    user.lastName = userUMenu.user.lastName;
    user.email = userUMenu.user.email;
    user.outletOwnerMobilePhone = userUMenu.outletUser?.mobilePhone;
    results.user = await this.save(user);

    if (userUMenu.outletUser?.mobilePhone) {
      let userOutlet = await this.findOne({
        mobilePhone: userUMenu.outletUser?.mobilePhone,
        roleId: userUMenu.outletUser?.roleId,
      });
      if (!userOutlet) {
        userOutlet = new UserEntity();
      }
      userOutlet.mobilePhone = userUMenu.outletUser.mobilePhone;
      userOutlet.roleId = userUMenu.outletUser.roleId;
      userOutlet.userName = userUMenu.outletUser.userName;
      userOutlet.firstName = userUMenu.outletUser.firstName;
      userOutlet.lastName = userUMenu.outletUser.lastName;
      userOutlet.email = userUMenu.outletUser.email;
      results.userOutlet = await this.save(userOutlet);
    }
    return results;
  }

  async saveUserFromPartei(userPartei): Promise<any> {
    let user = await this.findOne({
      mobilePhone: userPartei.mobilePhone,
      roleId: mapStringRoleToNumber(userPartei.role),
    });
    if (!user) {
      user = new UserEntity();
    }
    user.mobilePhone = userPartei.mobilePhone;
    user.roleId = mapStringRoleToNumber(userPartei.role);
    user.userName = userPartei.username;
    user.firstName = userPartei.firstname;
    user.lastName = userPartei.lastname;
    user.fullName = userPartei.fullname;
    user.email = userPartei.email;
    user.userUniqueId = userPartei._id;
    user.lastLogin = userPartei.lastLoggedIn;
    user.avatar = userPartei.avatar;

    const results = await this.save(user);

    return results;
  }

  async getUserFromUMenu(mobilePhone: string, roleId: number): Promise<any> {
    try {
      //Call to UMenuApi
      const userUMenu = await this.umenuService.getUserByPhone(mobilePhone, roleId);
      return await this.saveUserFromUMenu(userUMenu);
    } catch (e) {}
  }

  async pushNotificationToUmenuUser(offlineUsers: any = [], title: string, body: string): Promise<any> {
    return await this.umenuService.pushNotificationToUmenuUser(offlineUsers, title, body);
  }
}
