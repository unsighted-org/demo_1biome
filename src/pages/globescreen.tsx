import { Refresh, Error } from '@mui/icons-material';
import {
  CircularProgress,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Grid
} from '@mui/material';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import React, { useEffect, useCallback, Suspense } from 'react';
import HealthTrendChart from '@/components/HealthTrendChart';
import { useAuth } from '@/contexts/AuthContext';
import { useHealth, type HealthContextType} from '@/contexts/HealthContext';
import { formatDate, calculateBMI, getActivityLevel, getEnvironmentalImpact, getAirQualityDescription } from '@/lib/helpers';
import notificationService from '@/services/CustomNotificationService';
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout';
import { LoadingTimeoutError } from '@/components/LoadingTimeoutError';

// Dynamic import with no SSR for the Globe component
const AnimatedGlobe = dynamic(
  () => import('@/components/AnimatedGlobe').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="globe-loading-container">
        <CircularProgress size={40} />
        <Typography variant="body1" className="loading-text">
          Loading Globe...
        </Typography>
      </div>
    )
  }
);

const GlobePage = () => {
  const { 
    healthData, 
    error,
    loading: healthLoading, 
    displayMetric,
    fetchHealthData
  }: HealthContextType = useHealth();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const hasTimedOut = useLoadingTimeout({ 
    isLoading: healthLoading || authLoading,
    timeoutMs: 15000
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchHealthData().catch(console.error);
      notificationService.initializeNotifications(user, user.token).catch(console.error);
    }
  }, [authLoading, user, router, fetchHealthData]);

  if (!user && !authLoading) {
    router.push('/login');
    return null;
  }

  if (hasTimedOut) {
    return (
      <div className="loading-container">
        <LoadingTimeoutError 
          message="Loading the health globe is taking longer than expected." 
          onRetry={() => fetchHealthData()}
        />
      </div>
    );
  }

  if (authLoading || healthLoading) {
    return (
      <div className="loading-container">
        <CircularProgress size={60} />
        <Typography variant="h6" className="loading-text">
          {authLoading ? 'Verifying your session...' : 'Loading your health data...'}
        </Typography>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <Error className="error-icon" />
        <Typography variant="h6" color="error" gutterBottom>
          {error.toString()}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Refresh />}
          className="error-button"
          onClick={() => fetchHealthData()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const handleLocationHover = useCallback((location: { name: string; country: string; state: string; continent: string; } | null) => {
    console.log('Location hover:', location);
  }, []);

  return (
    <main className="dashboard-container">
      <div className="dashboard-header">
        <Typography variant="h4">Your Health Globe</Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => fetchHealthData()} 
          startIcon={<Refresh />}
        >
          Refresh Data
        </Button>
      </div>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <div className="globe-container">
            <Suspense fallback={
              <div className="globe-loading-container">
                <CircularProgress size={40} />
                <Typography variant="body1" className="loading-text">
                  Loading Globe...
                </Typography>
              </div>
            }>
              <AnimatedGlobe 
                onLocationHover={handleLocationHover}
                displayMetric={displayMetric}
              />
            </Suspense>
            {healthData.length === 0 && (
              <div className="globe-empty-state">
                <Typography variant="h6">
                  No health data available. Start tracking to see your data on the globe!
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => fetchHealthData()}
                  className="mt-4"
                >
                  Start Tracking
                </Button>
              </div>
            )}
          </div>
        </Grid>

        <Grid item xs={12} md={4}>
          <div className="dashboard-card health-trend-card">
            <Typography variant="h6" gutterBottom>
              Health Trends
            </Typography>
            {healthData.length === 0 ? (
              <Typography className="text-secondary">
                No health data available yet.
              </Typography>
            ) : (
              <HealthTrendChart onDataUpdate={(data, selectedMetrics) => {
                console.log('Data updated:', data, selectedMetrics);
              }} />
            )}
          </div>
        </Grid>
      </Grid>

      <div className="dashboard-card">
        <Typography variant="h6" gutterBottom>
          Health Data Summary
        </Typography>
        <div className="table-container">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Steps</TableCell>
                <TableCell>Activity Level</TableCell>
                <TableCell>Heart Rate</TableCell>
                <TableCell>BMI</TableCell>
                <TableCell>Environmental Impact</TableCell>
                <TableCell>Air Quality</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {healthData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No health data available
                  </TableCell>
                </TableRow>
              ) : (
                healthData.map((data: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{formatDate(data.date)}</TableCell>
                    <TableCell>{data.steps}</TableCell>
                    <TableCell>{getActivityLevel(data.activityLevel)}</TableCell>
                    <TableCell>{data.heartRate}</TableCell>
                    <TableCell>{calculateBMI(data.height, data.weight)}</TableCell>
                    <TableCell>{getEnvironmentalImpact(data.environmentalImpact)}</TableCell>
                    <TableCell>{getAirQualityDescription(data.airQuality)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  );
};

export default GlobePage;