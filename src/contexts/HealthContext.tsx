import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { sub } from 'date-fns';
import { useAuth } from './AuthContext';
import { healthIntegrationService } from '@/services/healthIntegrations';
import { HealthEnvironmentData, HealthMetric, GeoLocation } from '@/types';
import { adaptHealthData, createEmptyHealthData } from '@/adapters/healthDataAdapter';

interface HealthContextType {
  healthData: HealthEnvironmentData[];
  loading: boolean;
  error: Error | null;
  selectedMetric: HealthMetric;
  setSelectedMetric: (metric: HealthMetric) => void;
  fetchHealthData: () => Promise<void>;
  isAuthorized: boolean;
  requestAuthorization: () => Promise<boolean>;
}

const defaultLocation: GeoLocation = {
  latitude: 37.7749,
  longitude: -122.4194,
  timestamp: new Date().toISOString()
};

const defaultHealthData = createEmptyHealthData(defaultLocation);

const HealthContext = createContext<HealthContextType>({
  healthData: [defaultHealthData],
  loading: false,
  error: null,
  selectedMetric: 'cardioHealthScore',
  setSelectedMetric: () => {},
  fetchHealthData: async () => {},
  isAuthorized: false,
  requestAuthorization: async () => false
});

export function useHealth() {
  return useContext(HealthContext);
}

export function HealthProvider({ children }: { children: React.ReactNode }) {
  const [healthData, setHealthData] = useState<HealthEnvironmentData[]>([defaultHealthData]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<HealthMetric>('cardioHealthScore');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { user } = useAuth();

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

  useEffect(() => {
    if (user) {
      requestAuthorization();
    }
  }, [user, requestAuthorization]);

  const fetchHealthData = useCallback(async () => {
    if (!user || !isAuthorized) return;

    try {
      setLoading(true);
      setError(null);

      const endDate = new Date();
      const startDate = sub(endDate, { days: 7 }); // Get last 7 days of data

      const healthKitData = await healthIntegrationService.fetchHealthKitData(startDate, endDate);
      if (healthKitData) {
        const adaptedData = adaptHealthData(healthKitData);
        setHealthData([adaptedData]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch health data'));
    } finally {
      setLoading(false);
    }
  }, [user, isAuthorized]);

  useEffect(() => {
    if (isAuthorized) {
      fetchHealthData();
    }
  }, [isAuthorized, fetchHealthData]);

  const value = {
    healthData,
    loading,
    error,
    selectedMetric,
    setSelectedMetric,
    fetchHealthData,
    isAuthorized,
    requestAuthorization
  };

  return (
    <HealthContext.Provider value={value}>
      {children}
    </HealthContext.Provider>
  );
}
