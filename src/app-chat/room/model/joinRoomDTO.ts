export interface IJoinRoomDTO {
  from?: IJoinRoomUserDTO;
  to?: IJoinRoomUserDTO;
  roomId?: number;
  orderId?: string;
}

export interface IJoinRoomUserDTO {
  mobilePhone?: string;
  userId?: number;
  role?: string;
  message?: string;
  menuGUID?: string;
}
