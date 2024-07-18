
import { Add, Map, Timeline, BarChart, PieChart, ThreeDRotation, Refresh } from '@mui/icons-material';
import {
  Box, Typography, CircularProgress, Alert, Grid, Paper, Tabs, Tab, useTheme, useMediaQuery, Button,
  Select, MenuItem, FormControl, InputLabel, Chip, IconButton
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';

import CustomChart from '@/components/CustomChart';
import ErrorBoundary from '@/components/ErrorBoundary';
import HealthTrendChart from '@/components/HealthTrendChart';
import { useAuth } from '@/context/AuthContext';
import { withAuth } from '@/context/withAuth';
import { useHealth } from '@/services/HealthContext';

import GeospatialView from '../components/GeospatialChart';

import type { HealthTrendChartRef } from '@/components/HealthTrendChart';
import type { HealthEnvironmentData, HealthMetric } from '@/types';
import type { SelectChangeEvent } from '@mui/material';


type ChartType = 'line' | 'bar' | 'pie' | '1D' | '2D' | '3D';

const StatsPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { healthData, loading: healthLoading, error, fetchHealthData } = useHealth();
  const [currentTab, setCurrentTab] = useState(0);
  const [currentView, setCurrentView] = useState<number>(0);
  const [selectedMetrics, setSelectedMetrics] = useState<HealthMetric[]>(['cardioHealthScore', 'respiratoryHealthScore']);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [geospatialMetric, setGeospatialMetric] = useState<HealthMetric>('environmentalImpactScore');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const chartRef = useRef<HealthTrendChartRef>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (healthData.length === 0 && !healthLoading) {
      fetchHealthData(1);
    }
  }, [healthData, healthLoading, fetchHealthData]);

  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  }, []);

  const handleViewChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setCurrentView(newValue);
  }, []);

  const handleMetricToggle = useCallback((metric: HealthMetric) => {
    setSelectedMetrics(prev =>
      prev.includes(metric) ? prev.filter(m => m !== metric) : [...prev, metric]
    );
  }, []);

  const handleChartTypeChange = useCallback((event: SelectChangeEvent<ChartType>) => {
    setChartType(event.target.value as ChartType);
  }, []);

  const handleGeospatialMetricChange = useCallback((event: SelectChangeEvent<HealthMetric>) => {
    setGeospatialMetric(event.target.value as HealthMetric);
  }, []);

  const handleHealthTrendDataUpdate = useCallback((data: HealthEnvironmentData[], metrics: HealthMetric[]) => {
    console.log('Health trend data updated:', data.length, 'items');
    console.log('Selected metrics:', metrics);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (chartRef.current && chartRef.current.refreshData) {
      chartRef.current.refreshData();
    }
    fetchHealthData(1);
  }, [fetchHealthData]);

  const ResponsiveContainer: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => (
    <Box
      sx={{
        width: '100%',
        height: { xs: 'calc(100vh - 200px)', sm: 'calc(100vh - 220px)', md: 'calc(100vh - 240px)' },
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </Box>
  );

  const DataComparisonView = useCallback((): JSX.Element => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={8}>
        <Paper elevation={3} sx={{ p: 2, height: '400px' }}>
          <CustomChart
            data={healthData}
            metrics={selectedMetrics}
            chartType={chartType}
          />
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper elevation={3} sx={{ p: 2, height: '400px', overflowY: 'auto' }}>
          <Typography variant="h6" gutterBottom>Select Metrics</Typography>
          {(Object.keys(healthData[0] || {}) as Array<keyof HealthEnvironmentData>)
            .filter(key => typeof healthData[0]?.[key] === 'number')
            .map((metric) => (
              <Chip
                key={metric}
                label={metric}
                onClick={() => handleMetricToggle(metric as HealthMetric)}
                color={selectedMetrics.includes(metric as HealthMetric) ? 'primary' : 'default'}
                sx={{ m: 0.5 }}
              />
            ))
          }
        </Paper>
      </Grid>
    </Grid>
  ), [healthData, selectedMetrics, chartType, handleMetricToggle]);

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
              <Tab label="Dashboard" />
              <Tab label="Health Trends" />
            </Tabs>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <ResponsiveContainer>
            {currentTab === 0 ? (
              <Paper sx={{ p: { xs: 1, sm: 2 }, flexGrow: 1 }}>
                <Tabs value={currentView} onChange={handleViewChange} aria-label="dashboard views" sx={{ mb: 2 }}>
                  <Tab icon={<Timeline />} label="Data Comparison" />
                  <Tab icon={<Map />} label="Geospatial View" />
                </Tabs>
                <Box sx={{ mb: 2 }}>
                  <FormControl sx={{ minWidth: 120, mr: 2 }}>
                    <InputLabel>Chart Type</InputLabel>
                    <Select
                      value={chartType}
                      onChange={handleChartTypeChange}
                      label="Chart Type"
                    >
                      <MenuItem value="line"><Timeline /> Line</MenuItem>
                      <MenuItem value="bar"><BarChart /> Bar</MenuItem>
                      <MenuItem value="pie"><PieChart /> Pie</MenuItem>
                      <MenuItem value="1D"><Timeline /> 1D</MenuItem>
                      <MenuItem value="2D"><Map /> 2D</MenuItem>
                      <MenuItem value="3D"><ThreeDRotation /> 3D</MenuItem>
                    </Select>
                  </FormControl>
                  <IconButton onClick={() => fetchHealthData(1)}>
                    <Add /> More Data
                  </IconButton>
                </Box>
                <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                  {currentView === 0 ? (
                    <DataComparisonView />
                  ) : (
                    <GeospatialView
                      data={healthData}
                      metric={chartType as HealthMetric}
                      geospatialMetric={geospatialMetric}
                      handleGeospatialMetricChange={handleGeospatialMetricChange}
                    />
                  )}
                </Box>
              </Paper>
            ) : (
              <Paper sx={{ p: { xs: 1, sm: 2 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <HealthTrendChart 
                  ref={chartRef}
                  onDataUpdate={handleHealthTrendDataUpdate} 
                />
              </Paper>
            )}
          </ResponsiveContainer>
        </Grid>
      </Grid>
    );
  }, [healthLoading, error, currentTab, handleTabChange, isMobile, currentView, handleViewChange, chartType, handleChartTypeChange, DataComparisonView, healthData, geospatialMetric, handleGeospatialMetricChange, handleHealthTrendDataUpdate, fetchHealthData]);

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
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>Oops! Something went wrong.</Typography>
          <Typography variant="body1" paragraph>{error.message}</Typography>
          <Button variant="contained" onClick={resetErrorBoundary}>Try again</Button>
        </Box>
      )}
      onReset={handleRefresh}
    >
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
    </ErrorBoundary>
  );
};

export default withAuth(StatsPage);
