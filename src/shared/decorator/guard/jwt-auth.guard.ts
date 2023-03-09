import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../../../auth/auth.service';

@Injectable()
export class JwtAuthGuard {
  constructor(private reflector: Reflector, private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();

      //Socket token
      let token = request.handshake?.query?.Authorization;
      if (!token) {
        //API token
        token =
          request.headers.authorization?.replace('Bearer', '')?.trim() || request.handshake?.headers?.authorization;
      }

      //Verify Token
      const decodedToken = this.authService.decodeJwt(token);
      if (!token || !decodedToken?.mobilePhone) {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  async activate(context: ExecutionContext): Promise<boolean> {
    return (await this.canActivate(context)) as any;
  }
}
