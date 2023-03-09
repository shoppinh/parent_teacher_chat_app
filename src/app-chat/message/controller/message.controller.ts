import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiResponse } from 'src/shared/response/api-response';
import { MessageService } from '../service/message.service';
import { PaginationParams } from '../../../shared/param/pagination.params';
import { OrderParams } from '../../../shared/param/order.params';
import { JwtAuthGuard } from '../../../shared/decorator/guard/jwt-auth.guard';
import { ApiBadRequestResponse, ApiBearerAuth, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { ApiException } from '../../../shared/api-exception.model';
import { UMenuService } from '../../umenu/service/umenu.service';
import { GetConversationsDto } from '../dto/get-conversations.dto';
import { IJoinRoomDTO } from '../../room/model/joinRoomDTO';
import { RoomService } from '../../room/service/room.service';
import { JoinedRoomService } from '../../room/service/joined-room.service';
import { OrdersRoomService } from '../../room/service/orders-room.service';
import { MESSAGE_SAVE } from '../../../shared/constant/event.constant';
import { MessageEvent } from '../event/message.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserSync } from '../model/user-sync';
import { UserService } from '../../user/service/user.service';
import { RoleIdType } from '../../../shared/constant/role.constant';
import { I18n, I18nContext } from 'nestjs-i18n';

@Controller('api/message')
@ApiHeader({ name: 'locale', description: 'en' })
@ApiBearerAuth()
@ApiBadRequestResponse({ type: ApiException })
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private umenuService: UMenuService,
    private roomService: RoomService,
    private joinedRoomService: JoinedRoomService,
    private orderRoomService: OrdersRoomService,
    private userService: UserService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Get('get-conversation/:mobilePhone/:roleId')
  @ApiOperation({
    summary: 'Get conversation list of user',
    description: 'Get conversation list of user',
    tags: ['Two ways message'],
  })
  async getConversations(
    @Param('mobilePhone') mobilePhone: string,
    @Param('roleId') roleId: number,
    @Query() getConversationsDto: GetConversationsDto,
    @Query() { offset, limit }: PaginationParams,
    @Query() { orderBy, orderDesc }: OrderParams,
  ): Promise<any> {
    try {
      const data = await this.messageService.findConversations(
        mobilePhone,
        roleId,
        offset,
        limit,
        orderBy,
        orderDesc,
        getConversationsDto.text,
      );
      return new ApiResponse(data);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('get-conversation/detail/:roomId')
  @ApiOperation({
    summary: 'Get conversation detail of user',
    description: 'Get conversation detail of user',
    tags: ['Two ways message'],
  })
  async getConversationDetail(
    @Param('roomId') roomId: number,
    @Query('startMessageId') startMessageId: number,
    @Query() { offset, limit }: PaginationParams,
    @Query() { orderBy, orderDesc }: OrderParams,
  ): Promise<any> {
    try {
      const data = await this.messageService.findConversationDetail(
        roomId,
        offset,
        limit,
        orderBy,
        orderDesc,
        startMessageId,
      );
      return new ApiResponse(data);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({
    summary: 'Get count unread message of a user',
    description: 'Get count unread message of a user',
    tags: ['Two ways message'],
  })
  @Get('count/unread/user/:mobilePhone/:roleId')
  async getConversationCountUnreadUser(
    @Param('mobilePhone') mobilePhone: string,
    @Param('roleId') roleId: number,
    @I18n() i18n: I18nContext,
  ): Promise<any> {
    try {
      const message = await this.messageService.findConversationCountUnreadUser(mobilePhone, roleId);
      const notification = await this.umenuService.findNotificationCountUnreadUser(
        mobilePhone,
        roleId,
        i18n.detectedLanguage,
      );

      return new ApiResponse({
        countNotification: notification?.countNotification || 0,
        countMessage: Number(message?.countMessage) || 0,
      });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('count/unread/room/:fromMobilePhone/:fromRoleId/:toMobilePhone/:toRoleId')
  @ApiOperation({
    summary: 'Get count unread message of a room',
    description: 'Get count unread message of a room',
    tags: ['Two ways message'],
  })
  async getConversationCountUnreadRoom(
    @Param('fromMobilePhone') fromMobilePhone: string,
    @Param('toMobilePhone') toMobilePhone: string,
    @Param('fromRoleId') fromRoleId: number,
    @Param('toRoleId') toRoleId: number,
  ): Promise<any> {
    try {
      const data = await this.messageService.findConversationCountUnreadRoom(
        fromMobilePhone,
        fromRoleId,
        toMobilePhone,
        toRoleId,
      );
      return new ApiResponse(data);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Version('2')
  @Get('count/unread/room/:fromMobilePhone/:fromRoleId/:toMobilePhone/:toRoleId')
  @ApiOperation({
    summary: 'Get count unread message of a room V2',
    description: 'Get count unread message of a room V2',
    tags: ['Two ways message'],
  })
  async getConversationCountUnreadRoomV2(
    @Param('fromMobilePhone') fromMobilePhone: string,
    @Param('toMobilePhone') toMobilePhone: string,
    @Param('fromRoleId') fromRoleId: number,
    @Param('toRoleId') toRoleId: number,
  ): Promise<any> {
    try {
      const data = await this.messageService.findConversationCountUnreadRoom(
        fromMobilePhone,
        fromRoleId,
        toMobilePhone,
        toRoleId,
      );
      return new ApiResponse([data]);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('order-chat')
  @ApiOperation({
    summary: 'Make an order chat auto',
    description: 'Make an order chat auto',
    tags: ['Two ways message'],
  })
  async orderConsumerAutoChat(@Body() joinRoomDTO: IJoinRoomDTO): Promise<any> {
    try {
      if (
        !joinRoomDTO.from?.role ||
        !joinRoomDTO.from?.mobilePhone ||
        (!joinRoomDTO?.roomId && !joinRoomDTO.to?.role)
      ) {
        throw new HttpException('Data is invalid', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const room = await this.roomService.getRoomFromJoinDTO(joinRoomDTO);

      if (!room?.id) {
        //Emit to me
        throw new HttpException('Data is invalid', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      //Joined room
      await this.joinedRoomService.updateUnreadToRead(room.fromUser.id, room.id);

      //Order Room
      await this.orderRoomService.saveOrderRoom(joinRoomDTO.orderId, room.id);

      //Event save message
      const createdAt = new Date();
      this.eventEmitter.emit(
        MESSAGE_SAVE,
        new MessageEvent({
          content: joinRoomDTO.orderId,
          roomId: room.id,
          userId: room.fromUser.id,
          contentType: 'order',
          menuGUID: joinRoomDTO.from?.menuGUID,
          createdAt,
          msgService: this.messageService,
          joinedRoomService: this.joinedRoomService,
        }),
      );

      setTimeout(() => {
        this.eventEmitter.emit(
          MESSAGE_SAVE,
          new MessageEvent({
            content: joinRoomDTO.from?.message,
            roomId: room.id,
            userId: room.fromUser.id,
            contentType: 'text',
            menuGUID: joinRoomDTO.from?.menuGUID,
            createdAt: new Date(),
            msgService: this.messageService,
            joinedRoomService: this.joinedRoomService,
          }),
        );
      }, 1500);

      return new ApiResponse(joinRoomDTO);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('user-chat')
  @ApiOperation({
    summary: 'Make an sync to chat data auto',
    description: 'Make an sync to chat data auto',
    tags: ['Two ways message'],
  })
  async userSyncAutoChat(@Body() userSyncDTO: UserSync): Promise<any> {
    try {
      if (!userSyncDTO || !userSyncDTO.token) {
        throw new HttpException('Data is invalid', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const saveUser = await this.userService.saveUserFromUMenu(userSyncDTO);

      if (Number(saveUser.user.roleId) === RoleIdType.OUTLET_OWNER && saveUser.user.outletOwnerMobilePhone) {
        //Add to joined room if role is Outlet manager
        await this.joinedRoomService.addOutletToRoom(saveUser.user, saveUser.userOutlet);
      } else if (Number(saveUser.user.roleId) === RoleIdType.ADMIN) {
        //Add to joined room if role is Admin
        await this.joinedRoomService.addAdminToRoom(saveUser.user);
      }

      return new ApiResponse(userSyncDTO);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
