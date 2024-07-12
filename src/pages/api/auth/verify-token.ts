import { verify, Secret } from 'jsonwebtoken';
import { getCosmosClient } from '../../../config/azureConfig';
import type { NextApiRequest, NextApiResponse } from 'next';
import { convertToUserState } from '../../../lib/userUtils';
import { ObjectId } from 'mongodb';
import type { ServerUser, ServerUserSettings } from '../../../types';

const verifyToken = (token: string): Promise<string | null> => {
  if (!process.env.JWT_SECRET) return Promise.resolve(null);
  return new Promise((resolve) => {
    verify(token, process.env.JWT_SECRET as Secret, (err, decoded) => {
      resolve(err ? null : (decoded as { userId: string }).userId);
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const userId = await verifyToken(token);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const client = await getCosmosClient();
    const db = client?.db('aetheriqdatabasemain');
    if (!db) {
      throw new Error('Database is undefined');
    }

    const usersCollection = db.collection<ServerUser>('Users');
    const settingsCollection = db.collection<ServerUserSettings>('UserSettings');
    const userObjectId = new ObjectId(userId);
    
    const serverUser = await usersCollection.findOne({ _id: userObjectId }) as ServerUser;
    if (!serverUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const serverSettings = await settingsCollection.findOne({ userId: userObjectId }) as ServerUserSettings;
    const userResponse = convertToUserState(serverUser, serverSettings, token);
    
    return res.status(200).json(userResponse);
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
