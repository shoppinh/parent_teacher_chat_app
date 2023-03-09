import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: async () => ({
        secret: process.env.JWT_PRIVATE_KEY,
        signOptions: { expiresIn: process.env.JWT_EXPIRED_TIME },
      }),
    }),
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
