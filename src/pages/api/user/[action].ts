import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { verify } from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

import { getCosmosClient } from '@/config/azureConfig';

import type { ServerUser, ServerUserSettings, UserState, UserSettings } from '@/types';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Secret } from 'next-auth/jwt';

dotenv.config();

interface ServerUserWithPassword extends ServerUser {
  password: string;
  fcmToken: string | null;
}

export type UserResponse = Omit<UserState, 'password'>;

function convertToUserResponse(serverUser: ServerUserWithPassword, serverSettings: ServerUserSettings | null, token: string): UserResponse {
  const { password: _, ...userWithoutPassword } = serverUser;
  const settings: Omit<UserSettings, '_id' | 'userId'> = serverSettings 
    ? {
        dateOfBirth: serverSettings.dateOfBirth ? serverSettings.dateOfBirth.toISOString() : new Date('1900-01-01').toISOString(),
        height: serverSettings.height,
        weight: serverSettings.weight,
        connectedDevices: serverSettings.connectedDevices.map(id => id.toString()),
        dailyReminder: serverSettings.dailyReminder,
        weeklySummary: serverSettings.weeklySummary,
        shareData: serverSettings.shareData,
        notificationsEnabled: serverSettings.notificationsEnabled,
        dataRetentionPeriod: serverSettings.dataRetentionPeriod,
        notificationPreferences: serverSettings.notificationPreferences
      }
    : {} as Omit<UserSettings, '_id' | 'userId'>;

  return {
    ...userWithoutPassword,
    id: userWithoutPassword._id.toString(),
    _id: userWithoutPassword._id.toString(),
    createdAt: userWithoutPassword.createdAt.toISOString(),
    dateOfBirth: userWithoutPassword.dateOfBirth.toISOString(),
    connectedDevices: userWithoutPassword.connectedDevices.map(id => id.toString()),
    settings,
    token,
    enabled: true,
    fcmToken: serverUser.fcmToken || null
  };
}

const verifyToken = (token: string): Promise<string | null> => {
  if (!process.env.JWT_SECRET) return Promise.resolve(null);
  return new Promise((resolve) => {
    verify(token, process.env.JWT_SECRET as Secret, (err, decoded) => {
      resolve(err ? null : (decoded as { userId: string }).userId);
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void | NextApiResponse<any>> {
  const { method } = req;

  if (method !== 'GET' && method !== 'PUT' && method !== 'POST') {
    res.setHeader('Allow', ['GET', 'PUT', 'POST']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const userId = await verifyToken(token);
  if (!userId) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const client = await getCosmosClient();
  const database = client?.db('aetheriqdatabasemain');
  if (!database) {
    return res.status(500).json({ error: 'Database is undefined' });
  }

  const usersCollection = database.collection<ServerUserWithPassword>('Users');
  const settingsCollection = database.collection<ServerUserSettings>('UserSettings');

  const userObjectId = new ObjectId(userId);

  try {
    switch (method) {
      case 'GET':
        const serverUser = await usersCollection.findOne({ _id: userObjectId });
        if (!serverUser) {
          return res.status(404).json({ error: 'User not found' });
        }
        const serverSettings = await settingsCollection.findOne({ userId: userObjectId });
        const userResponse = convertToUserResponse(serverUser, serverSettings, token);
        return res.status(200).json(userResponse);

      case 'PUT':
        const updateData = req.body;
        if (updateData.connectedDevices) {
          updateData.connectedDevices = updateData.connectedDevices.map((id: string) => new ObjectId(id));
        }
        if (updateData.dateOfBirth) {
          updateData.dateOfBirth = new Date(updateData.dateOfBirth);
        }
        if (updateData.createdAt) {
          updateData.createdAt = new Date(updateData.createdAt);
        }
        const updatedServerUser = await usersCollection.findOneAndUpdate(
          { _id: userObjectId },
          { $set: updateData },
          { returnDocument: 'after' }
        );
        if (!updatedServerUser) {
          return res.status(404).json({ error: 'User not found' });
        }
        const updatedServerSettings = await settingsCollection.findOne({ userId: userObjectId });
        const updatedUserResponse = convertToUserResponse(updatedServerUser, updatedServerSettings, token);
        return res.status(200).json(updatedUserResponse);

      case 'POST':
        switch (req.body.action) {
          case 'updateSettings':
            const settings: Partial<ServerUserSettings> = req.body.settings;
            if (settings.connectedDevices) {
              settings.connectedDevices = settings.connectedDevices.map(id => new ObjectId(id));
            }
            if (settings.dateOfBirth) {
              settings.dateOfBirth = new Date(settings.dateOfBirth);
            }

            // Ensure notificationPreferences are properly handled
            if (settings.notificationPreferences) {
              settings.notificationPreferences = {
                heartRate: !!settings.notificationPreferences.heartRate,
                stepGoal: !!settings.notificationPreferences.stepGoal,
                environmentalImpact: !!settings.notificationPreferences.environmentalImpact
              };
            }

            const updatedSettings = await settingsCollection.findOneAndUpdate(
              { userId: userObjectId },
              { $set: settings },
              { upsert: true, returnDocument: 'after' }
            );

            if (!updatedSettings) {
              return res.status(500).json({ error: 'Failed to update settings' });
            }
            const userForSettings = await usersCollection.findOne({ _id: userObjectId });
            if (!userForSettings) {
              return res.status(404).json({ error: 'User not found' });
            }
            const updatedResponseWithSettings = convertToUserResponse(userForSettings, updatedSettings, token);

            return res.status(200).json(updatedResponseWithSettings);

          case 'setFCMToken':
            const { fcmToken } = req.body;
            if (typeof fcmToken !== 'string') {
              return res.status(400).json({ error: 'Invalid FCM token' });
            }
            const fcmResult = await usersCollection.updateOne(
              { _id: userObjectId },
              { $set: { fcmToken } }
            );
            if (fcmResult.matchedCount === 0) {
              return res.status(404).json({ error: 'User not found' });
            }
            return res.status(200).json({ message: 'FCM token updated successfully' });

          case 'addConnectedDevice':
            const { deviceId: addDeviceId } = req.body;
            if (typeof addDeviceId !== 'string') {
              return res.status(400).json({ error: 'Invalid device ID' });
            }
            const addResult = await usersCollection.updateOne(
              { _id: userObjectId },
              { $addToSet: { connectedDevices: new ObjectId(addDeviceId) } }
            );
            if (addResult.matchedCount === 0) {
              return res.status(404).json({ error: 'User not found' });
            }
            return res.status(200).json({ message: 'Connected device added successfully' });

          case 'removeConnectedDevice':
            const { deviceId: removeDeviceId } = req.body;
            if (typeof removeDeviceId !== 'string') {
              return res.status(400).json({ error: 'Invalid device ID' });
            }
            const removeResult = await usersCollection.updateOne(
              { _id: userObjectId },
              { $pull: { connectedDevices: new ObjectId(removeDeviceId) } }
            );
            if (removeResult.matchedCount === 0) {
              return res.status(404).json({ error: 'User not found' });
            }
            return res.status(200).json({ message: 'Connected device removed successfully' });

          case 'deleteAccount':
            const { password } = req.body;
            const user = await usersCollection.findOne({ _id: userObjectId });
            if (!user) {
              return res.status(404).json({ error: 'User not found' });
            }

            if (!password || typeof password !== 'string') {
              return res.status(400).json({ error: 'Invalid password format' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
              return res.status(401).json({ error: 'Invalid password' });
            }

            const deleteResult = await usersCollection.updateOne(
              { _id: userObjectId },
              {
                $set: {
                  isDeleted: true,
                  deletedAt: new Date()
                }
              }
            );

            if (deleteResult.modifiedCount === 0) {
              return res.status(500).json({ error: 'Failed to delete account' });
            }

            return res.status(200).json({ message: 'Account marked for deletion. You can recover it within 7 days by logging in.' });

          default:
            return res.status(400).json({ error: 'Invalid action' });
        }

      default:
        return res.status(400).json({ error: 'Invalid method' });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}