export interface TileCache {
  image: HTMLImageElement;
  timestamp: number;
}

export interface MapTileOptions {
  maxZoom?: number;
  minZoom?: number;
  tileSize?: number;
  attribution?: string;
}

export interface TileCoordinates {
  x: number;
  y: number;
  z: number;
}

// Globe Visualization Types
export interface GlobeState {
  zoom: number;
  center: GeoCoordinates;
  rotation: Vector3;
  isInteracting: boolean;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface GlobeVisualizationProps {
  healthData: HealthEnvironmentData[];
  displayMetric: HealthMetric;
  onLocationSelect: (location: GeoCoordinates | null) => void;
  onStateChange: (state: GlobeState) => void;
}

export interface RenderingOptions {
  quality: 'high' | 'medium' | 'low';
  enablePostProcessing: boolean;
  enableAtmosphere: boolean;
  enableClouds: boolean;
}

export type OptimizationLevel = 'performance' | 'balanced' | 'quality';

// Health Data Types
export interface HealthEnvironmentData {
  _id: string;
  userId: string;
  timestamp: string;
  basicHealthId: string;
  environmentalId: string;
  scoresId: string;
  steps: number;
  heartRate: number;
  weight: number;
  height: number;
  location: {
    type: string;
    coordinates: [number, number];
  };
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'vigorous';
  latitude: number;
  longitude: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  activeEnergyBurned: number;
  nearestCity: string;
  onBorder: string[];
}

export type HealthMetric = keyof HealthEnvironmentData;
