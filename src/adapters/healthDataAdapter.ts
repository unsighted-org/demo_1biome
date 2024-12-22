import { HealthEnvironmentData, GeoLocation } from '@/types';
import { 
  HealthKitData, 
  OuraRingData, 
  OuraSleep, 
  OuraActivity, 
  OuraReadiness 
} from '@/types/healthDevices';
import { format, parseISO } from 'date-fns';
import { z } from 'zod';
import { merge } from 'lodash';
import { ActivityLevel, BloodPressure, Exercise, Nutrition, Sleep } from '@/types/health';

// Helper function to generate UUID using Web Crypto API
function generateUUID(): string {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto.randomUUID();
  }
  // Fallback for non-browser environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
  normalize(data: T): Promise<Partial<Record<string, number>>>;
}

// Apple Health adapter
export class AppleHealthAdapter implements HealthDataAdapter<HealthKitData> {
  private static readonly metricMapping: Record<string, keyof HealthEnvironmentData> = {
    'steps': 'steps',
    'activeEnergy': 'activeEnergyBurned',
    'heartRate': 'heartRate',
    'respiratoryRate': 'respiratoryRate',
    'oxygenSaturation': 'oxygenSaturation',
    'bodyTemperature': 'temperature'
  };

  async transform(data: HealthKitData): Promise<HealthEnvironmentData[]> {
    const transformedData: HealthEnvironmentData[] = [];
    
    // Get the latest timestamp from available data
    let timestamp: string;
    if (data.heartRate.length > 0) {
      timestamp = format(parseISO(data.heartRate[data.heartRate.length - 1].endDate), "yyyy-MM-dd'T'HH:mm:ss'Z'");
    } else if (data.sleepAnalysis.length > 0) {
      timestamp = format(parseISO(data.sleepAnalysis[data.sleepAnalysis.length - 1].endDate), "yyyy-MM-dd'T'HH:mm:ss'Z'");
    } else if (data.workout.length > 0) {
      timestamp = format(parseISO(data.workout[data.workout.length - 1].endDate), "yyyy-MM-dd'T'HH:mm:ss'Z'");
    } else {
      timestamp = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'");
    }

    // Calculate average heart rate
    const avgHeartRate = data.heartRate.length > 0
      ? data.heartRate.reduce((sum, hr) => sum + hr.value, 0) / data.heartRate.length
      : 0;

    // Process sleep data
    const latestSleep = data.sleepAnalysis
      .filter(sleep => sleep.value === 'ASLEEP')
      .reduce((latest, current) => {
        return !latest || new Date(current.endDate) > new Date(latest.endDate)
          ? current
          : latest;
      }, data.sleepAnalysis[0]);

    const sleepDuration = latestSleep
      ? (new Date(latestSleep.endDate).getTime() - new Date(latestSleep.startDate).getTime()) / (1000 * 60 * 60)
      : 0;

    // Get latest workout
    const latestWorkout = data.workout[data.workout.length - 1];

    const healthData: HealthEnvironmentData = {
      id: generateUUID(),
      date: timestamp,
      steps: data.steps,
      heartRate: avgHeartRate,
      bloodPressure: data.bloodPressure?.[0] ?? defaultBloodPressure,
      temperature: data.bodyTemperature?.[0]?.value ?? 0,
      respiratoryRate: data.respiratoryRate?.[0]?.value ?? 0,
      oxygenSaturation: data.oxygenSaturation?.[0]?.value ?? 0,
      glucose: 0,
      weight: data.weight?.[0]?.value ?? 0,
      height: data.height?.[0]?.value ?? 0,
      bmi: 0, // Calculate if both height and weight are available
      sleep: {
        duration: sleepDuration,
        quality: 0.8 // Default as HealthKit doesn't provide sleep quality
      },
      stress: 0,
      mood: 0,
      hydration: 0,
      nutrition: {
        calories: 2000, // Default values as HealthKit might not provide nutrition
        protein: 60,
        carbs: 250,
        fat: 70
      },
      exercise: latestWorkout ? {
        duration: latestWorkout.duration,
        intensity: latestWorkout.averageHeartRate ? latestWorkout.averageHeartRate / 180 : 0.7,
        type: latestWorkout.type.toLowerCase()
      } : {
        duration: 0,
        intensity: 0,
        type: 'none'
      },
      airQuality: 0,
      environmentalImpact: 0,
      cardioHealthScore: this.calculateCardioScore(avgHeartRate, data.bloodPressure?.[0]),
      respiratoryHealthScore: this.calculateRespiratoryScore(data.respiratoryRate?.[0]?.value, data.oxygenSaturation?.[0]?.value),
      physicalActivityScore: this.calculateActivityScore(data.steps, latestWorkout),
      environmentalImpactScore: 0,
      location: {
        latitude: 0,
        longitude: 0,
        accuracy: 0,
        timestamp
      },
      _id: '',
      basicHealthId: '',
      environmentalId: '',
      scoresId: '',
      userId: '',
      latitude: 0,
      longitude: 0,
      activeEnergyBurned: data.activeEnergy,
      nearestCity: '',
      onBorder: [],
      country: '',
      state: '',
      continent: '',
      regionId: '',
      cityId: '',
      areaId: '',
      humidity: 0,
      airQualityIndex: 0,
      uvIndex: 0,
      noiseLevel: 0,
      airQualityDescription: '',
      uvIndexDescription: '',
      noiseLevelDescription: '',
      timestamp,
      activityLevel: this.determineActivityLevel(data.steps, data.activeEnergy)
    };

    if (healthData.weight && healthData.height) {
      healthData.bmi = healthData.weight / Math.pow(healthData.height / 100, 2);
    }

    transformedData.push(healthData);
    return transformedData;
  }

  private calculateCardioScore(heartRate: number, bloodPressure?: { systolic: number; diastolic: number }): number {
    let score = 0;
    if (heartRate >= 60 && heartRate <= 100) score += 50;
    if (bloodPressure && bloodPressure.systolic <= 120 && bloodPressure.diastolic <= 80) score += 50;
    return score;
  }

  private calculateRespiratoryScore(respiratoryRate?: number, oxygenSaturation?: number): number {
    let score = 0;
    if (respiratoryRate && respiratoryRate >= 12 && respiratoryRate <= 20) score += 50;
    if (oxygenSaturation && oxygenSaturation >= 95) score += 50;
    return score;
  }

  private calculateActivityScore(steps: number, workout?: any): number {
    let score = 0;
    if (steps >= 10000) score += 50;
    if (workout && workout.duration >= 30) score += 50;
    return score;
  }

  private determineActivityLevel(steps: number, activeEnergy: number): ActivityLevel {
    if (steps > 15000 || activeEnergy > 800) return 'vigorous';
    if (steps > 10000 || activeEnergy > 500) return 'moderate';
    if (steps > 5000 || activeEnergy > 200) return 'light';
    return 'sedentary';
  }

  validate(data: unknown): boolean {
    try {
      return healthDataSchema.parse(data) !== null;
    } catch {
      return false;
    }
  }

  async normalize(data: HealthKitData): Promise<Partial<Record<string, number>>> {
    const normalized: Partial<Record<string, number>> = {};
    
    for (const [key, value] of Object.entries(data)) {
      const mappedMetric = AppleHealthAdapter.metricMapping[key as keyof typeof AppleHealthAdapter.metricMapping];
      if (mappedMetric && typeof value === 'number') {
        normalized[mappedMetric] = value;
      }
    }

    return normalized;
  }
}

// Oura Ring adapter
export class OuraRingAdapter implements HealthDataAdapter<OuraRingData> {
  private static readonly metricMapping: Record<string, keyof HealthEnvironmentData> = {
    'score': 'physicalActivityScore',
    'efficiency': 'cardioHealthScore',
    'activity_score': 'environmentalImpactScore',
    'temperature_delta': 'temperature',
    'breath_average': 'respiratoryRate',
    'hr_average': 'heartRate'
  };

  async transform(data: OuraRingData): Promise<HealthEnvironmentData[]> {
    const transformedData: HealthEnvironmentData[] = [];
    
    // Parse the summary date and format it as ISO string
    const timestamp = data.sleep.summary_date 
      ? format(parseISO(data.sleep.summary_date), "yyyy-MM-dd'T'HH:mm:ss'Z'")
      : format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'");

    const healthData: HealthEnvironmentData = {
      id: generateUUID(),
      date: timestamp,
      steps: data.activity.steps,
      heartRate: data.sleep.hr_average,
      bloodPressure: defaultBloodPressure,
      temperature: data.sleep.temperature_delta,
      respiratoryRate: data.sleep.breath_average,
      oxygenSaturation: 0,
      glucose: 0,
      weight: 0,
      height: 0,
      bmi: 0,
      sleep: {
        duration: data.sleep.duration / 3600, // Convert from seconds to hours
        quality: data.sleep.efficiency / 100, // Convert from percentage to decimal
      },
      stress: 0,
      mood: 0,
      hydration: 0,
      nutrition: {
        calories: data.activity.cal_total,
        protein: 60, // Default values as Oura doesn't provide detailed nutrition
        carbs: 250,
        fat: 70
      },
      exercise: {
        duration: (data.activity.high + data.activity.medium) / 60, // Convert minutes to hours
        intensity: data.activity.average_met / 10, // Normalize MET to 0-1 scale
        type: this.determineExerciseType(data.activity)
      },
      airQuality: 0,
      environmentalImpact: 0,
      cardioHealthScore: this.calculateCardioScore(data),
      respiratoryHealthScore: this.calculateRespiratoryScore(data),
      physicalActivityScore: this.calculateActivityScore(data),
      environmentalImpactScore: 0,
      location: {
        latitude: 0,
        longitude: 0,
        accuracy: 0,
        timestamp
      },
      _id: '',
      basicHealthId: '',
      environmentalId: '',
      scoresId: '',
      userId: '',
      latitude: 0,
      longitude: 0,
      activeEnergyBurned: data.activity.cal_active,
      nearestCity: '',
      onBorder: [],
      country: '',
      state: '',
      continent: '',
      regionId: '',
      cityId: '',
      areaId: '',
      humidity: 0,
      airQualityIndex: 0,
      uvIndex: 0,
      noiseLevel: 0,
      airQualityDescription: '',
      uvIndexDescription: '',
      noiseLevelDescription: '',
      timestamp,
      activityLevel: this.determineActivityLevel(data.activity)
    };

    transformedData.push(healthData);
    return transformedData;
  }

  private calculateCardioScore(data: OuraRingData): number {
    const readinessWeight = 0.4;
    const sleepWeight = 0.6;
    
    const readinessScore = data.readiness.score;
    const sleepScore = data.sleep.score;
    
    return (readinessScore * readinessWeight + sleepScore * sleepWeight);
  }

  private calculateRespiratoryScore(data: OuraRingData): number {
    const breathAvg = data.sleep.breath_average;
    const hrv = data.readiness.heart_rate_variability_balance;
    
    let score = 0;
    if (breathAvg >= 12 && breathAvg <= 20) score += 50;
    if (hrv >= 50) score += 50;
    
    return score;
  }

  private calculateActivityScore(data: OuraRingData): number {
    return data.activity.score;
  }

  private determineActivityLevel(activity: OuraActivity): ActivityLevel {
    const totalActiveTime = activity.high + activity.medium;
    const met = activity.average_met;

    if (totalActiveTime > 120 || met > 6) return 'vigorous';
    if (totalActiveTime > 60 || met > 4) return 'moderate';
    if (totalActiveTime > 30 || met > 2) return 'light';
    return 'sedentary';
  }

  private determineExerciseType(activity: OuraActivity): string {
    if (activity.high > activity.medium) return 'intense';
    if (activity.medium > activity.low) return 'moderate';
    return 'light';
  }

  validate(data: unknown): boolean {
    try {
      return healthDataSchema.parse(data) !== null;
    } catch {
      return false;
    }
  }

  async normalize(data: OuraRingData): Promise<Partial<Record<keyof HealthEnvironmentData, number>>> {
    const normalized: Partial<Record<keyof HealthEnvironmentData, number>> = {};

    // Normalize readiness data
    if (data.readiness) {
      normalized.physicalActivityScore = data.readiness.score;
      normalized.cardioHealthScore = data.readiness.resting_heart_rate;
    }

    // Normalize sleep data
    if (data.sleep) {
      normalized.respiratoryRate = data.sleep.breath_average;
      normalized.temperature = data.sleep.temperature_delta;
    }

    // Normalize activity data
    if (data.activity) {
      normalized.steps = data.activity.steps;
      normalized.activeEnergyBurned = data.activity.cal_active;
    }

    return normalized;
  }
}

// Data merger utility
export class HealthDataMerger {
  static mergeData(datasets: HealthEnvironmentData[][]): HealthEnvironmentData[] {
    const mergedMap = new Map<string, HealthEnvironmentData>();

    for (const dataset of datasets) {
      for (const data of dataset) {
        const key = `${data.date}_${data.location.latitude}_${data.location.longitude}`;
        
        if (mergedMap.has(key)) {
          const existing = mergedMap.get(key)!;
          mergedMap.set(key, merge({}, existing, data));
        } else {
          mergedMap.set(key, { ...data });
        }
      }
    }

    return Array.from(mergedMap.values());
  }
}

const defaultBloodPressure: BloodPressure = {
  systolic: 120,
  diastolic: 80
};

const defaultSleep: Sleep = {
  duration: 8,
  quality: 0.8
};

const defaultNutrition: Nutrition = {
  calories: 2000,
  protein: 60,
  carbs: 250,
  fat: 70
};

const defaultExercise: Exercise = {
  duration: 30,
  intensity: 0.7,
  type: 'walking'
};

const defaultLocation: GeoLocation = {
  latitude: 0,
  longitude: 0,
  accuracy: 10,
  timestamp: new Date().toISOString()
};

export function adaptHealthData(rawData: any): HealthEnvironmentData {
  return {
    _id: String(rawData._id || ''),
    id: String(rawData.id || generateUUID()),
    basicHealthId: String(rawData.basicHealthId || ''),
    environmentalId: String(rawData.environmentalId || ''),
    scoresId: String(rawData.scoresId || ''),
    userId: String(rawData.userId || ''),
    date: String(rawData.date || new Date().toISOString()),
    timestamp: String(rawData.timestamp || new Date().toISOString()),
    steps: Number(rawData.steps || 0),
    heartRate: Number(rawData.heartRate || 0),
    bloodPressure: typeof rawData.bloodPressure === 'object' ? rawData.bloodPressure : defaultBloodPressure,
    temperature: Number(rawData.temperature || 0),
    respiratoryRate: Number(rawData.respiratoryRate || 0),
    oxygenSaturation: Number(rawData.oxygenSaturation || 0),
    glucose: Number(rawData.glucose || 0),
    weight: Number(rawData.weight || 0),
    height: Number(rawData.height || 0),
    bmi: Number(rawData.bmi || 0),
    sleep: typeof rawData.sleep === 'object' ? rawData.sleep : defaultSleep,
    stress: Number(rawData.stress || 0),
    mood: Number(rawData.mood || 0),
    hydration: Number(rawData.hydration || 0),
    nutrition: typeof rawData.nutrition === 'object' ? rawData.nutrition : defaultNutrition,
    exercise: typeof rawData.exercise === 'object' ? rawData.exercise : defaultExercise,
    location: typeof rawData.location === 'object' ? rawData.location : defaultLocation,
    latitude: Number(rawData.latitude || 0),
    longitude: Number(rawData.longitude || 0),
    nearestCity: String(rawData.nearestCity || ''),
    onBorder: Array.isArray(rawData.onBorder) ? rawData.onBorder : [],
    country: String(rawData.country || ''),
    state: String(rawData.state || ''),
    continent: String(rawData.continent || ''),
    regionId: String(rawData.regionId || ''),
    cityId: String(rawData.cityId || ''),
    areaId: String(rawData.areaId || ''),
    airQuality: Number(rawData.airQuality || 0),
    environmentalImpact: Number(rawData.environmentalImpact || 0),
    humidity: Number(rawData.humidity || 0),
    airQualityIndex: Number(rawData.airQualityIndex || 0),
    uvIndex: Number(rawData.uvIndex || 0),
    noiseLevel: Number(rawData.noiseLevel || 0),
    airQualityDescription: String(rawData.airQualityDescription || ''),
    uvIndexDescription: String(rawData.uvIndexDescription || ''),
    noiseLevelDescription: String(rawData.noiseLevelDescription || ''),
    cardioHealthScore: Number(rawData.cardioHealthScore || 0),
    respiratoryHealthScore: Number(rawData.respiratoryHealthScore || 0),
    physicalActivityScore: Number(rawData.physicalActivityScore || 0),
    environmentalImpactScore: Number(rawData.environmentalImpactScore || 0),
    activityLevel: (rawData.activityLevel || 'light') as ActivityLevel,
    activeEnergyBurned: Number(rawData.activeEnergyBurned || 0)
  };
}

export function createEmptyHealthData(location: { latitude: number; longitude: number }): HealthEnvironmentData {
  return {
    _id: '',
    basicHealthId: '',
    environmentalId: '',
    scoresId: '',
    latitude: 0,
    longitude: 0,
    activeEnergyBurned: 0,
    nearestCity: String(''),
    onBorder: [],
    country: '',
    state: '',
    continent: '',
    airQualityDescription: '',
    uvIndexDescription: '',
    noiseLevelDescription: '',
    userId: '',
    timestamp: new Date().toISOString(),
    activityLevel: 'light',
    regionId: '',
    cityId: '',
    areaId: '',
    humidity: 0,
    airQualityIndex: 0,
    uvIndex: 0,
    noiseLevel: 0,
    id: generateUUID(),
    date: new Date().toISOString(),
    steps: 0,
    heartRate: 0,
    bloodPressure: {
      systolic: 120,
      diastolic: 80
    },
    temperature: 0,
    respiratoryRate: 0,
    oxygenSaturation: 0,
    glucose: 0,
    weight: 0,
    height: 0,
    bmi: 0,
    sleep: {
      duration: 8,
      quality: 0.8
    },
    stress: 0,
    mood: 0,
    hydration: 0,
    nutrition: {
      calories: 2000,
      protein: 60,
      carbs: 250,
      fat: 70
    },
    exercise: {
      duration: 30,
      intensity: 0.7,
      type: 'walking'
    },
    airQuality: 0,
    environmentalImpact: 0,
    cardioHealthScore: 0,
    respiratoryHealthScore: 0,
    physicalActivityScore: 0,
    environmentalImpactScore: 0,
    location
  };
}
