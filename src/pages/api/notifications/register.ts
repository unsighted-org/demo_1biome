import type { NextApiRequest, NextApiResponse } from 'next';
import webpush from 'web-push';

const vapidDetails = {
  subject: process.env.VAPID_SUBJECT,
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

webpush.setVapidDetails(
  vapidDetails.subject!,
  vapidDetails.publicKey!,
  vapidDetails.privateKey!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { endpoint, keys } = req.body;

  console.log('Received subscription data:', { endpoint, keys });

  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    return res.status(400).json({ error: 'Missing required subscription fields' });
  }

  const subscription = {
    endpoint,
    keys: {
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  };

  try {
    const payload = JSON.stringify({
      title: 'Notification Service',
      message: 'You have successfully registered for notifications.',
    });

    await webpush.sendNotification(subscription, payload);
    res.status(200).json({ message: 'Successfully registered for notifications' });
  } catch (error) {
    console.error('Error registering for notifications:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: 'Failed to register for notifications', details: error.message });
    } else {
      res.status(500).json({ error: 'Failed to register for notifications', details: 'An unknown error occurred' });
    }
  }
}
