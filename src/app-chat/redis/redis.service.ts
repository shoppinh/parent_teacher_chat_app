import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { RedisKey } from '../../shared/constant/redis.constant';
import { ConnectedDeviceItem, RedisUMenuToken } from './redisType';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async saveUMenuLoginToken(token: string, refreshToken: string): Promise<any> {
    if (!token || !refreshToken) {
      return;
    }

    return await this.cacheManager.set<RedisUMenuToken>(RedisKey.UMENU_TOKENS, {
      token,
      refreshToken,
    });
  }

  async getUMenuLoginToken(): Promise<any> {
    return await this.cacheManager.get<RedisUMenuToken>(RedisKey.UMENU_TOKENS);
  }

  async addConnectedDevice(
    socketId: string,
    roomId: number,
    userId: number,
    roleId: number,
    mobilePhone: string,
  ): Promise<any> {
    if (!roomId) {
      return;
    }

    const roomKey = `${RedisKey.CONNECTED_DEVICE}_${roomId}`;

    return await new Promise(async (resolve, reject) => {
      try {
        let connectedDeviceCache = await this.cacheManager.get<ConnectedDeviceItem[]>(roomKey);
        const row = {
          socketId,
          mobilePhone,
          userId,
          roleId,
          roomId,
        };

        if (!connectedDeviceCache) {
          connectedDeviceCache = [];
          connectedDeviceCache.push(row);
        } else {
          const itemIndex = connectedDeviceCache.findIndex((c) => c.socketId === socketId);

          if (itemIndex >= 0) {
            connectedDeviceCache[itemIndex] = row;
          } else {
            connectedDeviceCache.push(row);
          }
        }

        resolve(await this.cacheManager.set<ConnectedDeviceItem[]>(roomKey, connectedDeviceCache));
      } catch (e) {
        console.log(e);
        reject(-1);
      }
    });
  }

  /**
   * Remove connected device
   * @param socketId
   * @param roomId default 0, remove from all room
   */
  async removeConnectedDevice(socketId: string, roomId: number = 0): Promise<any> {
    return await new Promise(async (resolve, reject) => {
      try {
        if (!roomId) {
          return;
        }

        const roomKey = `${RedisKey.CONNECTED_DEVICE}_${roomId}`;
        let delIndex;
        const connectedDevices = await this.cacheManager.get<ConnectedDeviceItem[]>(roomKey);
        if (!connectedDevices) {
          return;
        }

        delIndex = connectedDevices.findIndex((c) => c.socketId === socketId);
        if (delIndex >= 0) {
          connectedDevices.splice(delIndex, 1);
        }

        resolve(await this.cacheManager.set(roomKey, connectedDevices));
      } catch (e) {
        console.log(e);
        reject(-1);
      }
    });
  }

  async getConnectedDeviceByRoomId(roomId: number, socketId: string, userId: number = 0): Promise<any> {
    if (!roomId) {
      return null;
    }

    const roomKey = `${RedisKey.CONNECTED_DEVICE}_${roomId}`;
    const connectedDeviceCache = await this.cacheManager.get<ConnectedDeviceItem[]>(roomKey);

    if (!connectedDeviceCache || !connectedDeviceCache.length) {
      return null;
    }
    return connectedDeviceCache.filter((c) => c.socketId !== socketId);
  }
}
