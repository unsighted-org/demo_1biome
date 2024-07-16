import Redis from 'ioredis';

import { redisConfig } from '@/config/azureConfig';

import type { NextApiRequest, NextApiResponse } from 'next';

const redis = new Redis({
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
  tls: redisConfig.tls ? {} : undefined,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method === 'POST') {
    try {
      const { action, key, value, expiryTime } = req.body;

      switch (action) {
        case 'get':
          const result = await redis.get(key);
          res.status(200).json({ value: result });
          break;
        case 'set':
          if (expiryTime) {
            await redis.setex(key, expiryTime, value);
          } else {
            await redis.set(key, value);
          }
          res.status(200).json({ success: true });
          break;
        default:
          res.status(400).json({ error: 'Invalid action' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Redis operation failed' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}