import React, { useEffect, useMemo, useState } from 'react';
import { Typography, CircularProgress, Alert, Button } from '@mui/material';
import { useRouter } from 'next/router';
import HealthTrendChart from '@/components/HealthTrendChart';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSelector } from '@/store';
import { useHealth } from '@/contexts/HealthContext';
import type { HealthEnvironmentData, HealthMetric } from '@/types';
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout';
import { LoadingTimeoutError } from '@/components/LoadingTimeoutError';

const StatsPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const healthData = useAppSelector((state) => state.health.data);
  const { fetchHealthData, loading, error } = useHealth();
  
  const hasTimedOut = useLoadingTimeout({ 
    isLoading: loading,
    timeoutMs: 10000 // 10 seconds for stats
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchHealthData(1); // Fetch first page of health data
    }
  }, [user, authLoading, router, fetchHealthData]);

  const content = useMemo(() => {
    if (hasTimedOut) {
      return (
        <div className="flex-center full-height">
          <LoadingTimeoutError 
            message="Loading health statistics is taking longer than expected." 
            onRetry={() => {}}
          />
        </div>
      );
    }

    if (loading) {
      return (
        <div className="loading-container">
          <CircularProgress />
        </div>
      );
    }
    if (error) {
      return (
        <div className="error-container">
          <Typography color="error">{error.message}</Typography>
        </div>
      );
    }
    if (healthData.length === 0) {
      return <Typography variant="body1">No health data available yet. Start tracking to see your stats!</Typography>;
    }
    return (
      <div className="page-container">
        <div className="card-container" style={{ height: 'calc(100vh - 200px)' }}>
          <HealthTrendChart onDataUpdate={(data: HealthEnvironmentData[], metrics: HealthMetric[]) => {}} />
        </div>
      </div>
    );
  }, [loading, error, healthData, hasTimedOut]);

  if (authLoading) {
    return (
      <div className="flex-center full-height">
        <CircularProgress />
      </div>
    );
  }

  if (!user) {
    return null; // The useEffect will handle redirecting to login
  }

  return (
    <div className="p-3">
      <Typography variant="h4" component="h1" gutterBottom>
        Your Health Stats
      </Typography>
      {content}
    </div>
  );
};

export default StatsPage;
