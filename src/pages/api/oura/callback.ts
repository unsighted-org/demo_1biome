import type { NextApiRequest, NextApiResponse } from 'next';
import type { Session } from 'next-auth';
import axios from 'axios';
interface NextApiRequestWithSession extends NextApiRequest {
  session?: Session;
}

import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequestWithSession, res: NextApiResponse) {
  const session = await getSession({ req });
  if (session) {
    req.session = session;
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ message: 'Authorization code is required' });
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await axios.post('https://api.ouraring.com/oauth/token', {
      grant_type: 'authorization_code',
      code,
      client_id: process.env.NEXT_PUBLIC_OURA_CLIENT_ID,
      client_secret: process.env.OURA_CLIENT_SECRET,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oura/callback`
    });

    const { access_token, refresh_token } = tokenResponse.data;

    // Store tokens securely (implement your own storage solution)
    // For example, store in your database associated with the user
    if (req.session?.user?.id) {
      await storeOuraTokens(req.session.user.id, access_token, refresh_token);
    } else {
      throw new Error('User ID is undefined');
    }
    // Redirect back to the app
    res.redirect('/dashboard?integration=oura&status=success');
  } catch (error) {
    console.error('Oura Ring authentication error:', error);
    res.redirect('/dashboard?integration=oura&status=error');
  }
}

async function storeOuraTokens(userId: string, accessToken: string, refreshToken: string): Promise<void> {
  // Implement your token storage logic here
  // This could be a database call, secure cookie storage, etc.
  // Example:
  // await db.collection('users').updateOne(
  //   { _id: userId },
  //   { $set: { ouraTokens: { accessToken, refreshToken } } }
  // );
}
