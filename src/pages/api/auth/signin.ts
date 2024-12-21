import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { sign } from 'jsonwebtoken';

import { getCollection } from '@/config/azureCosmosClient';

import type { ServerUser, UserState, UserSettings } from '@/types';
import type { NextApiRequest, NextApiResponse } from 'next';
import { COLLECTIONS } from '@/constants/collections';

dotenv.config();

const signinHandler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const { email, password } = req.body;

  try {
    const usersCollection = await getCollection(COLLECTIONS.USERS);
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = sign({ userId: user._id.toString() }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    // Fetch user settings
    const userSettingsCollection = await getCollection(COLLECTIONS.SETTINGS);
    const settings = await userSettingsCollection.findOne({ userId: user._id.toString() }) as UserSettings | null;

    // Convert to UserState format
    const userState: UserState = {
      id: user._id.toString(),
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
      dateOfBirth: user.dateOfBirth.toISOString(),
      height: user.height,
      weight: user.weight,
      avatarUrl: user.avatarUrl,
      connectedDevices: user.connectedDevices.map((id: { toString: () => any; }) => id.toString()),
      settings: settings ? {
        dateOfBirth: settings.dateOfBirth ? settings.dateOfBirth.toString() : undefined,
        height: settings.height,
        weight: settings.weight,
        connectedDevices: settings.connectedDevices.map(id => id.toString()),
        dailyReminder: settings.dailyReminder,
        weeklySummary: settings.weeklySummary,
        shareData: settings.shareData,
        notificationsEnabled: settings.notificationsEnabled,
        dataRetentionPeriod: settings.dataRetentionPeriod,
        notificationPreferences: {
          heartRate: false,
          stepGoal: false,
          environmentalImpact: false
        }
      } : {
        connectedDevices: [],
        dailyReminder: false,
        weeklySummary: false,
        shareData: false,
        notificationsEnabled: false,
        dataRetentionPeriod: 0,
        notificationPreferences: {
          heartRate: false,
          stepGoal: false,
          environmentalImpact: false
        }
      },
      fcmToken: null, // Assuming fcmToken is not stored in the user document
      token,
      enabled: true // Assuming all signed-in users are enabled
    };

    res.status(200).json(userState);
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default signinHandler;
