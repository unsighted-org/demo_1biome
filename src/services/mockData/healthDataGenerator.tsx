import { HealthEnvironmentData, GeoLocation, ActivityLevel } from '@/types';
import { randomUUID } from 'crypto';

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function generateMockHealthData(userId: string, days: number = 7): HealthEnvironmentData[] {
  const mockData: HealthEnvironmentData[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    const timestamp = currentDate.toISOString();

    const location: GeoLocation = {
      latitude: 37.7749 + randomInRange(-0.1, 0.1),
      longitude: -122.4194 + randomInRange(-0.1, 0.1),
      timestamp
    };

    const activityLevels: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'vigorous'];
    const activityLevel = activityLevels[Math.floor(Math.random() * activityLevels.length)];

    mockData.push({
      _id: randomUUID(),
      id: randomUUID(),
      basicHealthId: randomUUID(),
      environmentalId: randomUUID(),
      scoresId: randomUUID(),
      userId,
      timestamp,
      date: timestamp,
      location,
      latitude: location.latitude,
      longitude: location.longitude,
      nearestCity: 'San Francisco',
      onBorder: [],
      country: 'United States',
      state: 'California',
      continent: 'North America',
      regionId: 'sf-bay-area',
      cityId: 'san-francisco',
      areaId: 'downtown',
      steps: Math.floor(randomInRange(5000, 15000)),
      heartRate: Math.floor(randomInRange(60, 100)),
      bloodPressure: {
        systolic: Math.floor(randomInRange(110, 130)),
        diastolic: Math.floor(randomInRange(70, 90))
      },
      temperature: randomInRange(36.1, 37.2),
      respiratoryRate: Math.floor(randomInRange(12, 20)),
      oxygenSaturation: Math.floor(randomInRange(95, 100)),
      glucose: Math.floor(randomInRange(70, 140)),
      weight: randomInRange(60, 90),
      height: randomInRange(160, 190),
      bmi: randomInRange(18.5, 24.9),
      sleep: {
        duration: randomInRange(6, 9),
        quality: randomInRange(0.6, 1)
      },
      stress: randomInRange(0, 100),
      mood: randomInRange(0, 100),
      hydration: randomInRange(0, 100),
      nutrition: {
        calories: Math.floor(randomInRange(1800, 2500)),
        protein: Math.floor(randomInRange(50, 100)),
        carbs: Math.floor(randomInRange(200, 300)),
        fat: Math.floor(randomInRange(50, 80))
      },
      exercise: {
        duration: Math.floor(randomInRange(20, 60)),
        intensity: randomInRange(0.4, 0.9),
        type: 'walking'
      },
      activeEnergyBurned: Math.floor(randomInRange(200, 600)),
      activityLevel,
      airQuality: Math.floor(randomInRange(0, 100)),
      environmentalImpact: Math.floor(randomInRange(0, 100)),
      humidity: Math.floor(randomInRange(30, 70)),
      airQualityIndex: Math.floor(randomInRange(0, 200)),
      uvIndex: Math.floor(randomInRange(0, 11)),
      noiseLevel: Math.floor(randomInRange(30, 80)),
      airQualityDescription: ['Good', 'Moderate', 'Unhealthy'][Math.floor(Math.random() * 3)],
      uvIndexDescription: ['Low', 'Moderate', 'High'][Math.floor(Math.random() * 3)],
      noiseLevelDescription: ['Quiet', 'Moderate', 'Loud'][Math.floor(Math.random() * 3)],
      cardioHealthScore: Math.floor(randomInRange(0, 100)),
      respiratoryHealthScore: Math.floor(randomInRange(0, 100)),
      physicalActivityScore: Math.floor(randomInRange(0, 100)),
      environmentalImpactScore: Math.floor(randomInRange(0, 100))
    });
  }

  return mockData;
}

export const mockHealthData = generateMockHealthData('user1', 100);