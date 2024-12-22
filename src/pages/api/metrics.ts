// src/pages/api/metrics.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';
import { MetricEntry } from '@/MonitoringSystem/types/metrics';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';

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

async function validateMetricsBatch(body: any): Promise<MetricEntry[]> {
  if (!body || !Array.isArray(body.metrics)) {
    throw new Error('Invalid metrics batch format');
  }

  return body.metrics.map((metric: any) => {
    // Handle nested category structure
    const category = typeof metric.category === 'object' ? metric.category.category : metric.category;
    
    if (!Object.values(MetricCategory).includes(category)) {
      throw new Error(`Invalid metric category: ${category}`);
    }
    if (!Object.values(MetricType).includes(metric.type)) {
      throw new Error(`Invalid metric type: ${metric.type}`);
    }
    if (!Object.values(MetricUnit).includes(metric.unit)) {
      throw new Error(`Invalid metric unit: ${metric.unit}`);
    }
    
    // Ensure value is not null
    if (metric.value === null) {
      metric.value = 0; // or another appropriate default value
    }

    return {
      ...metric,
      timestamp: new Date(),
      reference: `${metric.category}_${metric.component}_${metric.action}_${Date.now().toString(36)}`
    };
  });
}

async function processMetricsBatch(metrics: MetricEntry[]): Promise<void> {
  try {
    await Promise.all(metrics.map(async (metric) => {
      try {
        monitoringManager.metrics.recordMetric(
          metric.category,
          metric.component,
          metric.action,
          metric.value,
          metric.type || MetricType.COUNTER,
          metric.unit || MetricUnit.COUNT,
          metric.metadata
        );
      } catch (error) {
        console.error('Error recording metric:', error);
        throw error;
      }
    }));
    
    await monitoringManager.metrics.flush();
  } catch (error) {
    console.error('Failed to process metrics batch:', error);
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
      const validatedMetrics = await validateMetricsBatch(req.body);
      
      try {
        await processMetricsBatch(validatedMetrics);

        return res.status(200).json({
          success: true,
          message: 'Metrics processed and persisted successfully',
          count: validatedMetrics.length
        });
      } catch (error) {
        console.error('Error processing metrics:', error);
        return res.status(500).json({
          error: 'Failed to process metrics batch',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    if (req.method === 'GET') {
      const timeWindow = validateTimeWindow(req.query.timeWindow as string);
      const metrics = await monitoringManager.metrics.getAllMetrics();

      return res.status(200).json({
        success: true,
        data: metrics,
        timeWindow
      });
    }

    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    return res.status(405).json({
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('Error in metrics handler:', error);
    return res.status(500).json({
      error: 'Error processing metrics request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
