import Redis from 'ioredis';

import { redisConfig } from './azureConfig';

let redis: Redis | null = null;

if (typeof window === 'undefined') {
  redis = new Redis({
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password,
    tls: redisConfig.tls ? {} : undefined,
  });
}

export default redis;