import { IoAdapter } from '@nestjs/platform-socket.io';
import { RedisClient } from 'redis';
import { ServerOptions } from 'socket.io';
import { createAdapter } from 'socket.io-redis';

const pubClient = new RedisClient({
  host: process.env.TWM_REDIS_HOST,
  port: process.env.TWM_REDIS_PORT,
  auth_pass: process.env.TWM_REDIS_PASSWORD,
  password: process.env.TWM_REDIS_PASSWORD,
});
const subClient = pubClient.duplicate();
const redisAdapter = createAdapter({ pubClient, subClient });

export class RedisIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(redisAdapter);
    return server;
  }
}
