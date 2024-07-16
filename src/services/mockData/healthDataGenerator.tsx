// src/mockData/healthDataGenerator.ts

import type { HealthEnvironmentData } from '@/types';

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateMockHealthData(userId: string, days: number): HealthEnvironmentData[] {
  const mockData: HealthEnvironmentData[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);

    const entry: HealthEnvironmentData = {
      _id: `health${i + 1}`,
      userId: userId,
      basicHealthId: `basic${i + 1}`,
      environmentalId: `env${i + 1}`,
      scoresId: `score${i + 1}`,
      timestamp: currentDate.toISOString(),
      steps: Math.floor(randomInRange(5000, 15000)),
      heartRate: Math.floor(randomInRange(60, 100)),
      weight: randomInRange(65, 75),
      height: 175,
      location: { type: 'Point', coordinates: [-73.935242 + randomInRange(-0.1, 0.1), 40.730610 + randomInRange(-0.1, 0.1)] },
      activityLevel: ['sedentary', 'light', 'moderate', 'vigorous'][Math.floor(Math.random() * 4)] as any,
      regionId: 'region1',
      cityId: 'city1',
      areaId: 'area1',
      temperature: randomInRange(15, 30),
      humidity: randomInRange(40, 80),
      airQualityIndex: Math.floor(randomInRange(20, 150)),
      uvIndex: Math.floor(randomInRange(0, 11)),
      noiseLevel: Math.floor(randomInRange(30, 80)),
      latitude: 40.730610 + randomInRange(-0.1, 0.1),
      longitude: -73.935242 + randomInRange(-0.1, 0.1),
      respiratoryRate: Math.floor(randomInRange(12, 20)),
      oxygenSaturation: randomInRange(95, 100),
      activeEnergyBurned: Math.floor(randomInRange(200, 800)),
      cardioHealthScore: Math.floor(randomInRange(60, 100)),
      respiratoryHealthScore: Math.floor(randomInRange(60, 100)),
      physicalActivityScore: Math.floor(randomInRange(60, 100)),
      environmentalImpactScore: Math.floor(randomInRange(60, 100)),
      nearestCity: 'New York',
      onBorder: [],
      country: 'United States',
      state: 'New York', // Added state field
      continent: 'North America',
      airQualityDescription: ['Good', 'Moderate', 'Unhealthy for Sensitive Groups', 'Unhealthy'][Math.floor(Math.random() * 4)],
      uvIndexDescription: ['Low', 'Moderate', 'High', 'Very High'][Math.floor(Math.random() * 4)],
      noiseLevelDescription: ['Quiet', 'Moderate', 'Loud'][Math.floor(Math.random() * 3)],
      bmi: randomInRange(18.5, 25),
      environmentalImpact: ['Low', 'Moderate', 'High'][Math.floor(Math.random() * 3)],
      airQuality: ['Good', 'Moderate', 'Poor'][Math.floor(Math.random() * 3)],
    };

    mockData.push(entry);
  }

  return mockData;
}

export const mockHealthData = generateMockHealthData('user1', 100);


// import type { HealthEnvironmentData } from '../../types';

// export const mockHealthData: HealthEnvironmentData[] = [
//   {
//     _id: '1',
//     userId: 'user1',
//     basicHealthId: 'health1',
//     environmentalId: 'env1',
//     scoresId: 'score1',
//     timestamp: '2023-05-01T12:00:00Z',
//     steps: 8000,
//     heartRate: 72,
//     weight: 70,
//     height: 175,
//     location: { type: 'Point', coordinates: [-73.935242, 40.730610] },
//     activityLevel: 'moderate',
//     regionId: 'region1',
//     cityId: 'city1',
//     areaId: 'area1',
//     temperature: 22,
//     humidity: 60,
//     airQualityIndex: 50,
//     uvIndex: 5,
//     noiseLevel: 45,
//     latitude: 40.730610,
//     longitude: -73.935242,
//     respiratoryRate: 14,
//     oxygenSaturation: 98,
//     activeEnergyBurned: 300,
//     cardioHealthScore: 85,
//     respiratoryHealthScore: 90,
//     physicalActivityScore: 80,
//     environmentalImpactScore: 75,
//     nearestCity: 'New York',
//     onBorder: [],
//     country: 'United States',
//     continent: 'North America',
//     airQualityDescription: 'Moderate',
//     uvIndexDescription: 'Moderate',
//     noiseLevelDescription: 'Normal',
//     bmi: 22.9,
//     environmentalImpact: 'Low',
//     airQuality: 'Good',
//   },
//   // Add more mock data entries here...
// ];