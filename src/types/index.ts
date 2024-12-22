import type { ObjectId } from 'mongodb';

// User-related interfaces
export interface User {
  _id: string;
  email: string;
  name: string;
  password: string;
  createdAt: string; // ISO 8601 string
  dateOfBirth: string; // ISO 8601 string (date only)
  height: number;
  weight: number;
  avatarUrl: string | null;
  connectedDevices: string[];
}

export interface EnterpriseUser extends User { 
  enterprise?: {
    name: string;
    contactNumber: string;
    address: string;
  }
}

export interface InsuranceUser extends EnterpriseUser {
  insuranceProvider?: {
    policyNumber: string
    expiryDate: string; // ISO 8601 string (date only)
  }
}

export type UserResponse = Omit<User, 'password'> & {
  id: string;
  settings: Omit<UserSettings, '_id' | 'userId'>;
  fcmToken: string | null;
  token: string;
  enabled: boolean;
  createdAt: string; // ISO 8601 string
  dateOfBirth: string; // ISO 8601 string (date only)
};

export interface UserState extends UserResponse {
  settings: Omit<UserSettings, '_id' | 'userId'>;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserSignupData {
  email: string;
  password: string;
  name: string;
  dateOfBirth: string; // ISO 8601 string (date only)
  height?: number;
  weight?: number;
  avatarFile?: File | Blob | string; // Updated type
}


export interface UserLoginData {
  email: string;
  password: string;
}

export interface UserUpdateData {
  name?: string;
  dateOfBirth?: string; // ISO 8601 string (date only)
  height?: number;
  weight?: number;
  avatarFile?: File | Blob | string; // Updated type
}

export interface UserUpdateSettingsData {
  dateOfBirth?: string; // ISO 8601 string (date only)
  height?: number;
  weight?: number;
  connectedDevices?: string[];
  dailyReminder?: boolean;
  weeklySummary?: boolean;
  shareData?: boolean;
  notificationsEnabled?: boolean;
  dataRetentionPeriod?: number;
}

export interface UserSettings {
  _id: string;
  userId: string;
  dateOfBirth?: string; // ISO 8601 string (date only)
  height?: number;
  weight?: number;
  connectedDevices: string[];
  dailyReminder: boolean;
  weeklySummary: boolean;
  shareData: boolean;
  notificationsEnabled: boolean;
  notificationPreferences: {
    heartRate: boolean;
    stepGoal: boolean;
    environmentalImpact: boolean;
  };
  dataRetentionPeriod: number;
}

// Location types
export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: string;
}

// Activity level type
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'vigorous';

// Health-related types
export type BaseHealthMetric = 
  | 'steps'
  | 'heartRate'
  | 'bloodPressure'
  | 'temperature'
  | 'respiratoryRate'
  | 'oxygenSaturation'
  | 'glucose'
  | 'weight'
  | 'bmi'
  | 'sleep'
  | 'stress'
  | 'mood'
  | 'hydration'
  | 'nutrition'
  | 'exercise'
  | 'airQuality'
  | 'environmentalImpact';

export interface HealthScore {
  cardioHealthScore: number;
  respiratoryHealthScore: number;
  physicalActivityScore: number;
  environmentalImpactScore: number;
}

export type HealthScoreMetric = 
  | 'cardioHealthScore'
  | 'respiratoryHealthScore'
  | 'physicalActivityScore'
  | 'environmentalImpactScore';

export type HealthMetric = BaseHealthMetric | HealthScoreMetric;

// Health data structures
export interface BloodPressure {
  systolic: number;
  diastolic: number;
}

export interface Sleep {
  duration: number;
  quality: number;
}

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Exercise {
  duration: number;
  intensity: number;
  type: string;
}

export interface RawHealthData {
  bloodPressure?: number | BloodPressure;
  sleep?: number | Sleep;
  nutrition?: number | Nutrition;
  exercise?: number | Exercise;
  location?: number | GeoLocation;
  country?: string | number;
  state?: string | number;
  nearestCity?: string | number;
  onBorder?: string[];
  [key: string]: any; // Allow other properties for raw data
}

// Main health data interface
export interface HealthEnvironmentData {
  _id: string;
  id: string;
  basicHealthId: string;
  environmentalId: string;
  scoresId: string;
  userId: string;
  date: string;
  timestamp: string;
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
  activeEnergyBurned: number;
  activityLevel: ActivityLevel;
  airQuality: number;
  environmentalImpact: number;
  humidity: number;
  airQualityIndex: number;
  uvIndex: number;
  noiseLevel: number;
  airQualityDescription: string;
  uvIndexDescription: string;
  noiseLevelDescription: string;
  cardioHealthScore: number;
  respiratoryHealthScore: number;
  physicalActivityScore: number;
  environmentalImpactScore: number;
  clusterSize?: number;
  originalPoint?: HealthEnvironmentData;
}

// Health data point for trends
export interface HealthDataPoint {
  metric: HealthMetric;
  value: number;
  timestamp: string;
}

export interface HealthTrendData {
  metric: HealthMetric;
  data: HealthDataPoint[];
}

// Context types
export interface HealthContext {
  healthData: HealthEnvironmentData[];
  error: Error | null;
  loading: boolean;
  selectedMetric: HealthMetric;
  setSelectedMetric: (metric: HealthMetric) => void;
  fetchHealthData: () => Promise<void>;
}

export interface BasicHealthData {
  _id: string;
  userId: string;
  timestamp: string; // ISO 8601 string
  steps: number;
  heartRate: number;
  weight: number;
  height: number;
  location: GeoLocation;
  activityLevel: ActivityLevel;
}

export interface EnvironmentalData {
  _id: string;
  regionId: string;
  cityId: string;
  areaId: string;
  temperature: number;
  humidity: number;
  airQualityIndex: number;
  uvIndex: number;
  noiseLevel: number;
  timestamp: string; // ISO 8601 string
}

export interface HealthState {
  scores: HealthScore | null;
  regionalComparison: RegionalComparison | null;
  data: HealthEnvironmentData[];
  lastSyncTime: string | null; // ISO 8601 string
  loading: boolean;
  error: string | null;
}

// Regional comparison interfaces
export interface RegionalComparison {
  _id: string;
  regionId: string;
  averageEnvironmentalImpactScore: number;
  topEnvironmentalConcerns: string[];
  timestamp: string; // ISO 8601 string
}

// Device-related interfaces
export interface ConnectedDevice {
  _id: string;
  userId: string;
  type: 'Apple Watch' | 'Google Fitbit' | string;
  lastSynced: string; // ISO 8601 string
  batteryLevel: number;
  firmwareVersion: string;
  serialNumber: string;
}

export interface DeviceState {
  devices: ConnectedDevice[];
}

// Navigation-related interfaces
export interface NavItem {
  route: keyof AppRoutes;
  label: string;
  icon: React.ReactNode;
}

// App routes interface
export interface AppRoutes {
  home: string;
  main: string;
  dashboard: string;
  stats: string;
  profile: string;
  settings: string;
  login: string;
  signup: string;
  splashPage: string;
  changePassword: string;
  deleteAccount: string;
  globescreen: string;
  forms: string;
  DashboardWithErrorBoundary: string;
  [key: string]: string;
}

export interface DashboardProps {
  user: UserState;
  healthData: HealthEnvironmentData[];
  healthScores: HealthScore;
  regionalComparison: RegionalComparison;
  onPageChange: (newPage: number) => void;
  currentPage: number;
  totalPages: number;
}

// Server-side interfaces
export interface ServerUser {
  _id: ObjectId;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  dateOfBirth: Date;
  height: number;
  weight: number;
  avatarUrl: string | null;
  connectedDevices: ObjectId[];
  isDeleted: boolean;
  deletedAt: Date | null;
}

export interface ServerUserSettings extends Omit<UserSettings, '_id' | 'userId' | 'dateOfBirth' | 'connectedDevices'> {
  _id: ObjectId;
  userId: ObjectId;
  dateOfBirth?: Date;
  connectedDevices: ObjectId[];
}

export interface ServerBasicHealthData {
  _id: ObjectId;
  userId: ObjectId;
  timestamp: Date;
  steps: number;
  heartRate: number;
  weight: number;
  height: number;
  location: GeoLocation;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'vigorous';
}

export interface ServerEnvironmentalData {
  _id: ObjectId;
  regionId: ObjectId;
  cityId: ObjectId;
  areaId: ObjectId;
  temperature: number;
  humidity: number;
  airQualityIndex: number;
  uvIndex: number;
  noiseLevel: number;
  timestamp: Date;
}

export interface ServerHealthScores {
  _id: ObjectId;
  userId: ObjectId;
  cardioHealthScore: number;
  respiratoryHealthScore: number;
  physicalActivityScore: number;
  environmentalImpactScore: number;
  timestamp: Date;
}

export interface ServerHealthEnvironmentData extends 
  Omit<ServerBasicHealthData, '_id'>, 
  Omit<ServerEnvironmentalData, '_id'>,
  Omit<ServerHealthScores, '_id' | 'userId'> {
  _id: ObjectId;
  basicHealthId: ObjectId;
  environmentalId: ObjectId;
  scoresId: ObjectId;
  latitude: number;
  longitude: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  activeEnergyBurned: number;
  nearestCity: string;
  onBorder: string[];
  country: string;
  continent: string;
}

// Optimization-related interfaces
export interface OptimizationProgress {
  category: string;
  progress: number;
  timestamp: string;
}

export interface OptimizationMetric {
  name: string;
  value: number;
  timestamp: string;
}

export interface DataStreamConfig {
  batchSize: number;
  interval: number;
  maxRetries: number;
}

export interface ChartDataOptions {
  windowSize: number;
  maxPoints: number;
  aggregationInterval: number;
}

// Utility functions for date conversion
export function dateToISOString(date: Date): string {
  return date.toISOString();
}

export function isoStringToDate(isoString: string): Date {
  return new Date(isoString);
}

export * from '../routes/index';