import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/shared/base.service';
import { Not, Repository } from 'typeorm';
import { ConnectedDeviceEntity } from '../entity/connected-device.entity';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class ConnectedDeviceService extends BaseService<ConnectedDeviceEntity> {
  constructor(
    @InjectRepository(ConnectedDeviceEntity)
    private readonly _connectedDeviceRepository: Repository<ConnectedDeviceEntity>,
    private redisService: RedisService,
  ) {
    super();
    this._repository = this._connectedDeviceRepository;
  }

  async findByRoomId(roomId): Promise<ConnectedDeviceEntity[]> {
    return this.find({ where: { roomId } });
  }

  async getConnectedDevices(userId: number, roleId: number, socketId: string, roomId: number): Promise<any> {
    if (!roomId) {
      return null;
    }
    const cache = await this.redisService.getConnectedDeviceByRoomId(roomId, socketId, userId);

    if (cache) {
      return cache;
    }
    return await this.find({
      roomId,
      socketId: Not(socketId),
    });
  }

  async updateRoomToMyDevice(socketId: string, roomId: number): Promise<ConnectedDeviceEntity> {
    const myDevice = await this.findOne({
      socketId,
    });
    //Save RoomId
    if (myDevice && myDevice.roomId <= 0) {
      myDevice.roomId = roomId;
      await this.save(myDevice);
    }
    return myDevice;
  }
}
