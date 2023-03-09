const fs = require('fs');
const isDevelop = !['production', 'qa', 'acc'].includes(process.env.NODE_ENV);
module.exports = {
  type: 'postgres',
  host: process.env.TWM_POSTGRES_HOST,
  port: process.env.TWM_POSTGRES_PORT,
  username: process.env.TWM_POSTGRES_USER,
  password: process.env.TWM_POSTGRES_PASSWORD,
  database: process.env.TWM_POSTGRES_DATABASE,
  entities: process.env.MIGRATION_MODE === 'true' ? ['**/*.entity.ts'] : ['**/*.entity.js'],
  ssl: isDevelop
    ? false
    : { rejectUnauthorized: true, ca: fs.readFileSync(process.env.TWM_POSTGRES_CERT_PATH).toString() },
  synchronize: isDevelop,
  migrations: ['migrations/db/*.js'],
  migrationsTableName: 'migrations',
  cli: {
    migrationsDir: 'migrations/db',
  },
  cache: {
    type: 'redis',
    options: {
      host: process.env.TWM_REDIS_HOST,
      port: process.env.TWM_REDIS_PORT,
      auth_pass: process.env.TWM_REDIS_PASSWORD,
      password: process.env.TWM_REDIS_PASSWORD,
      // tls:{
      //   host: process.env.REDIS_HOST
      // },
    },
    ignoreErrors: true,
  },
};
