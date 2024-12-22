import { verify, Secret, JwtPayload } from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { Server as SocketIOServer } from 'socket.io';

import { getActivityLevel, getLocationInfo } from '@/lib/helpers';
import {
  CACHE_DURATION,
  TOTAL_MOCK_DATA,
  PAGE_SIZE,
  SOCKET_PATH,
  SOCKET_UPDATE_INTERVAL
} from '@/constants';

import type { HealthEnvironmentData, GeoLocation } from '@/types';
import type { Server as HTTPServer, IncomingMessage } from 'http';
import type { Socket } from 'net';
import { NextApiRequest, NextApiResponse } from 'next';

interface SocketServer extends HTTPServer {
  io?: SocketIOServer;
}

type SocketWithIO = Socket & {
  server: SocketServer;
};

type NextApiResponseWithSocket = NextApiResponse & {
  socket: SocketWithIO;
};

let cachedData: HealthEnvironmentData[] = [];
const cachedPages: { [key: number]: { data: HealthEnvironmentData[]; timestamp: number } } = {};
let lastGeneratedTime = 0;

async function generateMockData(startIndex: number, count: number, req: IncomingMessage): Promise<HealthEnvironmentData[]> {
  return Promise.all(
    Array.from({ length: count }, async (_, i) => {
      const index = startIndex + i;
      const steps = Math.floor(Math.random() * 10000) + 2000;
      const timestamp = new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString();
      const latitude = (Math.random() * 180) - 90;
      const longitude = (Math.random() * 360) - 180;
      const locationDetails = await getLocationInfo(latitude, longitude);
      const weight = Math.floor(Math.random() * 10) + 60;
      const height = Math.floor(Math.random() * 50) + 150;

      const mockData: HealthEnvironmentData = {
        _id: new ObjectId().toString(),
        id: new ObjectId().toString(),
        basicHealthId: new ObjectId().toString(),
        environmentalId: new ObjectId().toString(),
        scoresId: new ObjectId().toString(),
        userId: new ObjectId().toString(),
        date: new Date(timestamp).toISOString(),
        timestamp,
        steps,
        heartRate: Math.floor(Math.random() * 30) + 60,
        bloodPressure: { systolic: 120, diastolic: 80 },
        temperature: Math.random() * 50 - 10,
        respiratoryRate: Math.floor(Math.random() * 10) + 10,
        oxygenSaturation: Math.floor(Math.random() * 5) + 95,
        glucose: Math.floor(Math.random() * 50) + 70,
        weight,
        height,
        bmi: Number((weight / Math.pow(height / 100, 2)).toFixed(1)),
        sleep: { duration: 8, quality: 0.8 },
        stress: Math.floor(Math.random() * 100),
        mood: Math.floor(Math.random() * 100),
        hydration: Math.floor(Math.random() * 100),
        nutrition: { calories: 2000, protein: 60, carbs: 250, fat: 70 },
        exercise: { duration: 30, intensity: 0.7, type: 'walking' },
        location: {
          latitude,
          longitude,
          accuracy: 10,
          timestamp: new Date().toISOString()
        },
        latitude,
        longitude,
        nearestCity: locationDetails?.city || 'Unknown',
        onBorder: [],
        country: locationDetails?.country || 'Unknown',
        continent: locationDetails?.continent || 'Unknown',
        state: locationDetails?.state || 'Unknown',
        regionId: new ObjectId().toString(),
        cityId: new ObjectId().toString(),
        areaId: new ObjectId().toString(),
        airQuality: Math.floor(Math.random() * 100),
        environmentalImpact: Math.floor(Math.random() * 100),
        humidity: Math.random() * 100,
        airQualityIndex: Math.floor(Math.random() * 500),
        uvIndex: Math.floor(Math.random() * 11),
        noiseLevel: Math.floor(Math.random() * 100) + 20,
        airQualityDescription: 'Moderate',
        uvIndexDescription: 'Low',
        noiseLevelDescription: 'Normal',
        cardioHealthScore: Math.floor(Math.random() * 100),
        respiratoryHealthScore: Math.floor(Math.random() * 100),
        physicalActivityScore: Math.floor(Math.random() * 100),
        environmentalImpactScore: Math.floor(Math.random() * 100),
        activityLevel: 'moderate' as any,
        activeEnergyBurned: Math.floor(Math.random() * 1000)
      };

      return mockData;
    })
  );
}

const verifyToken = (token: string): Promise<string | null> => {
  if (!process.env.JWT_SECRET) return Promise.resolve(null);
  return new Promise((resolve) => {
    verify(token, process.env.JWT_SECRET as Secret, (err, decoded) => {
      if (err || !decoded || typeof decoded === 'string') {
        resolve(null);
      } else {
        resolve((decoded as JwtPayload).userId?.toString() || null);
      }
    });
  });
};

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

export default async function getHealthData(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
): Promise<void> {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const userId = await verifyToken(token);
  if (!userId) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const pageNumber = parseInt(req.query.page as string, 10) || 1;
  if (pageNumber < 1) {
    return res.status(400).json({ message: 'Invalid page number' });
  }

  const startIndex = (pageNumber - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, TOTAL_MOCK_DATA);

  // Generate new mock data if necessary
  if (cachedData.length === 0 || !isCacheValid(lastGeneratedTime)) {
    cachedData = await generateMockData(0, TOTAL_MOCK_DATA, req);
    lastGeneratedTime = Date.now();
    // Clear the page cache when generating new data
    Object.keys(cachedPages).forEach(key => delete cachedPages[parseInt(key)]);
  }

  let paginatedData: HealthEnvironmentData[];

  // Check if the page is cached and valid
  if (cachedPages[pageNumber] && isCacheValid(cachedPages[pageNumber].timestamp)) {
    paginatedData = cachedPages[pageNumber].data;
  } else {
    paginatedData = cachedData.slice(startIndex, endIndex);
    
    // Fetch detailed location data
    paginatedData = await Promise.all(
      paginatedData.map(async (data) => {
        const locationDetails = await getLocationInfo(Number(data.latitude), Number(data.longitude));
        return { ...data, ...locationDetails };
      })
    );

    // Cache the page data
    cachedPages[pageNumber] = { data: paginatedData, timestamp: Date.now() };
  }

  // Initialize Socket.io server if not already initialized
  if (!res.socket.server.io) {
    console.log('Initializing Socket.io server...');
    const io = new SocketIOServer(res.socket.server as SocketServer, {
      path: SOCKET_PATH,
      addTrailingSlash: false,
    });
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('Client connected');
      socket.on('disconnect', () => console.log('Client disconnected'));
    });

    // Emit random health data every SOCKET_UPDATE_INTERVAL milliseconds
    setInterval(() => {
      const index = Math.floor(Math.random() * TOTAL_MOCK_DATA);
      io.emit('health-data', cachedData[index]);
    }, SOCKET_UPDATE_INTERVAL);
  }

  res.status(200).json({
    data: paginatedData,
    totalPages: Math.ceil(TOTAL_MOCK_DATA / PAGE_SIZE),
    currentPage: pageNumber,
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
