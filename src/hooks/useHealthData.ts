// src/hooks/useHealthData.ts
import { useState, useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import healthServiceInstance from '@/services/HealthService';
import { updateHealthData, updateHealthScores, updateRegionalComparison } from '@/store';
import type { HealthEnvironmentData, HealthScores, RegionalComparison } from '@/types';

interface UseHealthDataReturn {
  loading: boolean;
  error: string | null;
  fetchHealthData: (pageNumber: number) => Promise<void>;
  healthData: HealthEnvironmentData[];
  healthScores: HealthScores | null;
  regionalComparison: RegionalComparison | null;
}

export const useHealthData = (user: { token: string } | null): UseHealthDataReturn => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const healthData = useAppSelector(state => state.health.data);
  const healthScores = useAppSelector(state => state.health.scores);
  const regionalComparison = useAppSelector(state => state.health.regionalComparison);

  const fetchHealthData = useCallback(async (pageNumber: number) => {
    if (!user?.token) return;
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching health data...');
      healthServiceInstance.setToken(user.token);
      const paginatedData = await healthServiceInstance.getPaginatedHealthData(pageNumber);
      console.log('Health data fetched:', paginatedData);
      dispatch(updateHealthData(paginatedData.data));
      if (paginatedData.data.length > 0) {
        const latestData = paginatedData.data[paginatedData.data.length - 1];
        const scores: HealthScores = {
          _id: latestData._id,
          userId: latestData.userId,
          cardioHealthScore: latestData.cardioHealthScore,
          respiratoryHealthScore: latestData.respiratoryHealthScore,
          physicalActivityScore: latestData.physicalActivityScore,
          environmentalImpactScore: latestData.environmentalImpactScore,
          timestamp: latestData.timestamp
        };
        dispatch(updateHealthScores(scores));
        const comparison: RegionalComparison = {
          _id: latestData.environmentalId || 'placeholder-id',
          regionId: latestData.regionId,
          averageEnvironmentalImpactScore: latestData.environmentalImpactScore,
          topEnvironmentalConcerns: [latestData.airQualityDescription, latestData.uvIndexDescription, latestData.noiseLevelDescription].filter(Boolean),
          timestamp: latestData.timestamp
        };
        dispatch(updateRegionalComparison(comparison));
      }
    } catch (err) {
      console.error('Error fetching health data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (user?.token) {
      const unsubscribePromise = healthServiceInstance.subscribeToHealthData(
        (newData: HealthEnvironmentData) => {
          dispatch(updateHealthData([newData]));
        },
        (error: Error) => {
          console.error('Health data subscription error:', error);
          setError('Error receiving real-time updates. Please refresh the page.');
        }
      );
      return () => {
        if (unsubscribePromise) {
          unsubscribePromise.then(unsubscribe => {
            if (typeof unsubscribe === 'function') {
              unsubscribe();
            }
          }).catch(err => {
            console.error('Error unsubscribing:', err);
          });
        }
      };
    }
  }, [dispatch, user]);

  return { 
    loading, 
    error, 
    fetchHealthData,
    healthData: healthData || [],
    healthScores: healthScores || null,
    regionalComparison: regionalComparison || null
  };
};

export const fetchInitialHealthData = async (token: string): Promise<HealthEnvironmentData[]> => {
  healthServiceInstance.setToken(token);
  return await healthServiceInstance.getHealthDataForLastWeek();
};
