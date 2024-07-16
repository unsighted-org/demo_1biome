import { ObjectId } from 'mongodb';
import { Server as SocketIOServer } from 'socket.io';

import { getCosmosClient } from '@/config/azureConfig';
import {
  CACHE_DURATION,
  PAGE_SIZE,
  SOCKET_PATH,
  SOCKET_UPDATE_INTERVAL
} from '@/constants';
import { getActivityLevel, getEnvironmentalImpact, getAirQualityDescription, getUVIndexDescription, getNoiseLevelDescription } from '@/lib/helpers';

import type { HealthEnvironmentData, ServerHealthEnvironmentData } from '@/types';
import type { FindOptions} from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

interface SocketServer extends NodeJS.ReadWriteStream {
  io?: SocketIOServer;
  server?: any;
}

const cachedPages: { [key: number]: { data: HealthEnvironmentData[]; timestamp: number } } = {};

async function fetchHealthData(userId: string, pageNumber: number, limitNumber: number): Promise<HealthEnvironmentData[]> {
  const client = await getCosmosClient();
  if (!client) {
    throw new Error("Failed to connect to the database");
  }

  const db = client.db('aetheriqdatabasemain');
  const collection = db.collection<ServerHealthEnvironmentData>('healthData');

  // Ensure the collection exists
  await db.createCollection('healthData').catch(err => {
    if (err.code !== 48) { // 48 is the error code for "collection already exists"
      throw err;
    }
  });

  // Ensure index on userId and timestamp
  await collection.createIndex({ userId: 1, timestamp: -1 });

  const query = { userId: new ObjectId(userId) };
  const options = {
    sort: { timestamp: -1 },
    skip: (pageNumber - 1) * limitNumber,
    limit: limitNumber
  } as FindOptions<Document>;
  
  const items = await collection.find(query, options).toArray();

  return items.map(item => ({
    ...item,
    _id: item._id.toString(),
    userId: item.userId.toString(),
    basicHealthId: item.basicHealthId.toString(),
    environmentalId: item.environmentalId.toString(),
    scoresId: item.scoresId.toString(),
    regionId: item.regionId.toString(),
    cityId: item.cityId.toString(),
    areaId: item.areaId.toString(),
    timestamp: item.timestamp.toISOString(),
    airQualityDescription: getAirQualityDescription(item.airQualityIndex),
    uvIndexDescription: getUVIndexDescription(item.uvIndex),
    noiseLevelDescription: getNoiseLevelDescription(item.noiseLevel),
    environmentalImpact: getEnvironmentalImpact(item),
    bmi: Number((item.weight / Math.pow(item.height / 100, 2)).toFixed(1)),
    airQuality: getAirQualityDescription(item.airQualityIndex),
  }));
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { page = '1', limit = '100', userId } = req.query;
  const pageNumber = parseInt(page as string, 10);
  const limitNumber = parseInt(limit as string, 10);

  if (pageNumber < 1 || !userId) {
    return res.status(400).json({ error: 'Invalid page number or missing userId' });
  }

  try {
    let paginatedData: HealthEnvironmentData[];

    if (cachedPages[pageNumber] && isCacheValid(cachedPages[pageNumber].timestamp)) {
      paginatedData = cachedPages[pageNumber].data;
    } else {
      paginatedData = await fetchHealthData(userId as string, pageNumber, limitNumber);
      cachedPages[pageNumber] = { data: paginatedData, timestamp: Date.now() };
    }

    // Socket.io setup
    if (!(res.socket as SocketServer).io) {
      const io = new SocketIOServer((res.socket as SocketServer).server, {
        path: SOCKET_PATH,
        addTrailingSlash: false,
      });
      (res.socket as SocketServer).io = io;

      io.on('connection', (socket) => {
        console.log('Client connected');
        socket.on('disconnect', () => console.log('Client disconnected'));
      });

      // In production, you'd replace this with real-time data updates
      setInterval(async () => {
        try {
          const latestData = await fetchHealthData(userId as string, 1, 1);
          if (latestData.length > 0) {
            io.emit('health-data', latestData[0]);
          }
        } catch (error) {
          console.error('Error fetching real-time data:', error);
        }
      }, SOCKET_UPDATE_INTERVAL);
    }

    const client = await getCosmosClient();
    if (!client) {
      throw new Error("Failed to connect to the database");
    }

    const db = client.db('aetheriqdatabasemain');
    const collection = db.collection<ServerHealthEnvironmentData>('healthData');

    const totalCount = await collection.countDocuments({ userId: new ObjectId(userId as string) });

    res.status(200).json({
      data: paginatedData,
      totalPages: Math.ceil(totalCount / limitNumber),
      currentPage: pageNumber,
    });
  } catch (error) {
    console.error('Error fetching health data:', error);
    res.status(500).json({ error: 'Failed to fetch health data', details: (error as Error).message });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};