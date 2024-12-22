import { useState, useEffect, useCallback, useRef } from 'react';
import { ChartDataManager } from '@/utils/ChartDataManager';
import type { HealthEnvironmentData, HealthMetric } from '@/types';

interface UseChartOptimizationOptions {
  windowSize?: number;
  maxPoints?: number;
  aggregationInterval?: number;
  onProgress?: (progress: number) => void;
}

export function useChartOptimization(
  data: HealthEnvironmentData[],
  metrics: HealthMetric[],
  startDate?: Date,
  endDate?: Date,
  options: UseChartOptimizationOptions = {}
) {
  const {
    windowSize = 100,
    maxPoints = 1000,
    aggregationInterval = 50,
    onProgress
  } = options;

  const [optimizedData, setOptimizedData] = useState<HealthEnvironmentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const managerRef = useRef<ChartDataManager>();

  useEffect(() => {
    managerRef.current = ChartDataManager.getInstance({
      windowSize,
      maxPoints,
      aggregationInterval
    });
  }, [windowSize, maxPoints, aggregationInterval]);

  const updateData = useCallback(async () => {
    if (!managerRef.current || !data.length) return;

    setLoading(true);
    setError(null);

    try {
      const result = await managerRef.current.getChartData(
        data,
        metrics,
        startDate,
        endDate,
        (progress) => {
          setProgress(progress);
          onProgress?.(progress);
        }
      );
      setOptimizedData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [data, metrics, startDate, endDate, onProgress]);

  useEffect(() => {
    updateData();
  }, [updateData]);

  const clearCache = useCallback(() => {
    managerRef.current?.clearCache();
  }, []);

  return {
    data: optimizedData,
    loading,
    error,
    progress,
    clearCache
  };
}
