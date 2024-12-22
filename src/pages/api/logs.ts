// src/pages/api/logs.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { LogLevel } from '@/MonitoringSystem/managers/MonitoringManager'; // Added import for LogLevel

interface TimeWindow {
  start: Date;
  end: Date;
}

function validateTimeWindow(timeWindow?: string): TimeWindow {
  if (!timeWindow) {
    return {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date()
    };
  }

  const match = timeWindow.match(/^(\d+)([hdm])$/);
  if (!match) {
    throw new Error('Invalid time window format');
  }

  const [, value, unit] = match;
  const now = new Date();
  let start: Date;

  switch (unit) {
    case 'h':
      start = new Date(now.getTime() - parseInt(value) * 60 * 60 * 1000);
      break;
    case 'd':
      start = new Date(now.getTime() - parseInt(value) * 24 * 60 * 60 * 1000);
      break;
    case 'm':
      start = new Date(now.getTime() - parseInt(value) * 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      throw new Error('Invalid time unit');
  }

  return { start, end: now };
}

async function validateLogsBatch(body: any): Promise<any[]> {
  if (!body || !Array.isArray(body.logs)) {
    throw new Error('Invalid logs batch format');
  }

  return body.logs.map((log: any) => {
    return {
      ...log,
      timestamp: new Date(),
      reference: `${log.category}_${log.component}_${Date.now().toString(36)}`
    };
  });
}

async function processLogsBatch(logs: any[]): Promise<void> {
  try {
    await Promise.all(logs.map(async (log) => {
      try {
        await monitoringManager.logger.log(
          log.level || LogLevel.INFO,
          log.message || 'No message provided',
          {
            ...log,
            category: log.category,
            component: log.component,
            userId: log.userId || 'system'
          }
        );
      } catch (error) {
        console.error('Error recording log:', error);
        throw error;
      }
    }));
    
    await monitoringManager.logger.flush();
  } catch (error) {
    console.error('Failed to process logs batch:', error);
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      const validatedLogs = await validateLogsBatch(req.body);
      
      try {
        await processLogsBatch(validatedLogs);

        return res.status(200).json({
          success: true,
          message: 'Logs processed and persisted successfully',
          count: validatedLogs.length
        });
      } catch (error) {
        console.error('Error processing logs:', error);
        return res.status(500).json({
          error: 'Failed to process logs batch',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    if (req.method === 'GET') {
      const timeWindow = validateTimeWindow(req.query.timeWindow as string);
      const logs = await monitoringManager.logger.getLogs(timeWindow.start, timeWindow.end);

      return res.status(200).json({
        success: true,
        data: logs,
        timeWindow
      });
    }

    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    return res.status(405).json({
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Error in logs handler:', error);
    return res.status(500).json({
      error: 'Error processing logs request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
