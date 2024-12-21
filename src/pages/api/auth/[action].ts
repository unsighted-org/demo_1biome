import { redisService } from '@/services/cache/redisService';

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (!redisService) {
    return res.status(500).json({ error: 'Redis service not initialized' });
  }

  switch (req.query.action) {
    case 'storeToken':
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
      }
      try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }

        const session = await redisService.getSession(token);
        await redisService.setSession(token, session, 'EX', 60 * 60 * 24 * 7); // expires in 7 days
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
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }

        await redisService.deleteSession(token);
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
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }

        const session = await redisService.getSession(token);
        res.status(200).json({ token, session });
      } catch (error) {
        console.error('Error getting token:', error);
        res.status(500).json({ error: 'Failed to get token' });
      }
      break;

    default:
      res.status(404).json({ error: 'Not Found' });
  }
}