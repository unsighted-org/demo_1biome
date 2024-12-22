import { HealthEnvironmentData, HealthMetric, Location } from '@/types';
import { format } from 'date-fns';
import { z } from 'zod';
import { merge } from 'lodash';
import { randomUUID } from 'crypto';

// Schema validation for incoming health data
const healthDataSchema = z.object({
  timestamp: z.string(),
  metrics: z.record(z.number()),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
});

// Base adapter interface
interface HealthDataAdapter<T> {
  transform(data: T): Promise<HealthEnvironmentData[]>;
  validate(data: unknown): boolean;
  normalize(data: T): Promise<Record<string, number>>;
}

// Apple Health adapter
export class AppleHealthAdapter implements HealthDataAdapter<any> {
  private static readonly metricMapping: Record<string, keyof HealthEnvironmentData> = {
    'HKQuantityTypeIdentifierStepCount': 'physicalActivityScore',
    'HKQuantityTypeIdentifierHeartRate': 'cardioHealthScore',
    'HKQuantityTypeIdentifierActiveEnergyBurned': 'environmentalImpactScore',
    // Add more mappings as needed
  };

  async transform(data: any): Promise<HealthEnvironmentData[]> {
    const transformedData: HealthEnvironmentData[] = [];

    for (const sample of data.samples) {
      const metrics = await this.normalize(sample);
      const timestamp = format(new Date(sample.startDate), 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'');
      const longitude = sample.location?.longitude ?? 0;
      const latitude = sample.location?.latitude ?? 0;
      const location: Location = {
        type: 'Point',
        coordinates: [longitude, latitude] as [number, number]
      };
      
      transformedData.push({
        _id: randomUUID(),
        userId: '', // This should be set by the caller
        basicHealthId: randomUUID(),
        environmentalId: randomUUID(),
        scoresId: randomUUID(),
        timestamp,
        location,
        steps: sample.quantities?.HKQuantityTypeIdentifierStepCount ?? 0,
        heartRate: sample.quantities?.HKQuantityTypeIdentifierHeartRate ?? 0,
        weight: 0,
        height: 0,
        latitude,
        longitude,
        respiratoryRate: 0,
        oxygenSaturation: 0,
        activeEnergyBurned: sample.quantities?.HKQuantityTypeIdentifierActiveEnergyBurned ?? 0,
        nearestCity: '',
        onBorder: [],
        country: '',
        state: '',
        continent: '',
        airQualityDescription: '',
        uvIndexDescription: '',
        noiseLevelDescription: '',
        bmi: 0,
        environmentalImpact: '',
        airQuality: '',
        activityLevel: 'moderate',
        regionId: '',
        cityId: '',
        areaId: '',
        temperature: 0,
        humidity: 0,
        airQualityIndex: 0,
        uvIndex: 0,
        noiseLevel: 0,
        cardioHealthScore: 0,
        respiratoryHealthScore: 0,
        physicalActivityScore: 0,
        environmentalImpactScore: 0,
        ...metrics
      });
    }

    return transformedData;
  }

  validate(data: unknown): boolean {
    try {
      return healthDataSchema.parse(data) !== null;
    } catch {
      return false;
    }
  }

  async normalize(sample: any): Promise<Record<string, number>> {
    const normalized: Record<string, number> = {};

    for (const [key, value] of Object.entries(sample.quantities || {})) {
      const mappedMetric = AppleHealthAdapter.metricMapping[key];
      if (mappedMetric) {
        normalized[mappedMetric] = this.normalizeValue(key, value);
      }
    }

    return normalized;
  }

  private normalizeValue(metricType: string, value: unknown): number {
    const numValue = typeof value === 'number' ? value : 0;
    
    // Normalize values to a 0-100 scale based on metric type
    switch (metricType) {
      case 'HKQuantityTypeIdentifierStepCount':
        return Math.min(100, (numValue / 10000) * 100); // Assuming 10000 steps is 100%
      case 'HKQuantityTypeIdentifierHeartRate':
        return Math.max(0, Math.min(100, ((numValue - 40) / 160) * 100)); // Normalize between 40-200 bpm
      default:
        return numValue;
    }
  }
}

// Oura Ring adapter
export class OuraRingAdapter implements HealthDataAdapter<any> {
  private static readonly metricMapping: Record<string, keyof HealthEnvironmentData> = {
    'readiness_score': 'physicalActivityScore',
    'sleep_efficiency': 'cardioHealthScore',
    'activity_score': 'environmentalImpactScore',
    // Add more mappings as needed
  };

  async transform(data: any): Promise<HealthEnvironmentData[]> {
    const transformedData: HealthEnvironmentData[] = [];

    for (const day of data.daily) {
      const metrics = await this.normalize(day);
      const timestamp = format(new Date(day.day), 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'');
      const longitude = day.location?.longitude ?? 0;
      const latitude = day.location?.latitude ?? 0;
      const location: Location = {
        type: 'Point',
        coordinates: [longitude, latitude] as [number, number]
      };
      
      transformedData.push({
        _id: randomUUID(),
        userId: '', // This should be set by the caller
        basicHealthId: randomUUID(),
        environmentalId: randomUUID(),
        scoresId: randomUUID(),
        timestamp,
        location,
        steps: day.activity?.steps ?? 0,
        heartRate: 0,
        weight: 0,
        height: 0,
        latitude,
        longitude,
        respiratoryRate: 0,
        oxygenSaturation: 0,
        activeEnergyBurned: day.activity?.calories ?? 0,
        nearestCity: '',
        onBorder: [],
        country: '',
        state: '',
        continent: '',
        airQualityDescription: '',
        uvIndexDescription: '',
        noiseLevelDescription: '',
        bmi: 0,
        environmentalImpact: '',
        airQuality: '',
        activityLevel: 'moderate',
        regionId: '',
        cityId: '',
        areaId: '',
        temperature: 0,
        humidity: 0,
        airQualityIndex: 0,
        uvIndex: 0,
        noiseLevel: 0,
        cardioHealthScore: 0,
        respiratoryHealthScore: 0,
        physicalActivityScore: 0,
        environmentalImpactScore: 0,
        ...metrics
      });
    }

    return transformedData;
  }

  validate(data: unknown): boolean {
    try {
      return healthDataSchema.parse(data) !== null;
    } catch {
      return false;
    }
  }

  async normalize(day: any): Promise<Record<string, number>> {
    const normalized: Record<string, number> = {};

    for (const [key, value] of Object.entries(day)) {
      const mappedMetric = OuraRingAdapter.metricMapping[key];
      if (mappedMetric && typeof value === 'number') {
        normalized[mappedMetric] = value;
      }
    }

    return normalized;
  }
}

// Data merger utility
export class HealthDataMerger {
  static async mergeData(datasets: HealthEnvironmentData[][]): Promise<HealthEnvironmentData[]> {
    const mergedMap = new Map<string, HealthEnvironmentData>();

    for (const dataset of datasets) {
      for (const data of dataset) {
        const key = `${data.timestamp}_${data.location?.coordinates[1]}_${data.location?.coordinates[0]}`;
        
        if (mergedMap.has(key)) {
          const existing = mergedMap.get(key)!;
          mergedMap.set(key, merge({}, existing, data));
        } else {
          mergedMap.set(key, data);
        }
      }
    }

    return Array.from(mergedMap.values());
  }

  static interpolateMissingValues(data: HealthEnvironmentData[]): HealthEnvironmentData[] {
    return data.map(item => {
      const result = { ...item };
      
      // Ensure all required metrics exist
      const requiredMetrics: HealthMetric[] = [
        'physicalActivityScore',
        'cardioHealthScore',
        'environmentalImpactScore'
      ];

      for (const metric of requiredMetrics) {
        if (!(metric in result)) {
          // Use average of available metrics or default value
          const availableMetrics = requiredMetrics
            .filter(m => m in result)
            .map(m => result[m]);
          
          result[metric] = availableMetrics.length > 0
            ? availableMetrics.reduce((a, b) => a + b, 0) / availableMetrics.length
            : 50; // Default value
        }
      }

      return result;
    });
  }
}
