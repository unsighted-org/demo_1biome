import { Refresh } from '@mui/icons-material';
import { Box, Typography, CircularProgress, Alert, Grid, Paper, Tabs, Tab, useTheme, useMediaQuery, Button } from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';

import DashboardWithErrorBoundary from '@/components/DashboardWithErrorBoundary';
import HealthTrendChart from '@/components/HealthTrendChart';
import { useAuth } from '@/context/AuthContext';
import { withAuth } from '@/context/withAuth';
import { useHealth } from '@/services/HealthContext';

import type { HealthTrendChartRef } from '@/components/HealthTrendChart';
import type { HealthEnvironmentData, HealthMetric } from '@/types';


const StatsPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { loading: healthLoading, error } = useHealth();
  const [currentTab, setCurrentTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [_selectedMetrics, setSelectedMetrics] = useState<HealthMetric[]>(['cardioHealthScore', 'respiratoryHealthScore']);
  const chartRef = useRef<HealthTrendChartRef>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  }, []);

  const handleHealthTrendDataUpdate = useCallback((data: HealthEnvironmentData[], metrics: HealthMetric[]) => {
    setSelectedMetrics(metrics);
    console.log('Health trend data updated:', data.length, 'items');
    console.log('Selected metrics:', metrics);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (chartRef.current && chartRef.current.refreshData) {
      chartRef.current.refreshData();
    }
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
    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ p: 1 }}>
            <Tabs 
              value={currentTab} 
              onChange={handleTabChange} 
              aria-label="stats tabs"
              variant={isMobile ? "fullWidth" : "standard"}
              centered={!isMobile}
            >
              <Tab label="Health Trends" />
              <Tab label="Dashboard" />
            </Tabs>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          {currentTab === 0 ? (
            <Box sx={{ overflow: 'hidden' }}>
              <Paper sx={{ 
                p: { xs: 1, sm: 2 }, 
                height: { xs: 'calc(100vh - 180px)', sm: 'calc(100vh - 200px)' }, 
                display: 'flex', 
                flexDirection: 'column' 
              }}>
                <HealthTrendChart 
                  ref={chartRef}
                  onDataUpdate={handleHealthTrendDataUpdate} 
                />
              </Paper>
            </Box>
          ) : (
            <Paper sx={{ p: { xs: 1, sm: 2 }, height: { xs: 'calc(100vh - 180px)', sm: 'calc(100vh - 200px)' } }}>
              <DashboardWithErrorBoundary />
            </Paper>
          )}
        </Grid>
      </Grid>
    );
  }, [healthLoading, error, currentTab, handleTabChange, handleHealthTrendDataUpdate, isMobile]);

  const titleFontSize = useMemo(() => {
    if (isMobile) return 'clamp(1.5rem, 5vw, 2rem)';
    if (isTablet) return 'clamp(2rem, 4vw, 2.5rem)';
    return 'clamp(2.5rem, 3vw, 3rem)';
  }, [isMobile, isTablet]);

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 },
      minHeight: '100vh', 
      height: '100%',
      overflow: 'auto', 
      display: 'flex', 
      flexDirection: 'column', 
      bgcolor: 'black', 
      '& .MuiPaper-root': { bgcolor: 'rgba(255,255,255,0.1)' },
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontSize: titleFontSize }}>
          Your Health Stats
        </Typography>
        <Button 
          variant="contained" 
          onClick={handleRefresh} 
          startIcon={<Refresh />}
          disabled={healthLoading}
        >
          {healthLoading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </Box>
      {content}
    </Box>
  );
};

export default withAuth(StatsPage);
