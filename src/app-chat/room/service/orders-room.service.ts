import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/shared/base.service';
import { Repository } from 'typeorm';
import { RoomService } from './room.service';
import { OrdersRoomEntity } from '../entity/orders-room.entity';

@Injectable()
export class OrdersRoomService extends BaseService<OrdersRoomEntity> {
  constructor(
    @InjectRepository(OrdersRoomEntity)
    private readonly _ordersRoomRepository: Repository<OrdersRoomEntity>,
    @Inject(forwardRef(() => RoomService))
    private readonly _roomService: RoomService,
  ) {
    super();
    this._repository = this._ordersRoomRepository;
  }

  async saveOrderRoom(orderId: string, roomId: number): Promise<OrdersRoomEntity> {
    try {
      if (Number(orderId) > 0 && roomId > 0) {
        const checkOrderSaved = await this.findOne({ roomId, orderId });
        if (!checkOrderSaved) {
          return await this.save({
            roomId,
            orderId,
          });
        }
        return checkOrderSaved;
      }
    } catch (e) {
      return null;
    }
  }
}
