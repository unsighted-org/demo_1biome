import { verify } from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

import { getCosmosClient } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { convertToUserState } from '@/lib/userUtils';
import { redisService } from '@/services/cache/redisService';

import type { ServerUser, ServerUserSettings, UserResponse } from '@/types';
import type { Secret, JwtPayload } from 'jsonwebtoken';
import type { NextApiRequest, NextApiResponse } from 'next';

interface CustomJwtPayload extends JwtPayload {
  userId: string;
}

const verifyToken = async (token: string): Promise<string | null> => {
  if (!process.env.JWT_SECRET) return null;

  // Try to get cached verification result
  const cachedUserId = await redisService.getValue(`token:${token}`);
  if (cachedUserId) return cachedUserId;

  return new Promise((resolve) => {
    verify(token, process.env.JWT_SECRET as Secret, async (err, decoded) => {
      const userId = err ? null : (decoded as CustomJwtPayload).userId;
      if (userId) {
        // Cache the verification result for 1 hour
        await redisService.setValue(`token:${token}`, userId, 3600);
      }
      resolve(userId);
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<UserResponse | { error: string; details?: string }>): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ error: 'Token is required' });
    return;
  }

  try {
    // First, check if the user data is cached
    const cachedUserData = await redisService.getSession(token);
    if (cachedUserData) {
      res.status(200).json(JSON.parse(cachedUserData));
      return;
    }

    const userId = await verifyToken(token);
    if (!userId) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const client = await getCosmosClient();
    if (!client) {
      throw new Error('Database client is undefined');
    }

    const db = client.db();
    const usersCollection = db.collection<ServerUser>(COLLECTIONS.USERS);
    const settingsCollection = db.collection<ServerUserSettings>(COLLECTIONS.SETTINGS);
    const userObjectId = new ObjectId(userId);
    
    const serverUser = await usersCollection.findOne({ _id: userObjectId });
    if (!serverUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const serverSettings = await settingsCollection.findOne({ userId: userObjectId });
    const userResponse = convertToUserState(serverUser, serverSettings, token);
    
    // Cache the user data
    await redisService.storeSession(token, JSON.stringify(userResponse));
    
    res.status(200).json(userResponse);
  } catch (error) {
    console.error('Token verification error:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error', details: 'Unknown error' });
    }
  }
}