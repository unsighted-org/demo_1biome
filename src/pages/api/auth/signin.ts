// src/pages/api/auth/signin.ts

import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';

import { getCosmosClient } from '@/config/azureConfig';
import { convertToUserState } from '@/lib/userUtils';

import type { ServerUser, ServerUserSettings, UserLoginData, UserResponse } from '@/types';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse<UserResponse | { error: string }>): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { email, password }: UserLoginData = req.body;

  try {
    const client = await getCosmosClient();
    const db = client?.db('aetheriqdatabasemain');
    if (!db) {
      throw new Error('Database is undefined');
    }

    const users = db.collection<ServerUser>('users');
    const user = await users.findOne({ email });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    const token = sign({ userId: user._id.toString() }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    const userSettings = db.collection<ServerUserSettings>('userSettings');
    const settings = await userSettings.findOne({ userId: user._id });

    const userResponse = convertToUserState(user, settings, token);
    res.status(200).json(userResponse);
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}