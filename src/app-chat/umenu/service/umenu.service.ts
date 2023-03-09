import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ApiClientService } from './api.client.service';
import { RedisService } from '../../redis/redis.service';
import { RedisUMenuToken } from '../../redis/redisType';
import { RoleIdType } from '../../../shared/constant/role.constant';
import { EXPIRED_TOKEN } from '../../../shared/constant/message.constant';
import { UMenuUserType } from '../../user/type';
import { printLog } from '../../../shared/util';
import {
  UMENU_API_CONSUMER,
  UMENU_API_CONSUMER_REFRESH_TOKEN,
  UMENU_API_NOTIFICATION_UNREAD,
  UMENU_API_PUSH_NOTIFICATION_TO_USER,
  UMENU_API_USER,
  UMENU_API_USER_LOGIN,
  UMENU_API_USER_REFRESH_TOKEN,
} from '../../../shared/constant/umenu.constant';

@Injectable()
export class UMenuService {
  private refreshTokenCount = 0;

  constructor(private readonly _apiService: ApiClientService, private readonly _redisService: RedisService) {}

  async getUMenuLoginToken(): Promise<any> {
    const tokens = await this._redisService.getUMenuLoginToken();
    if (!tokens) {
      return await this.login();
    }
    return tokens;
  }

  async login(): Promise<any> {
    try {
      const user = await this._apiService.post(
        UMENU_API_USER_LOGIN,
        {
          username: process.env.UMENU_API_ADMIN_USER,
          password: process.env.UMENU_API_ADMIN_PASSWORD,
        },
        null,
        false,
      );

      return await this.parseUMenuResponse(user, async (response) => {
        const token = response.token;
        const refreshToken = response.refreshToken;
        await this._redisService.saveUMenuLoginToken(token, refreshToken);
      });
    } catch (e) {
      printLog('failed login', e);
    }
  }

  async refreshToken(token, refreshToken, roleId): Promise<any> {
    try {
      let tokenObj;
      if (Number(roleId) !== RoleIdType.CONSUMER) {
        tokenObj = await this._apiService.post(UMENU_API_USER_REFRESH_TOKEN, {
          token,
          refreshToken,
        });
      } else {
        tokenObj = await this._apiService.get(UMENU_API_CONSUMER_REFRESH_TOKEN, {
          token,
          refreshToken,
        });
      }
      return await this.parseUMenuResponse(tokenObj, async (response) => {
        const token = response.token;
        const refreshToken = response.refreshToken;
        await this._redisService.saveUMenuLoginToken(token, refreshToken);
      });
    } catch (e) {}
  }

  async getToken(): Promise<RedisUMenuToken> {
    return await this._redisService.getUMenuLoginToken();
  }

  async getUserByPhone(mobilePhone: string, roleId: number): Promise<UMenuUserType> {
    try {
      let user;
      //Outlet OR Admin
      if (Number(roleId) !== RoleIdType.CONSUMER) {
        user = await this._apiService.get(UMENU_API_USER + mobilePhone);
      } else {
        user = await this._apiService.get(UMENU_API_CONSUMER + mobilePhone);
      }

      return await this.parseUMenuResponse(user, async (response) => {
        //---
      });
    } catch (e) {}
  }

  async findNotificationCountUnreadUser(mobilePhone: string, roleId: number, lang: string): Promise<any> {
    try {
      await this._apiService.setLocale(lang);
      const data = await this._apiService.get(UMENU_API_NOTIFICATION_UNREAD + mobilePhone + '/' + roleId);
      return await this.parseUMenuResponse(data, async (response) => {
        //---
      });
    } catch (e) {
      return null;
    }
  }

  async parseUMenuResponse(response: any, callback: any = null): Promise<any> {
    if (response?.data?.status) {
      this.refreshTokenCount = 0;
      if (callback) {
        callback(response.data.data);
      }
      return response.data.data;
    } else {
      if (response.data?.error?.code === EXPIRED_TOKEN) {
        if (++this.refreshTokenCount > 3) {
          throw new HttpException(response.data.error.messages, HttpStatus.BAD_REQUEST);
        }
        const loginToken = await this.getToken();
        await this.refreshToken(loginToken.token, loginToken.refreshToken, 1);
        throw new HttpException(response.data.error.messages, HttpStatus.BAD_REQUEST);
      } else {
        throw new HttpException(response.data.error.messages, HttpStatus.BAD_REQUEST);
      }
    }
  }

  async pushNotificationToUmenuUser(
    offlineUsers: any = [],
    title: string,
    body: string,
    fromUser: any = null,
  ): Promise<any> {
    try {
      let response = await this._apiService.post(UMENU_API_PUSH_NOTIFICATION_TO_USER, {
        users: offlineUsers,
        title,
        body,
        messages: fromUser,
      });

      response = await this.parseUMenuResponse(response, async (response) => {
        //---
      });
      return response;
    } catch (e) {}
  }
}
