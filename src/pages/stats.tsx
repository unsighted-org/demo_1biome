import React, { useEffect, useMemo } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { useRouter } from 'next/router';
import HealthTrendChart from '@/components/HealthTrendChart';
import { useAuth } from '@/context/AuthContext';
import { useHealthData } from '@/hooks/useHealthData';
import { useAppSelector } from '@/store';

const StatsPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { loading, error, fetchHealthData } = useHealthData(user);
  const healthData = useAppSelector((state) => state.health.data);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchHealthData(1); // Fetch first page of health data
    }
  }, [user, authLoading, router, fetchHealthData]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      );
    }
    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }
    if (healthData.length === 0) {
      return <Typography variant="body1">No health data available yet. Start tracking to see your stats!</Typography>;
    }
    return (
      <Box sx={{ height: 'calc(100vh - 200px)', mb: 4 }}>
        <HealthTrendChart healthData={healthData} />
      </Box>
    );
  }, [loading, error, healthData]);

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return null; // The useEffect will handle redirecting to login
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Your Health Stats
      </Typography>
      {content}
    </Box>
  );
};

export default StatsPage;