import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { sign } from 'jsonwebtoken';

import { getCollection } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { redisService } from '@/services/cache/redisService';

import type { ServerUser, UserState, UserSettings } from '@/types';
import type { NextApiRequest, NextApiResponse } from 'next';

dotenv.config();

export default async function loginHandler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if required environment variables are set
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const usersCollection = await getCollection(COLLECTIONS.USERS);
    if (!usersCollection) {
      console.error('Failed to get users collection');
      return res.status(500).json({ error: 'Database connection error' });
    }

    const user = await usersCollection.findOne({ email, isDeleted: { $ne: true } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = sign(
      { 
        userId: user._id.toString(),
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create base user state without settings
    const userState: Partial<UserState> = {
      id: user._id.toString(),
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      dateOfBirth: user.dateOfBirth?.toISOString() || new Date().toISOString(),
      height: user.height || 0,
      weight: user.weight || 0,
      avatarUrl: user.avatarUrl || null,
      connectedDevices: user.connectedDevices?.map((id: { toString: () => any; }) => id.toString()) || [],
      fcmToken: null,
      token,
      enabled: true
    };

    try {
      // Attempt to fetch user settings
      const userSettingsCollection = await getCollection(COLLECTIONS.SETTINGS);
      const settings = await userSettingsCollection?.findOne({ userId: user._id.toString() });

      // Default settings if none exist
      userState.settings = settings ? {
        dateOfBirth: settings.dateOfBirth || user.dateOfBirth?.toISOString(),
        height: settings.height || user.height || 0,
        weight: settings.weight || user.weight || 0,
        connectedDevices: settings.connectedDevices?.map((id: { toString: () => any; }) => id.toString()) || [],
        dailyReminder: settings.dailyReminder || false,
        weeklySummary: settings.weeklySummary || false,
        shareData: settings.shareData || false,
        notificationsEnabled: settings.notificationsEnabled || false,
        dataRetentionPeriod: settings.dataRetentionPeriod || 30,
        notificationPreferences: settings.notificationPreferences || {
          heartRate: false,
          stepGoal: false,
          environmentalImpact: false
        }
      } : {
        dateOfBirth: user.dateOfBirth?.toISOString() || new Date().toISOString(),
        height: user.height || 0,
        weight: user.weight || 0,
        connectedDevices: [],
        dailyReminder: false,
        weeklySummary: false,
        shareData: false,
        notificationsEnabled: false,
        dataRetentionPeriod: 30,
        notificationPreferences: {
          heartRate: false,
          stepGoal: false,
          environmentalImpact: false
        }
      };
    } catch (settingsError) {
      console.error('Error fetching user settings:', settingsError);
      // Continue with default settings
      userState.settings = {
        dateOfBirth: user.dateOfBirth?.toISOString() || new Date().toISOString(),
        height: user.height || 0,
        weight: user.weight || 0,
        connectedDevices: [],
        dailyReminder: false,
        weeklySummary: false,
        shareData: false,
        notificationsEnabled: false,
        dataRetentionPeriod: 30,
        notificationPreferences: {
          heartRate: false,
          stepGoal: false,
          environmentalImpact: false
        }
      };
    }

    // Store session data in Redis
    await redisService.storeSession(token, JSON.stringify(userState));
    await redisService.storeUserToken(user._id.toString(), token);

    // Set token in response header
    res.setHeader('Authorization', `Bearer ${token}`);
    res.status(200).json(userState as UserState);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
