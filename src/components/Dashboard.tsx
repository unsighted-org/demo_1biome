import React, { useState, useCallback, useMemo } from 'react';
import {
  Box, Tabs, Tab, Typography, Paper, Grid, CircularProgress,
  Tooltip, IconButton, Menu, MenuItem, Snackbar, Button, Alert, Pagination
} from '@mui/material';
import { DirectionsRun, Favorite, Speed, CloudQueue, WbSunny, VolumeUp, MoreVert } from '@mui/icons-material';
import type { DashboardProps } from '@/types';

const Dashboard: React.FC<DashboardProps> = ({
  user,
  healthData,
  healthScores,
  regionalComparison,
  onPageChange,
  currentPage,
  totalPages
}) => {
  const [currentView, setCurrentView] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleViewChange = useCallback((event: React.SyntheticEvent, newValue: number): void => {
    setCurrentView(newValue);
  }, []);

  const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handlePageChange = useCallback((event: React.ChangeEvent<unknown>, value: number) => {
    onPageChange(value);
  }, [onPageChange]);

  const HealthDataView = useMemo(() => () => {
    const latestData = healthData[healthData.length - 1] || {};
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <Tooltip title="Number of steps taken today">
            <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <DirectionsRun sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h6">Steps</Typography>
                <Typography variant="h4">{latestData.steps?.toLocaleString() || 'N/A'}</Typography>
              </Box>
            </Paper>
          </Tooltip>
        </Grid>
        {/* Add more health data items here */}
      </Grid>
    );
  }, [healthData]);

  const EnvironmentalDataView = useMemo(() => () => {
    const latestData = healthData[healthData.length - 1] || {};
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <Tooltip title="Current air quality">
            <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <CloudQueue sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h6">Air Quality</Typography>
                <Typography variant="h4">{latestData.airQualityDescription || 'N/A'}</Typography>
              </Box>
            </Paper>
          </Tooltip>
        </Grid>
        {/* Add more environmental data items here */}
      </Grid>
    );
  }, [healthData]);

  const HealthScoresView = useMemo(() => () => {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <Tooltip title="Cardio health score">
            <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <Favorite sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h6">Cardio Health Score</Typography>
                <Typography variant="h4">{healthScores?.cardioHealthScore || 'N/A'}</Typography>
              </Box>
            </Paper>
          </Tooltip>
        </Grid>
        {/* Add more health score items here */}
      </Grid>
    );
  }, [healthScores]);

  const RegionalComparisonView = useMemo(() => () => {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Tooltip title="Average environmental impact score">
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6">Average Environmental Impact Score</Typography>
              <Typography variant="h4">{regionalComparison?.averageEnvironmentalImpactScore || 'N/A'}</Typography>
            </Paper>
          </Tooltip>
        </Grid>
        {/* Add more regional comparison items here */}
      </Grid>
    );
  }, [regionalComparison]);

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Welcome, {user?.name || 'User'}</Typography>
        <IconButton onClick={handleMenuClick}>
          <MoreVert />
        </IconButton>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>Sync Data</MenuItem>
        <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
        <MenuItem onClick={handleMenuClose}>Help</MenuItem>
      </Menu>
      <Tabs value={currentView} onChange={handleViewChange} aria-label="dashboard views" sx={{ mb: 2 }}>
        <Tab label="Health Data" />
        <Tab label="Environmental Data" />
        <Tab label="Health Scores" />
        <Tab label="Regional Comparison" />
      </Tabs>
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption">
          Last updated: {healthData[healthData.length - 1]?.timestamp ? new Date(healthData[healthData.length - 1].timestamp).toLocaleString() : 'N/A'}
        </Typography>
      </Box>
      <Box sx={{ mt: 2 }}>
        {currentView === 0 && <HealthDataView />}
        {currentView === 1 && <EnvironmentalDataView />}
        {currentView === 2 && <HealthScoresView />}
        {currentView === 3 && <RegionalComparisonView />}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>
    </Box>
  );
};

export default Dashboard;