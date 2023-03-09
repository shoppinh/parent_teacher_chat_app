export interface RedisConnectedDevice {
  [roomId: number]: ConnectedDeviceItem[];
}

export interface ConnectedDeviceItem {
  socketId: string;
  mobilePhone: string;
  userId: number;
  roleId: number;
  roomId?: number;
}

export interface RedisUMenuToken {
  token: string;
  refreshToken: string;
}
