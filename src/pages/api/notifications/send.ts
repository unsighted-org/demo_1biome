import type { NextApiRequest, NextApiResponse } from 'next';
import { redisService } from '@/services/cache/redisService';
import { verify } from 'jsonwebtoken';
import type { HealthEnvironmentData } from '@/types';
import { setSecurityHeaders } from '@/lib/security';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set security headers
  setSecurityHeaders(res);

  // Only allow POST method
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowedMethods: ['POST']
    });
  }

  // Validate Content-Type
  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('application/json')) {
    return res.status(415).json({ 
      error: 'Unsupported Media Type',
      message: 'Content-Type must be application/json'
    });
  }

  // Validate Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header'
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'No token provided'
    });
  }

  try {
    // Verify JWT token
    const decoded = verify(token, process.env.JWT_SECRET!) as { userId: string };
    const userId = decoded.userId;

    const data = req.body as HealthEnvironmentData;
    
    // Validate request body
    if (!data || typeof data !== 'object') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid request body'
      });
    }

    const notification = {
      type: 'health_update',
      data,
      timestamp: new Date().toISOString()
    };

    // Publish to Redis channel
    await redisService.publishToChannel(
      `notifications:${userId}`,
      JSON.stringify(notification)
    );

    // Set cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}
