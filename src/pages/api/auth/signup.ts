import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import formidable from 'formidable';
import { sign } from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

import { getCollection } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { validateSignupData, type SignupData } from '@/lib/validation';

import type { ServerUser, UserState, UserSettings } from '@/types';
import type { NextApiRequest, NextApiResponse } from 'next';

dotenv.config();

// Disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

const signupHandler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  try {
    const form = formidable();
    const [fields] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Handle fields.signupData which may be string or string[]
    const signupDataString = Array.isArray(fields.signupData) ? fields.signupData[0] : fields.signupData;
    
    if (!signupDataString) {
      return res.status(400).json({ error: 'Signup data is missing' });
    }

    const signupData = JSON.parse(signupDataString) as SignupData;

    // Validate signup data
    const validationResult = validateSignupData(signupData);
    if (!validationResult.isValid) {
      return res.status(400).json({ error: validationResult.error });
    }

    try {
      // Check if required environment variables are set
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not set');
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const usersCollection = await getCollection(COLLECTIONS.USERS);
      
      // Check if user already exists
      const existingUser = await usersCollection.findOne({ email: signupData.email });
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(signupData.password, 10);
      
      // Create new user document
      const newServerUser: ServerUser = {
        _id: new ObjectId(),
        email: signupData.email,
        password: hashedPassword,
        name: signupData.name,
        dateOfBirth: new Date(signupData.dateOfBirth),
        height: signupData.height || 0,
        weight: signupData.weight || 0,
        createdAt: new Date(),
        avatarUrl: null,
        connectedDevices: [],
        isDeleted: false,
        deletedAt: null
      };

      // Insert user into database
      const result = await usersCollection.insertOne(newServerUser);
      if (!result.acknowledged) {
        throw new Error('Failed to insert user into database');
      }

      // Generate JWT token
      const token = sign(
        { 
          id: newServerUser._id.toString(),
          email: newServerUser.email,
          name: newServerUser.name,
          role: 'user'
        }, 
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      // Set HTTP-only cookie
      res.setHeader('Set-Cookie', [
        `token=${token}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Lax`
      ]);

      // Create user settings
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

      // Create user state response
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

      // Return success with user data and token
      return res.status(200).json({
        user: {
          id: newServerUser._id.toString(),
          email: newServerUser.email,
          name: newServerUser.name,
          role: 'user'
        },
        token
      });
    } catch (error) {
      console.error('Signup error:', error);
      return res.status(500).json({ error: 'Sign up failed' });
    }
  } catch (error) {
    console.error('Formidable error:', error);
    return res.status(500).json({ error: 'Form data parsing failed' });
  }
};

export default signupHandler;
