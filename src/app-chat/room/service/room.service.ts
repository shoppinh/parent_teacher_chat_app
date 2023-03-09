import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageService } from 'src/app-chat/message/service/message.service';
import { IJoinRoomDTO } from 'src/app-chat/room/model/joinRoomDTO';
import { BaseService } from 'src/shared/base.service';
import { Repository } from 'typeorm';
import { RoomEntity } from '../entity/room.entity';
import { JoinedRoomService } from './joined-room.service';
import { UserService } from '../../user/service/user.service';
import { JoinedRoomEntity } from '../entity/joined-room.entity';
import { RoleIdType } from '../../../shared/constant/role.constant';

@Injectable()
export class RoomService extends BaseService<RoomEntity> {
  constructor(
    @InjectRepository(RoomEntity)
    private readonly _roomRepository: Repository<RoomEntity>,
    private readonly messageService: MessageService,
    private readonly joinedRoomService: JoinedRoomService,
    private readonly userService: UserService,
  ) {
    super();
    this._repository = this._roomRepository;
  }

  /**
   * Consumer with outlet: ConsumerPhone_5-OutletPhone_2
   * Admin with outlet: OutletPhone_2-AdminPhone_1
   * @param joinRoomDTO
   */
  getRoomKey(joinRoomDTO: IJoinRoomDTO) {
    if (!joinRoomDTO.from || !joinRoomDTO.to) {
      return;
    }

    const startKey = `${joinRoomDTO.from.mobilePhone}_${joinRoomDTO.from.role}`;
    const startKeyAdmin = `admin_${joinRoomDTO.from.role}`;
    const endKey = `${joinRoomDTO.to.mobilePhone}_${joinRoomDTO.to.role}`;
    const endKeyAdmin = `admin_${joinRoomDTO.to.role}`;

    if (Number(joinRoomDTO.from.role) > Number(joinRoomDTO.to.role)) {
      return Number(joinRoomDTO.to.role) === RoleIdType.ADMIN ? `${startKey}-${endKeyAdmin}` : `${startKey}-${endKey}`;
    }
    return Number(joinRoomDTO.from.role) === RoleIdType.ADMIN ? `${endKey}-${startKeyAdmin}` : `${endKey}-${startKey}`;
  }

  getRoomKeyByItems(fromMobilePhone: string, fromRoleId: number, toMobilePhone: string, toRoleId: number) {
    if (!fromMobilePhone || !toMobilePhone) {
      return;
    }

    if (Number(fromRoleId) > Number(toRoleId)) {
      return `${fromMobilePhone}_${fromRoleId}-${toMobilePhone}_${toRoleId}`.toLowerCase();
    }
    return `${toMobilePhone}_${toRoleId}-${fromMobilePhone}_${fromRoleId}`.toLowerCase();
  }

  async findByRoomKey(roomKey: string) {
    return await this.findOne({ roomKey });
  }

  async findById(joinRoomDTO: IJoinRoomDTO) {
    const room = await this.findOne({ id: joinRoomDTO?.roomId });

    //from user
    const fromUser = await this.userService.findOne({
      mobilePhone: joinRoomDTO.from.mobilePhone,
      roleId: joinRoomDTO.from.role,
    });

    if (!fromUser) {
      return;
    }

    //to user
    let toUser = null;
    try {
      //get from mobilePhone and role
      if (joinRoomDTO.to?.mobilePhone && joinRoomDTO.to?.role) {
        toUser = await this.userService.findOne({
          mobilePhone: joinRoomDTO.to?.mobilePhone,
          roleId: joinRoomDTO.to?.role,
        });
      }

      //get from joined room
      if (!toUser) {
        const checkAnotherJoinedRoom = await this.joinedRoomService.findOne({
          room: { id: room.id },
          role: joinRoomDTO.from.role,
        });
        if (checkAnotherJoinedRoom) {
          toUser = await this.userService.findOne({ id: checkAnotherJoinedRoom.toUserId });
        }
      }

      //or get from fromUser - can not to this action i think :)
      if (!toUser) {
        const fromJoinedRoom = await this.joinedRoomService.findOne({ room: { id: room.id }, userId: fromUser.id });
        if (fromJoinedRoom) {
          toUser = await this.userService.findOne({ id: fromJoinedRoom.toUserId });
        }
      }
    } catch (e) {}

    if (!toUser) {
      return;
    }

    const toUserId = toUser?.id;

    //Check user existed in room?: if NOT YET => Add to room
    let joinedRoom = await this.joinedRoomService.findOne({ userId: fromUser.id, room: { id: room.id } });
    if (joinedRoom) {
      joinedRoom.toUserId = toUserId;
      joinedRoom.countUnread = 0;
    } else {
      joinedRoom = new JoinedRoomEntity();
      joinedRoom.userId = fromUser.id;
      joinedRoom.role = fromUser.roleId;
      joinedRoom.roomKey = room.roomKey;
      joinedRoom.room = room;
      joinedRoom.toUserId = toUserId;
      joinedRoom.toRole = toUser.roleId;
    }
    await this.joinedRoomService.save(joinedRoom);

    return { ...room, fromUser, toUser };
  }

  async getRoomFromJoinDTO(joinRoomDTO: IJoinRoomDTO): Promise<any> {
    try {
      //from user
      const fromUser = await this.userService.findOne({
        mobilePhone: joinRoomDTO.from.mobilePhone,
        roleId: joinRoomDTO.from.role,
      });

      //to user
      let toUser = await this.userService.findOne({
        mobilePhone: joinRoomDTO.to?.mobilePhone,
        roleId: joinRoomDTO.to.role,
      });

      if (!fromUser || (Number(joinRoomDTO.to.role) !== RoleIdType.ADMIN && !joinRoomDTO.to?.mobilePhone)) {
        return;
      }

      let outletOriginUser = null;
      if (
        Number(fromUser.roleId) === RoleIdType.OUTLET_OWNER &&
        fromUser.outletOwnerMobilePhone &&
        Number(joinRoomDTO.to.role) !== RoleIdType.ADMIN
      ) {
        joinRoomDTO.from.mobilePhone = fromUser.outletOwnerMobilePhone;
        outletOriginUser = await this.userService.findOne({
          mobilePhone: fromUser.outletOwnerMobilePhone,
          roleId: fromUser.roleId,
        });
      }
      if (
        Number(toUser?.roleId) === RoleIdType.OUTLET_OWNER &&
        toUser?.outletOwnerMobilePhone &&
        Number(fromUser.roleId) === RoleIdType.CONSUMER
      ) {
        joinRoomDTO.to.mobilePhone = toUser.outletOwnerMobilePhone;
      }
      const roomKey = this.getRoomKey(joinRoomDTO);
      if (!roomKey) {
        return;
      }

      if (!toUser) {
        if (Number(joinRoomDTO.to.role) === RoleIdType.ADMIN) {
          toUser = await this.userService.findOne({
            mobilePhone: process.env.UMENU_API_ADMIN_USER,
            roleId: joinRoomDTO.to.role,
          });
        }

        if (!toUser) {
          //Create a new user with mobilePhone and roleId
          const uMenuUser = await this.userService.getUserFromUMenu(
            joinRoomDTO.to?.mobilePhone || process.env.UMENU_API_ADMIN_USER,
            Number(joinRoomDTO.to.role),
          );
          toUser = uMenuUser?.user;
        }
      }

      //return if exist
      const existRoom = await this.findOne({ roomKey: roomKey.trim() });
      if (existRoom) {
        return { ...existRoom, fromUser, toUser };
      }

      //create new if not exists
      const room = new RoomEntity();
      room.roomKey = roomKey;
      const newRoom = await this.save(room);
      await this.joinedRoomService.addMemberToRoom(
        newRoom,
        joinRoomDTO,
        outletOriginUser ? outletOriginUser : fromUser,
        toUser,
      );

      /**
       * Check user existed in room?: if NOT YET => Add to room: and now outlet owner has been joined to room but outlet manager is not yet
       */
      if (outletOriginUser) {
        let joinedRoom = await this.joinedRoomService.findOne({ userId: fromUser.id, room: { id: newRoom.id } });
        if (joinedRoom) {
          joinedRoom.toUserId = toUser.id;
          joinedRoom.countUnread = 0;
        } else {
          joinedRoom = new JoinedRoomEntity();
          joinedRoom.userId = fromUser.id;
          joinedRoom.role = fromUser.roleId;
          joinedRoom.roomKey = newRoom.roomKey;
          joinedRoom.room = newRoom;
          joinedRoom.toUserId = toUser.id;
          joinedRoom.toRole = toUser.roleId;
        }
        await this.joinedRoomService.save(joinedRoom);
      }

      return { ...room, fromUser, toUser };
    } catch (e) {
      return null;
    }
  }
}
