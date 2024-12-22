import type { GeoLocation } from './geo';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'vigorous';
export type HealthTrendPeriod = '1d' | '7d' | '30d' | '90d' | '1y';
export type HealthDataCategory = 'cardio' | 'respiratory' | 'physical' | 'environmental';

export interface BloodPressure {
  systolic: number;
  diastolic: number;
}

export interface Sleep {
  duration: number;
  quality: number;
  startTime?: string;
  endTime?: string;
  deepSleepDuration?: number;
  remSleepDuration?: number;
  lightSleepDuration?: number;
}

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  water?: number;
}

export interface Exercise {
  duration: number;
  intensity: number;
  type: string;
  caloriesBurned?: number;
  distance?: number;
  steps?: number;
  heartRateAvg?: number;
  heartRateMax?: number;
}

export interface HealthScore {
  cardioHealthScore: number;
  respiratoryHealthScore: number;
  physicalActivityScore: number;
  environmentalImpactScore: number;
}

export interface HealthTrendData {
  date: string;
  value: number;
  category: HealthDataCategory;
}

export interface HealthSummary {
  period: HealthTrendPeriod;
  averageScore: number;
  trends: HealthTrendData[];
  recommendations?: string[];
}

export interface HealthEnvironmentData extends HealthScore {
  _id: string;
  id: string;
  basicHealthId: string;
  environmentalId: string;
  scoresId: string;
  userId: string;
  date: string;
  timestamp: string;
  steps: number;
  heartRate: number;
  bloodPressure: BloodPressure;
  temperature: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  glucose: number;
  weight: number;
  height: number;
  bmi: number;
  sleep: Sleep;
  stress: number;
  mood: number;
  hydration: number;
  nutrition: Nutrition;
  exercise: Exercise;
  location: GeoLocation;
  latitude: number;
  longitude: number;
  nearestCity: string;
  onBorder: string[];
  country: string;
  state: string;
  continent: string;
  regionId: string;
  cityId: string;
  areaId: string;
  airQuality: number;
  environmentalImpact: number;
  humidity: number;
  airQualityIndex: number;
  uvIndex: number;
  noiseLevel: number;
  airQualityDescription: string;
  uvIndexDescription: string;
  noiseLevelDescription: string;
  activityLevel: ActivityLevel;
  activeEnergyBurned: number;
}

export type HealthMetric = keyof HealthEnvironmentData;

export interface HealthDataRange {
  min: number;
  max: number;
  optimal: number;
  unit: string;
}

export interface HealthMetricConfig {
  metric: HealthMetric;
  label: string;
  description?: string;
  range?: HealthDataRange;
  category: HealthDataCategory;
}
