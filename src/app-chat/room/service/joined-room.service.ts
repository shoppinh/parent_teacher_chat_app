import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IJoinRoomDTO } from 'src/app-chat/room/model/joinRoomDTO';
import { BaseService } from 'src/shared/base.service';
import { Brackets, getConnection, Repository } from 'typeorm';
import { JoinedRoomEntity } from '../entity/joined-room.entity';
import { RoomEntity } from '../entity/room.entity';
import { UserEntity } from '../../user/entity/user.entity';
import { LIMIT_DEFAULT, OFFSET_DEFAULT, ORDER_DESC_DEFAULT } from '../../../shared/constant/message.constant';
import { MessageEntity } from '../../message/entity/message.entity';
import { RoomService } from './room.service';
import { OrdersRoomEntity } from '../entity/orders-room.entity';
import { RoleIdType } from '../../../shared/constant/role.constant';
import { printLog } from '../../../shared/util';
import { UserService } from '../../user/service/user.service';

@Injectable()
export class JoinedRoomService extends BaseService<JoinedRoomEntity> {
  constructor(
    @InjectRepository(JoinedRoomEntity)
    private readonly _joinedRoomRepository: Repository<JoinedRoomEntity>,
    @Inject(forwardRef(() => RoomService))
    private readonly _roomService: RoomService,
    private readonly _userService: UserService,
  ) {
    super();
    this._repository = this._joinedRoomRepository;
  }

  async getConversationsByOutlet(
    userId: number,
    roleId: number,
    offset: number = OFFSET_DEFAULT,
    limit: number = LIMIT_DEFAULT,
    orderBy: string = 'joined_rooms.id',
    orderDesc: string = ORDER_DESC_DEFAULT,
    text: string = null,
  ) {
    const fromQueryBuilder = await this._repository
      .createQueryBuilder('joined_rooms')
      .select([
        'MAX("id") as "id", "roomId"',
        'MAX("userId") as "userId"',
        'MAX("latestMessageId") as "latestMessageId"',
        'MAX("countUnread") as "countUnread"',
        'MAX("role") as "role"',
        'MAX("toUserId") as "toUserId"',
      ])
      .where(`"userId"=${userId}`)
      .andWhere(`"role"=${roleId}`)
      .offset(offset)
      .limit(limit)
      .groupBy(`"roomId"`);

    let data = await getConnection()
      .createQueryBuilder()
      .from('(' + fromQueryBuilder.getQuery() + ')', 'joined_rooms2')
      .select([
        'users.userName AS "fromUserName"',
        'users.mobilePhone AS "fromMobilePhone"',
        'users.roleId AS "fromRoleId"',
        'users2.userName AS "toUserName"',
        'users2.mobilePhone AS "toMobilePhone"',
        'users2.roleId AS "toRoleId"',
        'messages.createdAt AS "lastTimeMessage"',
        'messages.content AS "latestMessage"',
        'messages.contentType AS "latestMessageContentType"',
        'joined_rooms2.*',
      ])
      .innerJoin(UserEntity, 'users', `users.id=joined_rooms2."userId"`)
      .innerJoin(UserEntity, 'users2', `users2.id=joined_rooms2."toUserId"`)
      .innerJoin(MessageEntity, 'messages', `messages.id=joined_rooms2."latestMessageId"`)
      .where(`users.id=${userId}`)
      .offset(offset)
      .limit(limit)
      .orderBy('messages.createdAt', orderDesc === 'ASC' ? 'ASC' : 'DESC');

    let searchQuery = text !== undefined ? text?.trim().replace(/ /g, ' & ') : text;
    if (searchQuery) {
      if (Number(searchQuery) > 0) {
        data.innerJoin(OrdersRoomEntity, 'orders_room', `orders_room."roomId"=joined_rooms2."roomId"`);
      }

      data.andWhere(
        new Brackets((sqb) => {
          sqb.where(
            new Brackets((sqb1) => {
              sqb1.where(`to_tsvector('simple', users2."userName") @@ to_tsquery('simple', :userName)`, {
                userName: `${searchQuery}:*`,
              });
              sqb1.orWhere(`RIGHT(LOWER(users2."userName"), ${searchQuery.length}) = :searchQuery`, {
                searchQuery: searchQuery.toLowerCase(),
              });

              if (Number(searchQuery) > 0) {
                sqb1.orWhere(`to_tsvector('simple', orders_room."orderId") @@ to_tsquery('simple', :orderId)`, {
                  orderId: `${searchQuery}:*`,
                });

                sqb1.orWhere(`RIGHT(orders_room."orderId", ${searchQuery.length}) = :searchQuery`, {
                  searchQuery,
                });
              }
            }),
          );
        }),
      );
    }

    return await data.getRawMany();
  }

  async getConversationsByUserId(
    userId: number,
    roleId: number,
    offset: number = OFFSET_DEFAULT,
    limit: number = LIMIT_DEFAULT,
    orderBy: string = 'joined_rooms.id',
    orderDesc: string = ORDER_DESC_DEFAULT,
    text: string = null,
  ) {
    const fromQueryBuilder = await this._repository
      .createQueryBuilder('joined_rooms')
      .select([
        'MAX("id") as "id", "roomId"',
        'MAX("userId") as "userId"',
        'MAX("latestMessageId") as "latestMessageId"',
        'MAX("countUnread") as "countUnread"',
        'MAX("role") as "role"',
        'MAX("toUserId") as "toUserId"',
      ])
      .where(`"userId"=${userId}`)
      .andWhere(`"role"=${roleId}`)
      .offset(offset)
      .limit(limit)
      .groupBy(`"roomId"`);

    let data = await getConnection()
      .createQueryBuilder()
      .from('(' + fromQueryBuilder.getQuery() + ')', 'joined_rooms2')
      .select([
        'users.userName AS "fromUserName"',
        'users.mobilePhone AS "fromMobilePhone"',
        'users.roleId AS "fromRoleId"',
        'users.fullName AS "fromFullName"',
        'users.userUniqueId AS "fromUserUniqueId"',
        'users2.userName AS "toUserName"',
        'users2.fullName AS "toFullName"',
        'users2.mobilePhone AS "toMobilePhone"',
        'users2.roleId AS "toRoleId"',
        'users2.userUniqueId AS "toUserUniqueId"',
        'messages.createdAt AS "lastTimeMessage"',
        'messages.content AS "latestMessage"',
        'messages.contentType AS "latestMessageContentType"',
        'joined_rooms2.*',
      ])
      .innerJoin(UserEntity, 'users', `users.id=joined_rooms2."userId"`)
      .innerJoin(UserEntity, 'users2', `users2.id=joined_rooms2."toUserId"`)
      .innerJoin(MessageEntity, 'messages', `messages.id=joined_rooms2."latestMessageId"`)
      .where(`users.id=${userId}`)
      .offset(offset)
      .limit(limit)
      .orderBy('messages.createdAt', orderDesc === 'ASC' ? 'ASC' : 'DESC');

    let searchQuery = text !== undefined ? text?.trim().replace(/ /g, ' & ') : text;
    if (searchQuery) {
      if (Number(searchQuery) > 0) {
        data.innerJoin(OrdersRoomEntity, 'orders_room', `orders_room."roomId"=joined_rooms2."roomId"`);
      }

      data.andWhere(
        new Brackets((sqb) => {
          sqb.where(
            new Brackets((sqb1) => {
              sqb1.where(`to_tsvector('simple', users2."userName") @@ to_tsquery('simple', :userName)`, {
                userName: `${searchQuery}:*`,
              });
              sqb1.orWhere(`RIGHT(LOWER(users2."userName"), ${searchQuery.length}) = :searchQuery`, {
                searchQuery: searchQuery.toLowerCase(),
              });

              if (Number(searchQuery) > 0) {
                sqb1.orWhere(`to_tsvector('simple', orders_room."orderId") @@ to_tsquery('simple', :orderId)`, {
                  orderId: `${searchQuery}:*`,
                });

                sqb1.orWhere(`RIGHT(orders_room."orderId", ${searchQuery.length}) = :searchQuery`, {
                  searchQuery,
                });
              }
            }),
          );
        }),
      );
    }

    return await data.getRawMany();
  }

  async getConversationsByAdmin(
    userId: number,
    roleId: number,
    offset: number = OFFSET_DEFAULT,
    limit: number = LIMIT_DEFAULT,
    orderBy: string = 'joined_rooms.id',
    orderDesc: string = ORDER_DESC_DEFAULT,
    text: string = null,
  ) {
    const fromQueryBuilder = await this._repository
      .createQueryBuilder('joined_rooms')
      .select([
        'MAX("id") as "id", "roomId"',
        'MAX("userId") as "userId"',
        'MAX("latestMessageId") as "latestMessageId"',
        'MAX("countUnread") as "countUnread"',
        'MAX("role") as "role"',
        'MAX("toUserId") as "toUserId"',
      ])
      .where('role=1')
      .andWhere(`"userId"=${userId}`)
      .offset(offset)
      .limit(limit)
      .groupBy(`"roomId"`);

    let data = await getConnection()
      .createQueryBuilder()
      .from('(' + fromQueryBuilder.getQuery() + ')', 'joined_rooms2')
      .select([
        'users.userName AS "fromUserName"',
        'users.mobilePhone AS "fromMobilePhone"',
        'users.roleId AS "fromRoleId"',
        'users2.userName AS "toUserName"',
        'users2.mobilePhone AS "toMobilePhone"',
        'users2.roleId AS "toRoleId"',
        'messages.createdAt AS "lastTimeMessage"',
        'messages.content AS "latestMessage"',
        'messages.contentType AS "latestMessageContentType"',
        'joined_rooms2.*',
      ])
      .innerJoin(UserEntity, 'users', `users.id=joined_rooms2."userId"`)
      .innerJoin(UserEntity, 'users2', `users2.id=joined_rooms2."toUserId"`)
      .innerJoin(MessageEntity, 'messages', `messages.id=joined_rooms2."latestMessageId"`)
      .orderBy('messages.createdAt', orderDesc === 'ASC' ? 'ASC' : 'DESC');

    let searchQuery = text !== undefined ? text?.trim().replace(/ /g, ' & ') : text;
    if (searchQuery) {
      data.andWhere(
        new Brackets((sqb) => {
          sqb.where(
            new Brackets((sqb1) => {
              sqb1.where(`to_tsvector('simple', users2."userName") @@ to_tsquery('simple', :userName)`, {
                userName: `${searchQuery}:*`,
              });
              sqb1.orWhere(`RIGHT(LOWER(users2."userName"), ${searchQuery.length}) = :searchQuery`, {
                searchQuery: searchQuery.toLowerCase(),
              });
            }),
          );
        }),
      );
    }

    return await data.getRawMany();
  }

  async getCountUnreadByUser(userId: number, roleId: number) {
    const data = await this._repository
      .createQueryBuilder('joined_rooms')
      .select(['SUM(joined_rooms."countUnread") AS "countMessage"'])
      .where(`joined_rooms."userId"=${userId}`)
      .andWhere(`joined_rooms."role"=${roleId}`)
      .getRawOne();

    return data;
  }

  async getCountUnreadByRoom(roomId: number, userId: number, roleId: number) {
    const data = await this._repository
      .createQueryBuilder('joined_rooms')
      .select([
        'SUM(joined_rooms."countUnread") AS "countUnread"',
        `joined_rooms."userId"`,
        `joined_rooms."role" as "roleId"`,
        `joined_rooms."roomId" as "roomId"`,
      ])
      .where(`joined_rooms."roomId"=${roomId}`)
      .andWhere(`joined_rooms."userId"=${userId}`)
      .andWhere(`joined_rooms."role"=${roleId}`)
      .groupBy(`joined_rooms."userId"`)
      .addGroupBy(`joined_rooms."role"`)
      .addGroupBy(`joined_rooms."roomId"`)
      .getRawOne();

    return data
      ? { ...data, countunread: data.countUnread, roomid: data.roomId, roleid: data.roleId, userid: data.userId }
      : data;
  }

  async updateUnreadToRead(userId: number, roomId: number, countUnread: number = 0): Promise<any> {
    try {
      const joinedRoom = await this.findOne({ userId: userId, room: { id: roomId } });
      if (joinedRoom) {
        await this.save({ id: joinedRoom.id, countUnread });
      }
    } catch (e) {}
  }

  async updateLastMessageId(userId: number, roomId: number, messageId: number): Promise<any> {
    try {
      const joinedRooms = await this.find({ room: { id: roomId } });
      if (joinedRooms?.length) {
        for (let joinedRoom of joinedRooms) {
          await this.save({ id: joinedRoom.id, latestMessageId: messageId });
        }
      }
    } catch (e) {}
  }

  async getOfflineUser(fromUserId: number, roomId: number, onlineUserIds: any = []): Promise<any> {
    try {
      if (!onlineUserIds) {
        onlineUserIds = [];
      }
      onlineUserIds.push(fromUserId);
      let joinedRoomObj = await this._repository
        .createQueryBuilder('joined_rooms')
        .select([
          'users.userName AS "userName"',
          'users.mobilePhone AS "mobilePhone"',
          'users.roleId AS "roleId"',
          'joined_rooms.*',
        ])
        .innerJoin(UserEntity, 'users', `users.id=joined_rooms."userId"`)
        .where(`joined_rooms."roomId"=${roomId}`)
        .andWhere(`joined_rooms."userId" NOT IN(:...onlineUserIds)`, { onlineUserIds });
      return joinedRoomObj.getRawMany();
    } catch (e) {
      return null;
    }
  }

  async addAdminToRoom(user: UserEntity): Promise<any> {
    try {
      if (user.roleId != 1) {
        return false;
      }
      //Get joined rooms
      const joinedRooms = await this._repository
        .createQueryBuilder('joined_rooms')
        .select('DISTINCT("roomId") AS "roomId"')
        .where('role=1')
        .andWhere(`"userId"=${user.id}`)
        .getRawMany();

      let roomIds = [];
      if (joinedRooms) {
        for (const joinedRoom of joinedRooms) {
          roomIds.push((joinedRoom as any).roomId);
        }
      }

      const fromQueryBuilder = await this._repository
        .createQueryBuilder('joined_rooms')
        .select([
          'MAX("id") as "id", "roomId"',
          'MAX("userId") as "userId"',
          'MAX("latestMessageId") as "latestMessageId"',
          'MAX("countUnread") as "countUnread"',
          'MAX("role") as "role"',
          'MAX("toUserId") as "toUserId"',
          'MAX("toRole") as "toRole"',
        ])
        .where(`role=${RoleIdType.ADMIN}`)
        .groupBy(`"roomId"`);

      if (roomIds?.length) {
        fromQueryBuilder.andWhere(`joined_rooms."roomId" NOT IN(:...roomIds)`, { roomIds });
      }

      const roomNeedToInserts = await fromQueryBuilder.getRawMany();

      if (roomNeedToInserts) {
        for (const roomNeedToInsert of roomNeedToInserts) {
          try {
            const room = await this._roomService.findOne({ id: roomNeedToInsert.roomId });
            //insert
            const objJoinedRoom = new JoinedRoomEntity();
            objJoinedRoom.userId = user.id;
            objJoinedRoom.role = roomNeedToInsert.role;
            objJoinedRoom.room = room;
            objJoinedRoom.roomKey = room.roomKey;
            objJoinedRoom.toUserId = roomNeedToInsert.toUserId;
            objJoinedRoom.toRole = roomNeedToInsert.toRole;
            objJoinedRoom.countUnread = 0;
            objJoinedRoom.latestMessageId = roomNeedToInsert.latestMessageId;
            await this.save(objJoinedRoom); //Auto failed when duplicated data
          } catch (e) {}
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  async addOutletToRoom(user: UserEntity, userOutlet: UserEntity): Promise<any> {
    try {
      if (user.roleId != RoleIdType.OUTLET_OWNER) {
        return false;
      }
      //Get joined rooms
      const joinedRooms = await this._repository
        .createQueryBuilder('joined_rooms')
        .select('DISTINCT("roomId") AS "roomId"')
        .where(`role=${RoleIdType.OUTLET_OWNER}`)
        .andWhere(`"userId"=${user.id}`)
        .andWhere(`"toRole"=${RoleIdType.CONSUMER}`)
        .getRawMany();

      let roomIds = [];
      if (joinedRooms) {
        for (const joinedRoom of joinedRooms) {
          roomIds.push((joinedRoom as any).roomId);
        }
      }

      const fromQueryBuilder = await this._repository
        .createQueryBuilder('joined_rooms')
        .select([
          'MAX("id") as "id", "roomId"',
          'MAX("userId") as "userId"',
          'MAX("latestMessageId") as "latestMessageId"',
          'MAX("countUnread") as "countUnread"',
          'MAX("role") as "role"',
          'MAX("toUserId") as "toUserId"',
          'MAX("toRole") as "toRole"',
        ])
        .where(`role=${RoleIdType.OUTLET_OWNER}`)
        .andWhere(`"userId"=${userOutlet.id}`)
        .andWhere(`"toRole"=${RoleIdType.CONSUMER}`)
        .groupBy(`"roomId"`);

      if (roomIds?.length) {
        fromQueryBuilder.andWhere(`joined_rooms."roomId" NOT IN(:...roomIds)`, { roomIds });
      }

      const roomNeedToInserts = await fromQueryBuilder.getRawMany();

      if (roomNeedToInserts) {
        for (const roomNeedToInsert of roomNeedToInserts) {
          try {
            const room = await this._roomService.findOne({ id: roomNeedToInsert.roomId });
            //insert
            const objJoinedRoom = new JoinedRoomEntity();
            objJoinedRoom.userId = user.id;
            objJoinedRoom.role = roomNeedToInsert.role;
            objJoinedRoom.room = room;
            objJoinedRoom.roomKey = room.roomKey;
            objJoinedRoom.toUserId = roomNeedToInsert.toUserId;
            objJoinedRoom.toRole = roomNeedToInsert.toRole;
            objJoinedRoom.countUnread = 0;
            objJoinedRoom.latestMessageId = roomNeedToInsert.latestMessageId;
            await this.save(objJoinedRoom); //Auto failed when duplicated data
          } catch (e) {}
        }
      }
    } catch (e) {
      printLog(e);
    }
  }

  /**
   *
   * @param user ADMIN or OUTLET ORIGINAL
   * @param room
   */
  async updateMemberToRoom(user: UserEntity, room: RoomEntity, isRole: number): Promise<any> {
    try {
      if (user && room) {
        const joinedRoomCurrentUser = await this.findOne({ room: { id: room.id }, userId: user.id });
        if (isRole === RoleIdType.ADMIN || room.roomKey.indexOf('-admin') > -1) {
          //Admin support
          //Get all admin user
          const admins = await this._userService.find({ roleId: RoleIdType.ADMIN });
          if (admins) {
            for (const admin of admins) {
              try {
                //insert
                const objJoinedRoom = new JoinedRoomEntity();
                objJoinedRoom.userId = admin.id;
                objJoinedRoom.role = admin.roleId;
                objJoinedRoom.room = room;
                objJoinedRoom.roomKey = room.roomKey;
                objJoinedRoom.toUserId = joinedRoomCurrentUser.toUserId;
                objJoinedRoom.toRole = joinedRoomCurrentUser.toRole;
                objJoinedRoom.countUnread = 0;
                objJoinedRoom.latestMessageId = joinedRoomCurrentUser.latestMessageId;
                await this.save(objJoinedRoom); //Auto failed when duplicated data
              } catch (e) {
                //-----
              }
            }
          }
        } else {
          //Outlet Support
          //Get all outlet user
          const outletOwners = await this._userService.find({
            roleId: RoleIdType.OUTLET_OWNER,
            outletOwnerMobilePhone: user.mobilePhone,
          });

          if (outletOwners) {
            for (const outlet of outletOwners) {
              try {
                //insert
                const objJoinedRoom = new JoinedRoomEntity();
                objJoinedRoom.userId = outlet.id;
                objJoinedRoom.role = outlet.roleId;
                objJoinedRoom.room = room;
                objJoinedRoom.roomKey = room.roomKey;
                objJoinedRoom.toUserId = joinedRoomCurrentUser.toUserId;
                objJoinedRoom.toRole = joinedRoomCurrentUser.toRole;
                objJoinedRoom.countUnread = 0;
                objJoinedRoom.latestMessageId = joinedRoomCurrentUser.latestMessageId;
                await this.save(objJoinedRoom); //Auto failed when duplicated data
              } catch (e) {
                //-----
              }
            }
          }
        }
      }
    } catch (e) {}
  }

  async addMemberToRoom(
    room: RoomEntity,
    joinRoomDTO: IJoinRoomDTO,
    fromUser: UserEntity,
    toUser: UserEntity,
  ): Promise<void> {
    await this.save({
      userId: fromUser.id,
      room,
      role: Number(joinRoomDTO.from.role),
      roomKey: room.roomKey,
      toUserId: toUser.id,
      toRole: toUser.roleId,
    });
    await this.save({
      userId: toUser.id,
      room,
      role: Number(joinRoomDTO.to.role),
      roomKey: room.roomKey,
      toUserId: fromUser.id,
      toRole: fromUser.roleId,
    });
  }
}
