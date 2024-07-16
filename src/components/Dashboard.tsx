import { Add, Map, Timeline, BarChart, PieChart } from '@mui/icons-material';
import {
  Box, Grid, Paper, Typography, CircularProgress, Alert, Tabs, Tab,
  Select, MenuItem, FormControl, InputLabel, Chip, IconButton
} from '@mui/material';
import React, { useState, useCallback, useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';
import { useHealth } from '@/services/HealthContext';

import CustomChart from './CustomChart'; 
import GeospatialChart from './GeospatialChart';

import type { HealthEnvironmentData, HealthMetric} from '@/types';
import type { SelectChangeEvent } from '@mui/material';

type ChartType = 'line' | 'bar' | 'pie';

const Dashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<number>(0);
  const [selectedMetrics, setSelectedMetrics] = useState<HealthMetric[]>(['cardioHealthScore', 'respiratoryHealthScore']);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [geospatialMetric, setGeospatialMetric] = useState<HealthMetric>('environmentalImpactScore');

  useAuth();
  const { healthData, loading, error, fetchHealthData } = useHealth();

  useEffect(() => {
    if (healthData.length === 0 && !loading) {
      fetchHealthData(1);
    }
  }, [healthData, loading, fetchHealthData]);

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

  const DataComparisonView: React.FC = () => (
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
  );

  
  const GeospatialView: React.FC = () => (
    <Box sx={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
      <Paper elevation={3} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', mb: 2 }}>
        <Box sx={{ flexGrow: 1, minHeight: 0 }}>
          <GeospatialChart
            data={healthData}
            metric={geospatialMetric} center={{
              latitude: 0,
              longitude: 0
            }} zoom={0}          />
        </Box>
      </Paper>
      <FormControl fullWidth>
        <InputLabel>Geospatial Metric</InputLabel>
        <Select
          value={geospatialMetric}
          onChange={handleGeospatialMetricChange}
          label="Geospatial Metric"
        >
          {(Object.keys(healthData[0] || {}) as Array<keyof HealthEnvironmentData>)
            .filter(key => typeof healthData[0]?.[key] === 'number')
            .map((metric) => (
              <MenuItem key={metric} value={metric as HealthMetric}>{metric}</MenuItem>
            ))
          }
        </Select>
      </FormControl>
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', p: 3 }}>
      <Typography variant="h4" gutterBottom>Geospatial Health Dashboard</Typography>
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
          </Select>
        </FormControl>
        <IconButton onClick={() => fetchHealthData(1)}>
          <Add /> More Data
        </IconButton>
      </Box>
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        {currentView === 0 && <DataComparisonView />}
        {currentView === 1 && <GeospatialView />}
      </Box>
    </Box>
  );
};

Dashboard.displayName = 'Dashboard';

export default Dashboard;
