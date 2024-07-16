import { verify } from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

import { getCosmosClient } from '../../../config/azureConfig';
import { convertToUserState } from '../../../lib/userUtils';

import type { ServerUser, ServerUserSettings, UserResponse } from '../../../types';
import type { Secret, JwtPayload } from 'jsonwebtoken';
import type { NextApiRequest, NextApiResponse } from 'next';

interface CustomJwtPayload extends JwtPayload {
  userId: string;
}

const verifyToken = (token: string): Promise<string | null> => {
  if (!process.env.JWT_SECRET) return Promise.resolve(null);
  return new Promise((resolve) => {
    verify(token, process.env.JWT_SECRET as Secret, (err, decoded) => {
      resolve(err ? null : (decoded as CustomJwtPayload).userId);
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
    const userId = await verifyToken(token);
    if (!userId) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const client = await getCosmosClient();
    const db = client?.db('aetheriqdatabasemain');
    if (!db) {
      throw new Error('Database is undefined');
    }

    const usersCollection = db.collection<ServerUser>('Users');
    const settingsCollection = db.collection<ServerUserSettings>('UserSettings');
    const userObjectId = new ObjectId(userId);
    
    const serverUser = await usersCollection.findOne({ _id: userObjectId });
    if (!serverUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const serverSettings = await settingsCollection.findOne({ userId: userObjectId });
    const userResponse = convertToUserState(serverUser, serverSettings, token);
    
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