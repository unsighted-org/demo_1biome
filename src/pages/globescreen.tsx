// src/pages/globescreen.tsx
// src/pages/globescreen.tsx
import { Refresh } from '@mui/icons-material';
import {
  Box,
  Typography,
  Button,
  Paper,
  useTheme,
  useMediaQuery,
  Grid,
  CircularProgress,
  Fade,
} from '@mui/material';
import dynamic from 'next/dynamic';
import React, { useCallback, useRef, useState } from 'react';

import HealthDataSummary from '@/components/HealthDataSummary';
import HealthTrendChart from '@/components/HealthTrendChart';
import { useAuth } from '@/context/AuthContext';
import { withAuth } from '@/context/withAuth';
import { useHealth } from '@/services/HealthContext';

import type { HealthTrendChartRef } from '@/components/HealthTrendChart';
import type { HealthEnvironmentData, HealthMetric } from '@/types';
import type { NextPage } from 'next';

const AnimatedGlobe = dynamic(() => import('@/components/AnimatedGlobe'), { ssr: false });

const GlobePage: NextPage = () => {
  const [, setSelectedMetrics] = useState<HealthMetric[]>(['cardioHealthScore', 'respiratoryHealthScore']);
  const [hoveredLocation, setHoveredLocation] = useState<{ name: string; country: string; state: string; continent: string } | null>(null);
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const chartRef = useRef<HealthTrendChartRef>(null);
  const [selectedPoint, setSelectedPoint] = useState<HealthEnvironmentData | null>(null);
  const { healthData, loading, error, fetchHealthData, displayMetric } = useHealth();



  const isInitialLoad = !healthData.length;
  
  const handleRefresh = useCallback(async () => {
    await fetchHealthData(1);
    if (chartRef.current && chartRef.current.refreshData) {
      chartRef.current.refreshData();
    }
  }, [fetchHealthData]);

  const handleHealthTrendDataUpdate = useCallback((data: HealthEnvironmentData[], metrics: HealthMetric[]) => {
    setSelectedMetrics(metrics);
  }, [setSelectedMetrics]);

  const handleLocationHover = useCallback((location: { name: string; country: string; state: string; continent: string } | null) => {
    setHoveredLocation(location);
  }, []);

  const handlePointSelect = useCallback((point: HealthEnvironmentData | null) => {
    setSelectedPoint(point);
  }, []);


  if (!user) {
    return null;
  }

  return (
    <Box component="main" sx={{ 
      minHeight: '100vh', 
      height: '100%',
      overflow: 'auto', 
      display: 'flex', 
      flexDirection: 'column', 
      bgcolor: 'black', 
      p: 2,
      '& .MuiPaper-root': { bgcolor: 'rgba(255,255,255,0.1)' },
      '& .MuiTypography-root': { color: 'white' },
      '& .MuiTableCell-root': { color: 'white' },
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Your Health Globe</Typography>
        <Button 
          variant="contained" 
          onClick={handleRefresh} 
          startIcon={<Refresh />}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </Box>

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.main' }}>
          <Typography color="error">Error: {error}</Typography>
        </Paper>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Box sx={{ height: '60vh', minHeight: '400px' }}>
            {isInitialLoad ? (
              <CircularProgress />
            ) : (
              <AnimatedGlobe 
                onLocationHover={handleLocationHover}
                onPointSelect={handlePointSelect}
              />
            )}
          </Box>
          <Fade in={!!hoveredLocation} timeout={300}>
            <Paper sx={{ p: 2, mt: 2, borderRadius: 2 }}>
              {hoveredLocation && (
                <>
                  <Typography variant="h6">Hovered Location</Typography>
                  <Typography>{hoveredLocation.name}</Typography>
                  <Typography>State: {hoveredLocation.state}</Typography>
                  <Typography>Country: {hoveredLocation.country}</Typography>
                  <Typography>Continent: {hoveredLocation.continent}</Typography>
                </>
              )}
            </Paper>
          </Fade>
          {selectedPoint && (
            <Paper sx={{ p: 2, mt: 2, borderRadius: 2 }}>
              <Typography variant="h6">Selected Point</Typography>
              <Typography>Date: {new Date(selectedPoint.timestamp).toLocaleString()}</Typography>
              <Typography>Score: {selectedPoint[displayMetric]}</Typography>
            </Paper>
          )}
       </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <HealthTrendChart 
              ref={chartRef}
              onDataUpdate={handleHealthTrendDataUpdate} 
            />
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, borderRadius: 2, mt: 3, overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>Health Data Summary</Typography>
        <HealthDataSummary 
          healthData={healthData}
          isMobile={isMobile}
          isInitialLoad={isInitialLoad}
        />
      </Paper>
    </Box>
  );
};

export default withAuth(GlobePage);
