import { useState, useEffect, useCallback } from 'react';
import healthServiceInstance from '../services/HealthService'; // Adjust the import path as necessary
import type { HealthEnvironmentData, UserState } from '@/types';

interface PaginatedHealthData {
  data: HealthEnvironmentData[];
  totalPages: number;
  currentPage: number;
}

export const useHealthData = (user: UserState | null) => {
  const [healthData, setHealthData] = useState<HealthEnvironmentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      healthServiceInstance.setToken(user.token);
    }
  }, [user]);

  const fetchHealthData = useCallback(async (page: number = 1) => {
    if (!user || !user.token) {
      setError('User not authenticated');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const paginatedData = await healthServiceInstance.getPaginatedHealthData(page);
      setHealthData(prevData => [...prevData, ...paginatedData.data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching health data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const subscribeToHealthData = useCallback(() => {
    return healthServiceInstance.subscribeToHealthData(
      (newData: HealthEnvironmentData) => {
        setHealthData(prevData => [newData, ...prevData]);
      },
      (error: any) => {
        console.error('Health data subscription error:', error);
        setError('Failed to subscribe to real-time health data');
      }
    );
  }, []);

  const syncDeviceData = useCallback(async (deviceId: string) => {
    try {
      await healthServiceInstance.syncDeviceData(deviceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while syncing device data');
    }
  }, []);

  return {
    healthData,
    loading,
    error,
    fetchHealthData,
    subscribeToHealthData,
    syncDeviceData,
  };
};

export const fetchInitialHealthData = async (token: string): Promise<HealthEnvironmentData[]> => {
  healthServiceInstance.setToken(token);
  try {
    return await healthServiceInstance.getHealthDataForLastWeek();
  } catch (error) {
    console.error('Error fetching initial health data:', error);
    return [];
  }
};
