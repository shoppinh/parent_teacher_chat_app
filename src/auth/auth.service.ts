import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  verifyJwt(jwt: string): any {
    return this.jwtService.verify(jwt);
  }

  decodeJwt(jwt: string): any {
    return this.jwtService.decode(jwt);
  }
}
