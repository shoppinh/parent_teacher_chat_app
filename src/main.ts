import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VERSION_NEUTRAL, VersioningType } from '@nestjs/common';
import { RedisIoAdapter } from './shared/adapter/redis-io';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  app.useWebSocketAdapter(new RedisIoAdapter(app));

  app.enableVersioning({
    type: VersioningType.HEADER,
    header: 'version',
    defaultVersion: VERSION_NEUTRAL,
  });
  app.enableCors();
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('HNK UMenu Two Ways Message')
      .setDescription('HNK UMenu Two Ways Message API description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger', app, document);
  }

  const server = await app.listen(process.env.PORT, '0.0.0.0', () => {
    console.log('\x1b[33m%s\x1b[0m', `Server :: Running @ 'http://localhost:${process.env.PORT}'`);
    console.log('\x1b[33m%s\x1b[0m', `Swagger :: Running @ 'http://localhost:${process.env.PORT}/swagger'`);
  });
  server.setTimeout(Number(process.env.APP_TIME_OUT));
}

bootstrap();
