import { redisService } from '@/services/cache/redisService';
import { verify } from 'jsonwebtoken';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const action = req.query.action as string;

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (action === '_log') {
    // Handle auth logging
    return res.status(200).json({ message: 'Logged' });
  }

  if (action === 'session') {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
      // Check for token in different places
      const token = 
        req.headers.authorization?.split(' ')[1] || 
        req.cookies?.token ||
        req.headers.cookie?.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1];

      if (!token) {
        // Return 401 but with empty session instead of error
        return res.status(401).json({ 
          session: null,
          user: null 
        });
      }

      // Verify JWT token
      try {
        const decoded = verify(token, process.env.JWT_SECRET!);
        return res.status(200).json({ 
          session: {
            user: decoded,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
          }
        });
      } catch (error) {
        // Return 401 but with empty session instead of error
        return res.status(401).json({ 
          session: null,
          user: null 
        });
      }
    } catch (error) {
      console.error('Session error:', error);
      return res.status(500).json({ error: 'Failed to get session' });
    }
  }

  // Handle other auth actions
  if (!redisService) {
    return res.status(500).json({ error: 'Redis service not initialized' });
  }

  switch (action) {
    case 'storeToken':
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
      }
      try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }

        // Store token in Redis with 24h expiry
        await redisService.setValue(`token:${token}`, 'valid', 24 * 60 * 60);
        return res.status(200).json({ message: 'Token stored' });
      } catch (error) {
        console.error('Store token error:', error);
        return res.status(500).json({ error: 'Failed to store token' });
      }

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
        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }

        res.status(200).json({ session });
      } catch (error) {
        console.error('Error getting token:', error);
        res.status(500).json({ error: 'Failed to get token' });
      }
      break;

    default:
      res.status(400).json({ error: 'Invalid action' });
  }
}