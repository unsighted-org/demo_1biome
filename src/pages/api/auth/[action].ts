import redis from '@/config/redisConfig';

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (!redis) {
    return res.status(500).json({ error: 'Redis client not initialized' });
  }

  switch (req.query.action) {
    case 'storeToken':
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
      }
      try {
        const { userId, token } = req.body;
        await redis.set(`user:token:${userId}`, token, 'EX', 60 * 60 * 24 * 7); // expires in 7 days
        res.status(200).json({ message: 'Token stored successfully' });
      } catch (error) {
        console.error('Error storing token:', error);
        res.status(500).json({ error: 'Failed to store token' });
      }
      break;

    case 'removeToken':
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
      }
      try {
        const { userId } = req.body;
        await redis.del(`user:token:${userId}`);
        res.status(200).json({ message: 'Token removed successfully' });
      } catch (error) {
        console.error('Error removing token:', error);
        res.status(500).json({ error: 'Failed to remove token' });
      }
      break;

    case 'getToken':
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
      }
      try {
        const { userId } = req.query;
        const token = await redis.get(`user:token:${userId}`);
        res.status(200).json({ token });
      } catch (error) {
        console.error('Error getting token:', error);
        res.status(500).json({ error: 'Failed to get token' });
      }
      break;

    default:
      res.status(404).json({ error: 'Not Found' });
  }
}