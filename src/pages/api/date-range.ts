import { parse, isValid, isAfter, parseISO, format } from 'date-fns';
import { NextApiRequest, NextApiResponse } from 'next';
import { healthIntegrationService } from '@/services/healthIntegrations';
import { HealthEnvironmentData } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method === 'POST') {
    try {
      const { startDate, endDate } = req.body;

      // Parse dates, expecting ISO format or yyyy-MM-dd
      let parsedStartDate: Date;
      let parsedEndDate: Date;

      try {
        // First try parsing as ISO string
        parsedStartDate = parseISO(startDate);
        parsedEndDate = parseISO(endDate);
      } catch {
        // Fallback to yyyy-MM-dd format
        parsedStartDate = parse(startDate, 'yyyy-MM-dd', new Date());
        parsedEndDate = parse(endDate, 'yyyy-MM-dd', new Date());
      }

      if (!isValid(parsedStartDate) || !isValid(parsedEndDate)) {
        return res.status(400).json({ error: 'Invalid date format. Expected ISO format or yyyy-MM-dd' });
      }

      if (isAfter(parsedStartDate, parsedEndDate)) {
        return res.status(400).json({ error: 'Start date must be before end date' });
      }

      // Format dates to consistent ISO format for our services
      const formattedStartDate = format(parsedStartDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
      const formattedEndDate = format(parsedEndDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");

      // Fetch health data for the date range
      await healthIntegrationService.syncHealthData();
      const healthData = await healthIntegrationService.fetchHealthData(parsedStartDate, parsedEndDate);

      // Transform the data for response
      const response = {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        data: healthData || [],
        summary: healthData ? calculateSummary(healthData) : null
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error('Error processing date range request:', error);
      return res.status(500).json({ error: 'Internal server error processing date range' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

function calculateSummary(data: HealthEnvironmentData[]) {
  if (!data.length) return null;

  return {
    totalSteps: data.reduce((sum, item) => sum + (item.steps || 0), 0),
    averageHeartRate: data.reduce((sum, item) => sum + (item.heartRate || 0), 0) / data.length,
    totalSleepDuration: data.reduce((sum, item) => sum + (item.sleep?.duration || 0), 0),
    averagePhysicalActivityScore: data.reduce((sum, item) => sum + (item.physicalActivityScore || 0), 0) / data.length,
  };
}
