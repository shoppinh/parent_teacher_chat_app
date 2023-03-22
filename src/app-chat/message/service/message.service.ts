import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  LIMIT_DEFAULT,
  MESSAGE_LOADSIZE,
  OFFSET_DEFAULT,
  ORDER_BY_DEFAULT,
  ORDER_DESC_DEFAULT,
} from 'src/shared/constant/message.constant';
import { BaseService } from 'src/shared/base.service';
import { IsNull, LessThan, Not, Repository } from 'typeorm';
import { MessageEntity } from '../entity/message.entity';
import { UserService } from '../../user/service/user.service';
import { JoinedRoomService } from '../../room/service/joined-room.service';
import { UserEntity } from '../../user/entity/user.entity';
import { RoomService } from '../../room/service/room.service';
import { ParTeRoleIdType, RoleIdType } from '../../../shared/constant/role.constant';
import { UMenuService } from '../../umenu/service/umenu.service';

@Injectable()
export class MessageService extends BaseService<MessageEntity> {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly _messageRepository: Repository<MessageEntity>,
    private userService: UserService,
    @Inject(forwardRef(() => RoomService))
    private roomService: RoomService,
    private joinedRoomService: JoinedRoomService,
    private umenuService: UMenuService,
  ) {
    super();
    this._repository = this._messageRepository;
  }

  async findConversations(
    mobilePhone: string,
    roleId: number,
    offset: number = OFFSET_DEFAULT,
    limit: number = LIMIT_DEFAULT,
    orderBy: string = ORDER_BY_DEFAULT,
    orderDesc: string = ORDER_DESC_DEFAULT,
    text: string = null,
  ): Promise<any> {
    //Get user by phone and role
    const user = await this.userService.findOne({ mobilePhone, roleId });

    if ([ParTeRoleIdType.ADMIN, ParTeRoleIdType.PARENT, ParTeRoleIdType.TEACHER].includes(Number(roleId))) {
      if (!user) {
        return null;
      }
      return await this.joinedRoomService.getConversationsByUserId(
        user.id,
        user.roleId,
        offset,
        limit,
        orderBy,
        orderDesc,
        text,
      );
    }
    // else if (Number(roleId) === RoleIdType.OUTLET_OWNER) {
    //   if (!user) {
    //     //get user from UMenuBackend
    //     const uMenuUser = await this.userService.getUserFromUMenu(mobilePhone, roleId);
    //     if (!uMenuUser) {
    //       return null;
    //     }
    //     user = uMenuUser?.user;
    //   }

    //   return await this.joinedRoomService.getConversationsByOutlet(
    //     user.id,
    //     user.roleId,
    //     offset,
    //     limit,
    //     orderBy,
    //     orderDesc,
    //     text,
    //   );
    // }
    // else if (Number(roleId) === RoleIdType.ADMIN) {
    //   if (!user) {
    //     //add new admin user
    //     const userUMenu = await this.userService.getUserFromUMenu(mobilePhone, roleId);
    //     user = userUMenu?.user;
    //   }

    //   if (!user) {
    //     return;
    //   }

    //   return await this.joinedRoomService.getConversationsByAdmin(
    //     user.id,
    //     roleId,
    //     offset,
    //     limit,
    //     orderBy,
    //     orderDesc,
    //     text,
    //   );
    // }
    return null;
  }

  async findConversationDetail(
    roomId: number,
    offset,
    limit,
    orderBy,
    orderDesc,
    startMessageId: number = 0,
  ): Promise<any> {
    let messages = await this._repository
      .createQueryBuilder('messages')
      .select([
        'users."userName" AS "userName"',
        'users."fullName" AS "fullName"',
        'users.firstName AS "firstName"',
        'users.lastName AS "lastName"',
        'users."mobilePhone" AS "mobilePhone"',
        'users."roleId" AS "roleId"',
        'messages.*',
      ])
      .innerJoin(UserEntity, 'users', `users.id=messages.userId`)
      .where(`messages.roomId = ${roomId}`)
      .offset(offset)
      .limit(limit)
      .orderBy('messages.id', orderDesc === 'ASC' ? 'ASC' : 'DESC');
    if (startMessageId > 0) {
      messages.andWhere(`messages.id<${startMessageId}`);
    }
    const messagesData = await messages.getRawMany();
    return messagesData;
  }

  async findConversationCountUnreadUser(mobilePhone: string, roleId: number): Promise<any> {
    const user = await this.userService.findOne({ mobilePhone, roleId });
    if (!user) {
      return null;
    }
    return await this.joinedRoomService.getCountUnreadByUser(user.id, user.roleId);
  }

  async findConversationCountUnreadRoom(
    fromMobilePhone: string,
    fromRoleId: number,
    toMobilePhone: string,
    toRoleId: number,
  ): Promise<any> {
    const fromUser = await this.userService.findOne({ mobilePhone: fromMobilePhone, roleId: fromRoleId });
    if (!fromUser) {
      return null;
    }
    const toUser = await this.userService.findOne({ mobilePhone: toMobilePhone, roleId: toRoleId });
    if (!toUser) {
      return null;
    }

    //Get Room
    const roomKey = this.roomService.getRoomKeyByItems(fromMobilePhone, fromRoleId, toMobilePhone, toRoleId);
    if (!roomKey) {
      return null;
    }
    const room = await this.roomService.findOne({ roomKey });
    if (!room) {
      return null;
    }

    return await this.joinedRoomService.getCountUnreadByRoom(room.id, fromUser.id, fromUser.roleId);
  }

  /**
   * Get messages by roomId
   * @param roomId
   * @param startFromId default -1 to get from the lastest message
   * @param take pass -1 to get all (default {messageLoadSize})
   * @returns
   */
  async findByRoomId(roomId, startFromId = -1, take = MESSAGE_LOADSIZE): Promise<MessageEntity[]> {
    const filterOption: any = {
      relations: ['room'],
      where: {
        room: {
          id: roomId,
        },
      },
      order: {
        createdAt: 'DESC',
        id: 'DESC',
      },
    };

    if (startFromId !== -1) {
      filterOption.where.id = LessThan(startFromId);
    }
    if (take !== -1) {
      filterOption.take = take;
    }

    return this.find(filterOption);
  }

  async pushNotificationToUmenuUser(
    offlineUsers: any = [],
    title: string,
    body: string,
    fromUser: any = null,
  ): Promise<any> {
    if (!offlineUsers?.length) {
      return null;
    }

    if (fromUser) {
      const user = await this.userService.findOne({ id: fromUser.fromUserId });
      if (user) {
        fromUser.roleId = user.roleId;
        fromUser.mobilePhone = user.mobilePhone;
        fromUser.userName = user.userName;
      }

      if (!fromUser?.menuGUID?.trim() && fromUser?.roomId) {
        const latestMessage = await this.findOne({
          roomId: fromUser.roomId,
          menuGUID: Not(IsNull()),
        });
        fromUser.menuGUID = latestMessage?.menuGUID;
      }
    }
    return await this.umenuService.pushNotificationToUmenuUser(offlineUsers, title, body, fromUser);
  }

  async usersNeedToPush(fromUserId, offlineUsers: any) {
    try {
      const fromUser = await this.userService.findOne({ id: fromUserId });
      if (Number(fromUser.roleId) === RoleIdType.ADMIN) {
        return offlineUsers.filter((u) => Number(u.role) !== RoleIdType.ADMIN);
      } else if (Number(fromUser.roleId) === RoleIdType.OUTLET_OWNER) {
        return offlineUsers.filter((u) => Number(u.role) !== RoleIdType.OUTLET_OWNER);
      }
      return offlineUsers;
    } catch (e) {
      return offlineUsers;
    }
  }
}
