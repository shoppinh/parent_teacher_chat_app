import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UMENU_USER_SEND_PUSH } from '../../../shared/constant/event.constant';
import { MessageSendPushEvent } from '../event/message.push.event';
import { printLog } from '../../../shared/util';
import * as moment from 'moment';

@Injectable()
export class MessageSendPushListener {
  @OnEvent(UMENU_USER_SEND_PUSH)
  handleMessageSendPushEvent(event: MessageSendPushEvent) {
    try {
      (async () => {
        const offlineUsers = await event.joinedRoomService.getOfflineUser(
          event.fromUserId,
          event.roomId,
          event.onlineUser,
        );

        let pushUsers = [];
        const currentTime = moment();
        const willPushDate = currentTime.subtract(Number(process.env.PN_DELAY_SECONDS), 'seconds');
        //update count unread
        try {
          if (offlineUsers?.length) {
            for (let offUser of offlineUsers) {
              let pushedAt = currentTime;
              if (offUser.pushedAt) {
                pushedAt = moment(new Date(offUser.pushedAt));
              }

              if (pushedAt <= willPushDate) {
                pushUsers.push(offUser);
                await event.joinedRoomService.save({
                  id: offUser.id,
                  countUnread: Number(offUser.countUnread) + 1,
                  pushedAt: currentTime.toDate(),
                });
              } else {
                await event.joinedRoomService.save({
                  id: offUser.id,
                  countUnread: Number(offUser.countUnread) + 1,
                });
              }
            }
          }
        } catch (e) {
          printLog(e);
        }

        //Send Push
        const usersNeedToPush = await event.msgService.usersNeedToPush(event.fromUserId, pushUsers);
        await event.msgService.pushNotificationToUmenuUser(usersNeedToPush, event.title, event.message, {
          fromUserId: event.fromUserId,
          roomId: event.roomId,
          menuGUID: event.menuGUID,
        });
      })();
    } catch (e) {
      printLog(e);
    }
  }
}
