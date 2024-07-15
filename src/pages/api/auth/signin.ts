import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { sign } from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

import { getCosmosClient } from '@/config/azureConfig';

import type { ServerUser, UserState, ServerUserSettings, UserLoginData } from '@/types';
import type { NextApiRequest, NextApiResponse } from 'next';

dotenv.config();

const signinHandler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const { email, password }: UserLoginData = req.body;

  try {
    const client = await getCosmosClient();
    const db = client?.db('aetheriqdatabasemain');
    if (!db) {
      throw new Error('Database is undefined');
    }

    const users = db.collection<ServerUser>('users');
    const user = await users.findOne({ email }) as ServerUser | null;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const userId = user._id.toString();

    const token = sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    const userSettings = db.collection<ServerUserSettings>('userSettings');
    const settings = await userSettings.findOne({ userId: user._id });

    const userState: UserState = {
      id: userId,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
      dateOfBirth: user.dateOfBirth.toISOString(),
      height: user.height,
      weight: user.weight,
      avatarUrl: user.avatarUrl,
      connectedDevices: user.connectedDevices.map(id => id.toString()),
      settings: {
        dateOfBirth: settings?.dateOfBirth?.toISOString(),
        height: settings?.height,
        weight: settings?.weight,
        connectedDevices: settings?.connectedDevices.map(id => id.toString()) ?? [],
        dailyReminder: settings?.dailyReminder ?? false,
        weeklySummary: settings?.weeklySummary ?? false,
        shareData: settings?.shareData ?? false,
        notificationsEnabled: settings?.notificationsEnabled ?? false,
        dataRetentionPeriod: settings?.dataRetentionPeriod ?? 0,
        notificationPreferences: settings?.notificationPreferences ?? {
          heartRate: false,
          stepGoal: false,
          environmentalImpact: false
        }
      },
      fcmToken: null,
      token,
      enabled: true,
      _id: ''
    };

    res.status(200).json(userState);
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default signinHandler;
