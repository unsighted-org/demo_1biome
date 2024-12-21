import type { NextApiRequest, NextApiResponse } from 'next';
import { redisService } from '@/services/cache/redisService';
import { verify } from 'jsonwebtoken';
import { setSecurityHeaders } from '@/lib/security';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set security headers
  setSecurityHeaders(res);

  // Only allow GET method
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      error: 'Method not allowed',
      allowedMethods: ['GET']
    });
  }

  // Validate token query parameter
  const token = req.query.token;
  if (!token || typeof token !== 'string') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid token parameter'
    });
  }

  try {
    // Verify JWT token
    const decoded = verify(token, process.env.JWT_SECRET!) as { userId: string };
    const userId = decoded.userId;

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
    res.setHeader('Transfer-Encoding', 'chunked');

    // Subscribe to Redis channel for this user
    const channel = `notifications:${userId}`;
    const subscriber = await redisService.subscribeToChannel(channel);

    // Send initial connection success message
    res.write(`data: ${JSON.stringify({ type: 'connection', status: 'connected' })}\n\n`);

    // Keep connection alive with periodic heartbeat
    const heartbeat = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
    }, 30000); // Every 30 seconds

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
      redisService.unsubscribeFromChannel(channel);
    });

    // Send messages to client
    subscriber.on('message', (_, message) => {
      try {
        // Validate message is proper JSON
        JSON.parse(message);
        res.write(`data: ${message}\n\n`);
      } catch (error) {
        console.error('Invalid message format:', error);
      }
    });

    // Handle subscriber errors
    subscriber.on('error', (error) => {
      console.error('Redis subscriber error:', error);
      clearInterval(heartbeat);
      res.end();
    });

  } catch (error) {
    console.error('Error in SSE stream:', error);

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
