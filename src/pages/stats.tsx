import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, Grid, Paper, Tabs, Tab } from '@mui/material';
import { useRouter } from 'next/router';
import HealthTrendChart from '@/components/HealthTrendChart';
import DashboardWithErrorBoundary from '@/components/DashboardWithErrorBoundary';
import { useAuth } from '@/context/AuthContext';
import { useHealth } from '@/services/HealthContext';
import { useAppSelector } from '@/store';
import type { HealthEnvironmentData, HealthScores, RegionalComparison, UserState } from '@/types';

const StatsPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { fetchHealthData, loading: healthLoading, error } = useHealth();
  const [currentTab, setCurrentTab] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const healthData = useAppSelector(state => state.health.data);
  const healthScores = useAppSelector(state => state.health.scores);
  const regionalComparison = useAppSelector(state => state.health.regionalComparison);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && healthData.length === 0) {
      fetchHealthData(1);
    }
  }, [user, authLoading, router, fetchHealthData, healthData.length]);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    fetchHealthData(newPage);
  }, [fetchHealthData]);

  const handleHealthTrendDataUpdate = useCallback((data: HealthEnvironmentData[], selectedMetrics: string[]) => {
    // Handle the updated data if needed
    console.log('Health trend data updated:', data.length, 'items');
    console.log('Selected metrics:', selectedMetrics);
  }, []);

  const content = useMemo(() => {
    if (healthLoading) {
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
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Tabs value={currentTab} onChange={handleTabChange} aria-label="stats tabs">
              <Tab label="Health Trends" />
              <Tab label="Dashboard" />
            </Tabs>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          {currentTab === 0 ? (
            <Paper sx={{ p: 2, height: 'calc(100vh - 300px)' }}>
              <HealthTrendChart onDataUpdate={handleHealthTrendDataUpdate} />
            </Paper>
          ) : (
            <Paper sx={{ p: 2 }}>
              {user && healthScores && regionalComparison && (
                <DashboardWithErrorBoundary
                  user={user as UserState}
                  healthData={healthData}
                  healthScores={healthScores}
                  regionalComparison={regionalComparison}
                  onPageChange={handlePageChange}
                  currentPage={currentPage}
                  totalPages={Math.ceil(healthData.length / 20)} // Assuming 20 items per page
                />
              )}
            </Paper>
          )}
        </Grid>
      </Grid>
    );
  }, [healthLoading, error, healthData, currentTab, handleTabChange, user, healthScores, regionalComparison, handlePageChange, currentPage, handleHealthTrendDataUpdate]);

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
