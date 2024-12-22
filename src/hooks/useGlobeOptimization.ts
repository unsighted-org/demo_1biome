import { useState, useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { DataPointManager } from '@/utils/DataPointManager';
import type { HealthEnvironmentData, HealthMetric } from '@/types';

interface UseGlobeOptimizationOptions {
  maxPoints?: number;
  chunkSize?: number;
  updateInterval?: number;
  onPointsUpdate?: (count: number) => void;
}

export function useGlobeOptimization(
  scene: THREE.Scene | null,
  healthData: HealthEnvironmentData[],
  displayMetric: HealthMetric,
  visibleArea: THREE.Box2 | null,
  options: UseGlobeOptimizationOptions = {}
) {
  const {
    maxPoints = 10000,
    chunkSize = 100,
    updateInterval = 50,
    onPointsUpdate
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const managerRef = useRef<DataPointManager>();

  useEffect(() => {
    managerRef.current = DataPointManager.getInstance({
      maxPoints,
      chunkSize,
      updateInterval
    });
  }, [maxPoints, chunkSize, updateInterval]);

  useEffect(() => {
    if (scene && managerRef.current) {
      managerRef.current.initialize(scene);
    }
  }, [scene]);

  const updatePoints = useCallback(async () => {
    if (!managerRef.current || !visibleArea || !healthData.length) return;

    setLoading(true);
    setError(null);

    try {
      await managerRef.current.updatePoints(healthData, displayMetric, visibleArea);
      onPointsUpdate?.(managerRef.current.getVisiblePointCount());
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [healthData, displayMetric, visibleArea, onPointsUpdate]);

  useEffect(() => {
    updatePoints();
  }, [updatePoints]);

  const getPointData = useCallback((lat: number, lon: number) => {
    return managerRef.current?.getPointData(lat, lon);
  }, []);

  const clear = useCallback(() => {
    managerRef.current?.clear();
  }, []);

  useEffect(() => {
    return () => {
      managerRef.current?.dispose();
    };
  }, []);

  return {
    loading,
    error,
    getPointData,
    clear
  };
}
