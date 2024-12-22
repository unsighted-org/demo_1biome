import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { sub } from 'date-fns';
import { useAuth } from './AuthContext';
import { healthIntegrationService } from '@/services/healthIntegrations';
import type { HealthKitData } from '@/services/healthIntegrations';
import { HealthEnvironmentData, HealthMetric } from '@/types';

const HealthContext = createContext<HealthContextType | undefined>(undefined);

export interface HealthContextType {
  healthData: HealthEnvironmentData[];
  error: Error | null;
  loading: boolean;
  displayMetric: HealthMetric;
  fetchHealthData: (page?: number) => Promise<void>;
  setDisplayMetric: (metric: HealthMetric) => void;
  isAuthorized: boolean;
  requestAuthorization: () => Promise<boolean>;
}

// Utility function to transform HealthKitData to HealthEnvironmentData
const transformHealthKitData = (data: HealthKitData, userId: string): HealthEnvironmentData => {
  const timestamp = new Date().toISOString();
  
  // Calculate health scores based on available data
  const cardioHealthScore = calculateCardioScore(data.heartRate);
  const physicalActivityScore = calculateActivityScore(data.steps, data.activeEnergy);
  
  return {
    _id: crypto.randomUUID(),
    userId,
    timestamp,
    basicHealthId: crypto.randomUUID(),
    environmentalId: crypto.randomUUID(),
    scoresId: crypto.randomUUID(),
    steps: data.steps,
    heartRate: data.heartRate,
    weight: 0,
    height: 0,
    location: {
      type: 'Point',
      coordinates: [0, 0]
    },
    activityLevel: determineActivityLevel(data.steps, data.activeEnergy),
    latitude: 0,
    longitude: 0,
    respiratoryRate: 0,
    oxygenSaturation: 0,
    activeEnergyBurned: data.activeEnergy,
    nearestCity: '',
    onBorder: [],
    country: '',
    state: '',
    continent: '',
    airQualityDescription: 'Moderate',
    uvIndexDescription: 'Moderate',
    noiseLevelDescription: 'Moderate',
    bmi: 0,
    environmentalImpact: 'moderate',
    airQuality: 'moderate',
    cardioHealthScore,
    respiratoryHealthScore: 0,
    physicalActivityScore,
    environmentalImpactScore: 0,
    temperature: 0,
    humidity: 0,
    airQualityIndex: 0,
    uvIndex: 0,
    noiseLevel: 0,
    regionId: '',
    cityId: '',
    areaId: ''
  };
};

// Utility functions for health score calculations
const calculateCardioScore = (heartRate: number): number => {
  // Basic scoring logic - should be enhanced based on age, fitness level, etc.
  if (heartRate === 0) return 0;
  const optimalRestingRange = [60, 100];
  const score = heartRate >= optimalRestingRange[0] && heartRate <= optimalRestingRange[1] 
    ? 100 
    : Math.max(0, 100 - Math.abs(heartRate - 80) * 2);
  return Math.min(100, Math.max(0, score));
};

const calculateActivityScore = (steps: number, activeEnergy: number): number => {
  // Basic scoring logic - should be enhanced based on user goals
  const dailyStepGoal = 10000;
  const dailyEnergyGoal = 400; // kcal
  
  const stepScore = Math.min(100, (steps / dailyStepGoal) * 100);
  const energyScore = Math.min(100, (activeEnergy / dailyEnergyGoal) * 100);
  
  return Math.round((stepScore + energyScore) / 2);
};

const determineActivityLevel = (steps: number, activeEnergy: number): 'sedentary' | 'light' | 'moderate' | 'vigorous' => {
  const dailyStepGoal = 10000;
  const stepPercentage = steps / dailyStepGoal;
  
  if (stepPercentage < 0.3) return 'sedentary';
  if (stepPercentage < 0.6) return 'light';
  if (stepPercentage < 0.9) return 'moderate';
  return 'vigorous';
};

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [healthData, setHealthData] = useState<HealthEnvironmentData[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [displayMetric, setDisplayMetric] = useState<HealthMetric>('environmentalImpactScore');
  const { user } = useAuth();

  // Handle initial authorization
  const requestAuthorization = useCallback(async () => {
    try {
      const authorized = await healthIntegrationService.authorizeHealthKit();
      setIsAuthorized(authorized);
      return authorized;
    } catch (err) {
      console.error('Error authorizing HealthKit:', err);
      setError(err instanceof Error ? err : new Error('Failed to authorize HealthKit'));
      return false;
    }
  }, []);

  // Initialize authorization on mount
  useEffect(() => {
    if (user) {
      requestAuthorization();
    }
  }, [user, requestAuthorization]);

  const fetchHealthData = useCallback(async (page: number = 1) => {
    if (!user || !isAuthorized) return;

    setLoading(true);
    setError(null);
    try {
      const endDate = new Date();
      const startDate = sub(endDate, { days: 7 }); // Get last 7 days of data

      const healthKitData = await healthIntegrationService.fetchHealthKitData(startDate, endDate);
      if (healthKitData) {
        const transformedData = transformHealthKitData(healthKitData, user.id);
        setHealthData(prevData => page === 1 ? [transformedData] : [...prevData, transformedData]);
      } else {
        if (page === 1) setHealthData([]); // Only clear data on first page
      }
    } catch (err) {
      console.error('Error fetching health data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch health data'));
    } finally {
      setLoading(false);
    }
  }, [user, isAuthorized]);

  // Refresh data when authorization status changes
  useEffect(() => {
    if (isAuthorized) {
      fetchHealthData(1);
    }
  }, [isAuthorized, fetchHealthData]);

  // Set up periodic refresh
  useEffect(() => {
    if (isAuthorized) {
      const intervalId = setInterval(fetchHealthData, 30 * 60 * 1000);
      return () => clearInterval(intervalId);
    }
  }, [isAuthorized, fetchHealthData]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (user && isAuthorized) {
      const handleUpdate = (newData: HealthEnvironmentData) => {
        setHealthData(prevData => {
          if (!prevData) return [newData];
          return [...prevData, newData];
        });
      };

      healthIntegrationService.subscribe(handleUpdate);
      return () => healthIntegrationService.unsubscribe(handleUpdate);
    }
  }, [user, isAuthorized]);

  const value = {
    healthData,
    error,
    loading,
    displayMetric,
    fetchHealthData,
    setDisplayMetric,
    isAuthorized,
    requestAuthorization
  };

  return (
    <HealthContext.Provider value={value}>
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = (): HealthContextType => {
  const context = useContext(HealthContext);
  if (context === undefined) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  return context;
};
