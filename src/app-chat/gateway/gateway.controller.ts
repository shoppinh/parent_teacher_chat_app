import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConnectedDeviceService } from 'src/app-chat/connected-device/service/connected-device.service';
import { AuthService } from 'src/auth/auth.service';
import { RoomService } from '../room/service/room.service';
import { IJoinRoomDTO } from 'src/app-chat/room/model/joinRoomDTO';
import { RedisService } from '../redis/redis.service';
import { MessageService } from '../message/service/message.service';
import { IMessageSend } from '../message/model/message-send';
import {
  JOIN_ROOM,
  LEAVE_ROOM,
  RECEIVE_MESSAGE,
  REGISTER_DEVICE,
  REGISTER_DEVICE_RESPONSE,
  ROOM,
  SEND_MESSAGE,
} from '../../shared/constant/message.constant';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/decorator/guard/jwt-auth.guard';
import { ConnectedDeviceEntity } from '../connected-device/entity/connected-device.entity';
import { UserService } from '../user/service/user.service';
import { UMenuService } from '../umenu/service/umenu.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MESSAGE_SAVE, UMENU_USER_SEND_PUSH, UPDATE_MEMBER_TO_ROOM } from '../../shared/constant/event.constant';
import { MessageEvent } from '../message/event/message.event';
import { MessageSendPushEvent } from '../message/event/message.push.event';
import { JoinedRoomService } from '../room/service/joined-room.service';
import { OrdersRoomService } from '../room/service/orders-room.service';
import { printLog } from '../../shared/util';
import { RoomJoinedEvent } from '../message/event/room-joined.event';
import { RoleIdType } from '../../shared/constant/role.constant';
import { iMessageContentType } from '../message/model/message-content-type';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@UseGuards(JwtAuthGuard)
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private roomService: RoomService,
    private connectedDeviceService: ConnectedDeviceService,
    private authService: AuthService,
    private redisService: RedisService,
    private messageService: MessageService,
    private joinedRoomService: JoinedRoomService,
    private orderRoomService: OrdersRoomService,
    private userService: UserService,
    private umenuService: UMenuService,
    private eventEmitter: EventEmitter2,
  ) {}

  async afterInit(socket: Socket, ...args: any[]) {
    try {
      await this.umenuService.login();
      await this.umenuService.syncUser();
    } catch (e) {
      printLog(e);
    }
  }

  async handleConnection(socket: Socket, ...args: any[]): Promise<WsResponse<unknown>> {
    printLog('connect', socket.id);

    try {
      this.server.to(socket.id).emit('connected', { id: socket.id, message: 'connected' });

      return null;
    } catch (error) {
      socket.disconnect();
      return null;
    }
  }

  async handleDisconnect(socket: Socket) {
    printLog('disconnect', socket.id);

    try {
      await this.removeConnectedUser(socket.id);
      socket.disconnect();
    } catch (e) {
      printLog(e);
    }
  }

  @SubscribeMessage(SEND_MESSAGE)
  async listenForMessages(socket: Socket, message: IMessageSend) {
    try {
      if (!message || !message.roomId || !message.content?.toString()?.trim()) {
        return;
      }

      const createdAt = new Date();
      message.createdAt = createdAt;

      //Event save message
      this.eventEmitter.emit(
        MESSAGE_SAVE,
        new MessageEvent({
          content: message.content,
          roomId: message.roomId,
          userId: message.fromUser.id,
          contentType: message.contentType,
          menuGUID: message.menuGUID,
          createdAt: createdAt,
          msgService: this.messageService,
          joinedRoomService: this.joinedRoomService,
        }),
      );
      //Emit to Devices
      const connectedDevices = await this.connectedDeviceService.getConnectedDevices(
        message.fromUser.id,
        message.fromUser.roleId,
        socket.id,
        message.roomId,
      );
      if (connectedDevices && connectedDevices.length) {
        const devices = connectedDevices.map(d => d.socketId);
        this.server.to(devices).emit(RECEIVE_MESSAGE, message);
      }

      //Event Send push when user offline
      if (message.contentType !== iMessageContentType.ORDER) {
        this.eventEmitter.emit(
          UMENU_USER_SEND_PUSH,
          new MessageSendPushEvent({
            roomId: message.roomId,
            title: message.fromUser.userName,
            message: message.content,
            menuGUID: message.menuGUID,
            mobilePhone: message.fromUser.mobilePhone,
            fromUserId: message.fromUser.id,
            onlineUser: connectedDevices?.map((c) => c.userId),
            msgService: this.messageService,
            joinedRoomService: this.joinedRoomService,
          }),
        );
      }

      //Send to me
      this.server.to(socket.id).emit(RECEIVE_MESSAGE, message);
    } catch (e) {
      printLog(e);
    }
  }

  @SubscribeMessage(JOIN_ROOM)
  async onJoinRoom(socket: Socket, joinRoomDTO: IJoinRoomDTO) {
    try {
      if (
        !joinRoomDTO.from?.role ||
        !joinRoomDTO.from?.mobilePhone ||
        (!joinRoomDTO?.roomId && !joinRoomDTO.to?.role)
      ) {
        return this.server.to(socket.id).emit(ROOM, {
          message: 'Cannot create room: input invalid',
          joinRoomDTO,
        });
      }

      let room;
      if (joinRoomDTO?.roomId) {
        room = await this.roomService.findById(joinRoomDTO);
      } else {
        room = await this.roomService.getRoomFromJoinDTO(joinRoomDTO);
      }

      if (!room?.id) {
        //Emit to me
        return this.server.to(socket.id).emit(ROOM, { message: 'Cannot create room: room is null', joinRoomDTO });
      }

      //Joined room
      await this.joinedRoomService.updateUnreadToRead(room.fromUser.id, room.id);

      //Update roomId to connected device
      await this.connectedDeviceService.updateRoomToMyDevice(socket.id, room.id);

      const toDevices = await this.connectedDeviceService.find({
        mobilePhone: room.toUser.mobilePhone,
        roleId: room.toUser.role,
      });
      await this.redisService.addConnectedDevice(
        socket.id,
        room.id,
        room.fromUser.id,
        room.fromUser.roleId,
        room.fromUser.mobilePhone,
      );

      //Emit to toDevices
      if (toDevices?.length) {
        for (const toDevice of toDevices) {
          this.server.to(toDevice.socketId).emit(ROOM, {
            ...room,
            fromUser: room.toUser,
            toUser: room.fromUser,
          });
          if (toDevice.roomId <= 0) {
            toDevice.roomId = room.id;
            await this.connectedDeviceService.save(toDevice);
          }
        }
      }

      //Order Room
      await this.orderRoomService.saveOrderRoom(joinRoomDTO.orderId, room.id);

      //Event Sync member to room
      let member = null,
        isRole;
      if (Number(room.fromUser.roleId) === RoleIdType.ADMIN || Number(room.toUser.roleId) === RoleIdType.ADMIN) {
        member = Number(room.fromUser.roleId) === RoleIdType.ADMIN ? room.fromUser : room.toUser;
        isRole = RoleIdType.ADMIN;
      } else {
        member =
          Number(room.fromUser.roleId) === RoleIdType.OUTLET_OWNER && !room.fromUser.outletOwnerMobilePhone?.toString()
            ? room.fromUser
            : room.toUser;
        isRole = RoleIdType.OUTLET_OWNER;
      }
      this.eventEmitter.emit(
        UPDATE_MEMBER_TO_ROOM,
        new RoomJoinedEvent({
          room: room,
          user: member,
          isRole,
          joinedRoomService: this.joinedRoomService,
        }),
      );

      //Emit to me
      return this.server.to(socket.id).emit(ROOM, room);
    } catch (e) {
      return this.server.to(socket.id).emit(ROOM, e);
    }
  }

  @SubscribeMessage(LEAVE_ROOM)
  async onLeaveRoom(socket: Socket, roomId: number) {
    //remove socket that connected to room
    await this.redisService.removeConnectedDevice(socket.id, roomId);
  }

  @SubscribeMessage(REGISTER_DEVICE)
  async onRegisterDevice(socket: Socket, data: any) {
    try {
      if (!data?.roleId || !data.mobilePhone) {
        return this.server.to(socket.id).emit(REGISTER_DEVICE_RESPONSE, {
          success: false,
          user: null,
          device: null,
        });
      }

      let user = await this.userService.findOne({
        mobilePhone: data.mobilePhone,
        roleId: data.roleId,
      });

      if (!user) {
        const uMenuUser = await this.userService.getUserFromUMenu(data.mobilePhone, data.roleId);
        if (!uMenuUser?.user) {
          return this.server.to(socket.id).emit(REGISTER_DEVICE_RESPONSE, {
            success: false,
            user: null,
            device: null,
            message: 'User not found',
          });
        }
        user = uMenuUser?.user;
      } else {
        user.lastLogin = new Date();
        user = await this.userService.save(user);
      }

      let device = await this.connectedDeviceService.findOne({
        socketId: socket.id,
      });
      if (!device) {
        device = new ConnectedDeviceEntity();
        device.socketId = socket.id;
        device.mobilePhone = data.mobilePhone;
        device.userId = user.id;
        device.roleId = data.roleId;
        device = await this.connectedDeviceService.save(device);
      }

      //Emit to me
      let success = !!(user && device);
      return this.server.to(socket.id).emit(REGISTER_DEVICE_RESPONSE, { success, user, device });
    } catch (e) {
      printLog(e);
    }
  }

  /*********************************************************************************************************/
  async removeConnectedUser(socketId: string) {
    try {
      //remove socketId from roomConnected in redis
      const device = await this.connectedDeviceService.findOne({ socketId });
      if (device) {
        await this.redisService.removeConnectedDevice(socketId, device.roomId);
        await this.connectedDeviceService.delete({ socketId });
        return true;
      }
    } catch (e) {
      printLog(e);
    }
  }
}
