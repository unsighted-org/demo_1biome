import React, { createContext, useContext, useCallback, useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClusterManager } from '@/lib/clustering';
import healthService from '@/services/HealthService';

import type { HealthEnvironmentData, HealthState, HealthMetric } from '@/types';

export interface HealthContextType {
  healthData: HealthEnvironmentData[];
  visibleData: HealthEnvironmentData[];
  loading: boolean;
  error: string | null;
  fetchHealthData: (page: number) => Promise<void>;
  currentPage: number;
  totalPages: number;
  setZoom: (zoom: number) => void;
  selectedMetrics: HealthMetric[];
  displayMetric: HealthMetric;
  onZoomChange: (zoom: number) => void;
  onPointSelect: (data: HealthEnvironmentData | null) => void;
  onLocationHover: (locationInfo: LocationInfo | null) => void;
  isInteracting: boolean;
  setDisplayMetric: (metric: HealthMetric) => void;
}

interface LocationInfo {
  name: string;
  country: string;
  state: string;
  continent: string;
}

export const HealthContext = createContext<HealthContextType | undefined>(undefined);

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [healthState, setHealthState] = useState<HealthState>({
    data: [],
    error: null,
    lastSyncTime: null,
    scores: null,
    regionalComparison: null,
    loading: false,
  });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [selectedMetrics] = useState<HealthMetric[]>([
    'cardioHealthScore',
    'respiratoryHealthScore',
    'environmentalImpactScore'
  ]);
  const [displayMetric, setDisplayMetric] = useState<HealthMetric>('environmentalImpactScore');
  const [isInteracting, setIsInteracting] = useState(false);

  const clusterManager = useMemo(() => createClusterManager({
    minZoom: 1,
    maxZoom: 20,
    radius: 40,
    minPoints: 2,
  }), []);

  const fetchHealthData = useCallback(async (page: number) => {
    if (!user || loading) return;

    setLoading(true);
    try {
      const response = await healthService.getPaginatedHealthData(page);
      setHealthState(prevState => ({
        ...prevState,
        data: page === 1 ? response.data : [...prevState.data, ...response.data],
        error: null,
        lastSyncTime: new Date().toISOString(),
      }));
      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages);
      clusterManager.addData(response.data);
    } catch (err) {
      setHealthState(prevState => ({
        ...prevState,
        error: 'Failed to fetch health data',
      }));
    } finally {
      setLoading(false);
    }
  }, [user, loading, clusterManager]);

  useEffect(() => {
    if (user && healthState.data.length === 0) {
      fetchHealthData(1);
    }
  }, [user, healthState.data.length, fetchHealthData]);

  useEffect(() => {
    if (healthState.data.length > 0) {
      clusterManager.addData(healthState.data);
    }
  }, [healthState.data, clusterManager]);

  useEffect(() => {
    const unsubscribe = healthService.subscribe((newData) => {
      setHealthState(prevState => ({
        ...prevState,
        data: [...prevState.data, newData],
      }));
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const visibleData = useMemo(() => {
    return clusterManager.getClusters(zoom);
  }, [clusterManager, zoom]);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
    setIsInteracting(true);
    const timeoutId = setTimeout(() => setIsInteracting(false), 150);
    return () => clearTimeout(timeoutId);
  }, []);

  const onPointSelect = useCallback((data: HealthEnvironmentData | null) => {
    // Handle point selection
    if (data?.clusterSize && data.clusterSize > 1) {
      // Handle cluster selection
      console.log('Selected cluster:', data);
    } else {
      // Handle single point selection
      console.log('Selected point:', data);
    }
  }, []);

  const onLocationHover = useCallback((locationInfo: LocationInfo | null) => {
    // Handle location hover
    if (locationInfo) {
      setIsInteracting(true);
    } else {
      setIsInteracting(false);
    }
  }, []);

  const value = useMemo<HealthContextType>(() => ({
    healthData: healthState.data,
    visibleData,
    loading,
    error: healthState.error,
    fetchHealthData,
    currentPage,
    totalPages,
    setZoom,
    selectedMetrics,
    displayMetric,
    onZoomChange,
    onPointSelect,
    onLocationHover,
    isInteracting,
    setDisplayMetric,
  }), [
    healthState.data,
    healthState.error,
    visibleData,
    loading,
    fetchHealthData,
    currentPage,
    totalPages,
    selectedMetrics,
    displayMetric,
    onZoomChange,
    onPointSelect,
    onLocationHover,
    isInteracting,
  ]);

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
};

export function useHealth(): HealthContextType {
  const context = useContext(HealthContext);
  if (context === undefined) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  return context;
}
