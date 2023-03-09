import { CacheModule, Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './app-chat/app-chat.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UMenuModule } from './app-chat/umenu/umenu.module';
import { HttpModule } from '@nestjs/axios';
import * as redisStore from 'cache-manager-redis-store';
import { RoomModule } from './app-chat/room/room.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { HttpExceptionFilter } from './shared/response/http-exception.filter';
import { MessageModule } from './app-chat/message/message.module';
import { AppInterceptor } from './shared/interceptor/app.interceptor';
import { JwtAuthGuard } from './shared/decorator/guard/jwt-auth.guard';
import { AuthModule } from './auth/auth.module';
import * as path from 'path';
import { HeaderResolver, I18nJsonParser, I18nModule } from 'nestjs-i18n';
import ormConfig from './ormconfig';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [ormConfig],
    }),
    TypeOrmModule.forRoot(ormConfig()),
    I18nModule.forRoot({
      fallbackLanguage: 'vi',
      parser: I18nJsonParser,
      parserOptions: {
        path: path.join(__dirname, '/i18n/'),
      },
      resolvers: [new HeaderResolver(['locale'])],
    }),
    AuthModule,
    ChatModule,
    UMenuModule,
    HttpModule,
    RoomModule,
    MessageModule,
    EventEmitterModule.forRoot(),
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: process.env.TWM_REDIS_HOST,
      port: process.env.TWM_REDIS_PORT,
      auth_pass: process.env.TWM_REDIS_PASSWORD,
      password: process.env.TWM_REDIS_PASSWORD,
      // tls:{
      //   host: process.env.REDIS_HOST
      // },
      ttl: Number(process.env.TWM_REDIS_TTL),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AppInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({}),
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
