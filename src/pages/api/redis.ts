import { NextApiRequest, NextApiResponse } from 'next';
import { redisService } from '@/services/cache/redisService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, key, value, expiryTime } = req.body;

    if (!action || !key) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    switch (action) {
      case 'get':
        const result = await redisService.get(key);
        return res.status(200).json({ value: result });

      case 'set':
        if (value === undefined) {
          return res.status(400).json({ error: 'Missing value parameter for set action' });
        }
        await redisService.set(key, value, expiryTime);
        return res.status(200).json({ success: true });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Redis API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
