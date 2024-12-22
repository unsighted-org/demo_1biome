import { verify } from 'jsonwebtoken';
import type { NextApiRequest, NextApiResponse } from 'next';

import { getCollection } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { redisService } from '@/services/cache/redisService';
import type { UserState } from '@/types';
import { ServerUser, ServerUserSettings } from '@/types';

export default async function sessionHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    // First check Redis cache
    const cachedSession = await redisService.getSession(token);
    if (cachedSession) {
      return res.status(200).json(JSON.parse(cachedSession));
    }

    // If not in cache, verify token and get from database
    const decoded = verify(token, process.env.JWT_SECRET) as { userId: string };
    
    // Get user from database
    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const user = await usersCollection.findOne({ id: decoded.userId }) as ServerUser;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user settings
    const settingsCollection = await getCollection(COLLECTIONS.SETTINGS);
    const settings = (await settingsCollection.findOne({ userId: decoded.userId }) || {}) as ServerUserSettings;

    // Construct user state
    const userState: UserState = {
      id: user._id.toString(),
      email: user.email,
      name: user.name || '',
      height: user.height || 0,
      weight: user.weight || 0,
      settings: {
        dateOfBirth: settings.dateOfBirth ? new Date(settings.dateOfBirth).toISOString() : undefined,
        height: settings.height ?? undefined,
        weight: settings.weight ?? undefined,
        connectedDevices: settings.connectedDevices?.map(id => id.toString()) ?? [],
        dailyReminder: settings.dailyReminder ?? false,
        weeklySummary: settings.weeklySummary ?? false,
        shareData: settings.shareData ?? false,
        notificationsEnabled: settings.notificationsEnabled ?? false,
        dataRetentionPeriod: settings.dataRetentionPeriod ?? 30,
        notificationPreferences: settings.notificationPreferences ?? {
          heartRate: false,
          stepGoal: false,
          environmentalImpact: false
        }
      },
      _id: '',
      createdAt: '',
      avatarUrl: null,
      connectedDevices: [],
      fcmToken: null,
      token: '',
      enabled: false,
      dateOfBirth: '',
    };

    // Cache the session in Redis
    await redisService.storeSession(token, JSON.stringify(userState));

    return res.status(200).json(userState);
  } catch (error) {
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('Session error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
