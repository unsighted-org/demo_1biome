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

// Location-related interfaces
export interface Location {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

// Health-related interfaces
export interface BasicHealthData {
  _id: string;
  userId: string;
  timestamp: string; // ISO 8601 string
  steps: number;
  heartRate: number;
  weight: number;
  height: number;
  location: Location;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'vigorous';
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

export interface HealthScores {
  _id: string;
  userId: string;
  cardioHealthScore: number;
  respiratoryHealthScore: number;
  physicalActivityScore: number;
  environmentalImpactScore: number;
  timestamp: string; // ISO 8601 string
}

export interface HealthEnvironmentData extends Omit<BasicHealthData, '_id'>, Omit<EnvironmentalData, '_id'> {
  _id: string;
  basicHealthId: string;
  environmentalId: string;
  scoresId: string;
  latitude: number;
  longitude: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  activeEnergyBurned: number;
  cardioHealthScore: number;
  respiratoryHealthScore: number;
  physicalActivityScore: number;
  environmentalImpactScore: number;
  nearestCity: string;
  onBorder: string[];
  country: string;
  continent: string;
  airQualityDescription: string;
  uvIndexDescription: string;
  noiseLevelDescription: string;
  bmi: number;
  environmentalImpact: string;
  airQuality: string;
}

export interface HealthState {
  scores: HealthScores | null;
  regionalComparison: RegionalComparison | null;
  data: HealthEnvironmentData[];
  lastSyncTime: string | null; // ISO 8601 string
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
  stats: string;
  profile: string;
  settings: string;
  login: string;
  signup: string;
  changePassword: string;
  deleteAccount: string;
  globescreen: string;
  [key: string]: string;
}

export interface DashboardProps {
  user: UserState;
  healthData: HealthEnvironmentData[];
  healthScores: HealthScores;
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

export interface ServerUserSettings {
  _id: ObjectId;
  userId: ObjectId;
  dateOfBirth?: Date;
  height?: number;
  weight?: number;
  connectedDevices: ObjectId[];
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

export interface ServerBasicHealthData {
  _id: ObjectId;
  userId: ObjectId;
  timestamp: Date;
  steps: number;
  heartRate: number;
  weight: number;
  height: number;
  location: Location;
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

// Utility functions for date conversion
export function dateToISOString(date: Date): string {
  return date.toISOString();
}

export function isoStringToDate(isoString: string): Date {
  return new Date(isoString);
}

export * from '../routes/index';