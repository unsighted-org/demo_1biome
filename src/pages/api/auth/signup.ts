import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import formidable from 'formidable';
import { sign } from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

import { getCosmosClient } from '@/config/azureConfig';

import type { ServerUser, UserSignupData, UserState, UserSettings } from '@/types';
import type { NextApiRequest, NextApiResponse } from 'next';

dotenv.config();

// Disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

const signupHandler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const form = formidable();

  form.parse(req, async (err: Error, fields: formidable.Fields, _files: formidable.Files) => {
    if (err) {
      console.error('Formidable error:', err);
      return res.status(500).json({ error: 'Form data parsing failed' });
    }

    // Handle fields.signupData which may be string or string[]
    const signupDataString = Array.isArray(fields.signupData) ? fields.signupData[0] : fields.signupData;
    
    if (!signupDataString) {
      return res.status(400).json({ error: 'Signup data is missing' });
    }

    const signupData = JSON.parse(signupDataString) as UserSignupData;

    try {
      const client = await getCosmosClient();
      const db = client?.db('aetheriqdatabasemain');
      if (!db) {
        throw new Error('Database is undefined');
      }

      const users = db.collection<ServerUser>('users');
      const existingUser = await users.findOne({ email: signupData.email });
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(signupData.password, 10);
      const newServerUser: ServerUser = {
          _id: new ObjectId(),
          email: signupData.email,
          password: hashedPassword,
          name: signupData.name,
          dateOfBirth: new Date(signupData.dateOfBirth),
          height: signupData.height || 0,
          weight: signupData.weight || 0,
          createdAt: new Date(),
          avatarUrl: null, // Handle avatar upload separately if needed
          connectedDevices: [],
          isDeleted: false,
          deletedAt: null
      };

      await users.insertOne(newServerUser);

      const token = sign({ userId: newServerUser._id.toString() }, process.env.JWT_SECRET!, { expiresIn: '7d' });

      const settings: Omit<UserSettings, '_id' | 'userId'> = {
        dateOfBirth: newServerUser.dateOfBirth.toISOString(),
        height: newServerUser.height,
        weight: newServerUser.weight,
        connectedDevices: [],
        dailyReminder: false,
        weeklySummary: false,
        shareData: false,
        notificationsEnabled: false,
        dataRetentionPeriod: 365,
        notificationPreferences: {
          heartRate: false,
          stepGoal: false,
          environmentalImpact: false
        }
      };

      const userState: UserState = {
        id: newServerUser._id.toString(),
        _id: newServerUser._id.toString(),
        email: newServerUser.email,
        name: newServerUser.name,
        createdAt: newServerUser.createdAt.toISOString(),
        dateOfBirth: newServerUser.dateOfBirth.toISOString(),
        height: newServerUser.height,
        weight: newServerUser.weight,
        avatarUrl: newServerUser.avatarUrl,
        connectedDevices: [],
        settings,
        fcmToken: null,
        token,
        enabled: true
      };

      res.status(201).json(userState);
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Sign up failed' });
    }
  });
};

export default signupHandler;
