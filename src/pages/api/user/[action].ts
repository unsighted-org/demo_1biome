import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { verify } from 'jsonwebtoken';
import { ObjectId, Document, Collection, WithId, ModifyResult } from 'mongodb';

import { getCollection } from '@/config/azureCosmosClient';
import type { InMemoryCollection } from '@/config/types';
import type { UserState, UserSettings, UserResponse } from '@/types';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Secret } from 'next-auth/jwt';
import { COLLECTIONS } from '@/constants/collections';

dotenv.config();

interface ServerUserWithPassword {
    _id: ObjectId;
    email: string;
    password: string;
    name: string;
    createdAt: Date;
    dateOfBirth: Date;
    connectedDevices: ObjectId[];
    fcmToken: string | null;
    isDeleted?: boolean;
    deletedAt?: Date;
}

interface ExtendedUserResponse extends UserResponse {
  height: number;
  weight: number;
  avatarUrl: string | null;
}

type MongoCollection = Collection<Document> | InMemoryCollection;

interface ServerSettings extends WithId<Document> {
  _id: ObjectId;
  userId: ObjectId;
  dateOfBirth: Date;
  height: number;
  weight: number;
  connectedDevices: ObjectId[];
  dailyReminder: boolean;
  weeklySummary: boolean;
  shareData: boolean;
  notificationsEnabled: boolean;
  dataRetentionPeriod: number;
  notificationPreferences: {
    heartRate: boolean;
    stepGoal: boolean;
    environmentalImpact: boolean;
  };
}

async function findOneAndUpdateDocument<T extends Document>(
  collection: MongoCollection,
  filter: Document,
  update: Document,
  options: { returnDocument?: 'before' | 'after', upsert?: boolean } = { returnDocument: 'after' }
): Promise<ModifyResult<T>> {
  if ('findOneAndUpdate' in collection) {
    const result = await collection.findOneAndUpdate(filter, update, { ...options, includeResultMetadata: true });
    return result as unknown as ModifyResult<T>;
  }
  // For InMemoryCollection, simulate findOneAndUpdate
  const result = await collection.updateOne(filter, update);
  if (result.modifiedCount > 0 || (options.upsert && result.acknowledged)) {
    const doc = await collection.findOne(filter);
    if (!doc) {
      return { value: null, ok: 0, lastErrorObject: { n: 0, updatedExisting: false } };
    }
    return { 
      value: { ...doc, _id: new ObjectId(doc._id) } as WithId<T>,
      ok: 1,
      lastErrorObject: { n: 1, updatedExisting: true }
    };
  }
  return { value: null, ok: 0, lastErrorObject: { n: 0, updatedExisting: false } };
}

function convertToUserResponse(serverUser: WithId<ServerUserWithPassword>, serverSettings: WithId<ServerSettings> | null, token: string): ExtendedUserResponse {
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
        fcmToken: serverUser.fcmToken || null,
        height: serverSettings?.height || 0,
        weight: serverSettings?.weight || 0,
        avatarUrl: null
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

    try {
        const usersCollection = await getCollection(COLLECTIONS.USERS) as MongoCollection;
        const settingsCollection = await getCollection(COLLECTIONS.SETTINGS) as MongoCollection;
        
        switch (method) {
            case 'GET':
                const serverUser = await usersCollection.findOne({ _id: new ObjectId(userId) }) as ServerUserWithPassword;
                if (!serverUser) {
                    return res.status(404).json({ error: 'User not found' });
                }
                const serverSettings = await settingsCollection.findOne({ userId: new ObjectId(userId) }) as ServerSettings | null;
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
                const updatedServerUser = await findOneAndUpdateDocument<ServerUserWithPassword>(
                    usersCollection,
                    { _id: new ObjectId(userId) },
                    { $set: updateData },
                    { returnDocument: 'after' }
                );

                if (!updatedServerUser.value) {
                    return res.status(404).json({ error: 'User not found' });
                }

                const updatedServerSettings = await settingsCollection.findOne({ userId: new ObjectId(userId) }) as ServerSettings | null;
                const updatedUserResponse = convertToUserResponse(updatedServerUser.value, updatedServerSettings, token);
                return res.status(200).json(updatedUserResponse);

            case 'POST':
                switch (req.body.action) {
                    case 'updateSettings':
                        const settings: Partial<ServerSettings> = req.body.settings;
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

                        const updatedSettings = await findOneAndUpdateDocument<ServerSettings>(
                            settingsCollection,
                            { userId: new ObjectId(userId) },
                            { $set: settings },
                            { upsert: true, returnDocument: 'after' }
                        );

                        if (!updatedSettings.value) {
                            return res.status(500).json({ error: 'Failed to update settings' });
                        }
                        const userForSettings = await usersCollection.findOne({ _id: new ObjectId(userId) }) as ServerUserWithPassword;
                        if (!userForSettings) {
                            return res.status(404).json({ error: 'User not found' });
                        }
                        const updatedResponseWithSettings = convertToUserResponse(userForSettings, updatedSettings.value, token);
                        return res.status(200).json(updatedResponseWithSettings);

                    case 'setFCMToken':
                        const { fcmToken } = req.body;
                        if (typeof fcmToken !== 'string') {
                            return res.status(400).json({ error: 'Invalid FCM token' });
                        }
                        const fcmResult = await usersCollection.updateOne(
                            { _id: new ObjectId(userId) },
                            { $set: { fcmToken } }
                        );
                        if (!fcmResult.acknowledged || fcmResult.modifiedCount === 0) {
                            return res.status(404).json({ error: 'User not found' });
                        }
                        return res.status(200).json({ message: 'FCM token updated successfully' });

                    case 'addConnectedDevice':
                        const { deviceId: addDeviceId } = req.body;
                        if (typeof addDeviceId !== 'string') {
                            return res.status(400).json({ error: 'Invalid device ID' });
                        }
                        const addResult = await usersCollection.updateOne(
                            { _id: new ObjectId(userId) },
                            { $addToSet: { connectedDevices: new ObjectId(addDeviceId) } }
                        );
                        if (!addResult.acknowledged || addResult.modifiedCount === 0) {
                            return res.status(404).json({ error: 'User not found' });
                        }
                        return res.status(200).json({ message: 'Connected device added successfully' });

                    case 'removeConnectedDevice':
                        const { deviceId: removeDeviceId } = req.body;
                        if (typeof removeDeviceId !== 'string') {
                            return res.status(400).json({ error: 'Invalid device ID' });
                        }
                        const pullQuery = { 
                            $pull: { 
                                connectedDevices: new ObjectId(removeDeviceId)
                            }
                        } as any;
                        const removeResult = await usersCollection.updateOne(
                            { _id: new ObjectId(userId) },
                            pullQuery
                        );
                        if (!removeResult.acknowledged || removeResult.modifiedCount === 0) {
                            return res.status(404).json({ error: 'User not found' });
                        }
                        return res.status(200).json({ message: 'Connected device removed successfully' });

                    case 'deleteAccount':
                        const { password } = req.body;
                        const user = await usersCollection.findOne({ _id: new ObjectId(userId) }) as ServerUserWithPassword;
                        if (!user) {
                            return res.status(404).json({ error: 'User not found' });
                        }

                        // Implement more robust password verification
                        if (!password || typeof password !== 'string') {
                            return res.status(400).json({ error: 'Invalid password format' });
                        }

                        const isPasswordValid = await bcrypt.compare(password, user.password);
                        if (!isPasswordValid) {
                            return res.status(401).json({ error: 'Invalid password' });
                        }

                        const deleteResult = await usersCollection.updateOne(
                            { _id: new ObjectId(userId) },
                            {
                                $set: {
                                    isDeleted: true,
                                    deletedAt: new Date()
                                }
                            }
                        );

                        if (!deleteResult.acknowledged || deleteResult.modifiedCount === 0) {
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
