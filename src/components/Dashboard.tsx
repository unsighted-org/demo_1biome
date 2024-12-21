import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DirectionsRun,
  Favorite,
  Speed,
  CloudQueue,
  WbSunny,
  VolumeUp,
  MoreVert,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  Pagination
} from '@mui/material';
import type { DashboardProps } from '@/types';

const getScoreColor = (score: number) => {
  if (score >= 80) return 'success.main';
  if (score >= 60) return 'warning.main';
  return 'error.main';
};

const getTrendIcon = (current: number, previous: number) => {
  if (current > previous) return <TrendingUp color="success" />;
  if (current < previous) return <TrendingDown color="error" />;
  return null;
};

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
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (healthData.length === 0) {
      setSnackbarMessage('No health data available. Please sync your device.');
      setSnackbarOpen(true);
    }
    setLoading(false);
  }, [healthData]);

  const handleViewChange = (event: React.SyntheticEvent, newValue: number): void => {
    setCurrentView(newValue);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    onPageChange(value);
  };

  const HealthDataView: React.FC = useMemo(() => () => {
    const latestData = healthData[healthData.length - 1];
    const previousData = healthData[healthData.length - 2] || {};

    return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <Tooltip title="Number of steps taken today">
            <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <DirectionsRun sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h6">Steps</Typography>
                <Typography variant="h4">
                  {latestData?.steps.toLocaleString() || 'N/A'}
                  {getTrendIcon(latestData?.steps, previousData.steps)}
                </Typography>
              </Box>
            </Paper>
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Tooltip title="Current heart rate">
            <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <Favorite sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h6">Heart Rate</Typography>
                <Typography variant="h4">{latestData?.heartRate || 'N/A'} bpm</Typography>
              </Box>
            </Paper>
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Tooltip title="Activity level">
            <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <Speed sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h6">Activity Level</Typography>
                <Typography variant="h4">{latestData?.activityLevel || 'N/A'}</Typography>
              </Box>
            </Paper>
          </Tooltip>
        </Grid>
      </Grid>
    );
  }, [healthData]);

  const EnvironmentalDataView: React.FC = useMemo(() => () => {
    const latestData = healthData[healthData.length - 1];
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <Tooltip title="Current air quality">
            <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <CloudQueue sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h6">Air Quality</Typography>
                <Typography variant="h4">{latestData?.airQualityDescription || 'N/A'}</Typography>
              </Box>
            </Paper>
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Tooltip title="Current UV index">
            <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <WbSunny sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h6">UV Index</Typography>
                <Typography variant="h4">{latestData?.uvIndexDescription || 'N/A'}</Typography>
              </Box>
            </Paper>
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Tooltip title="Current noise level">
            <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <VolumeUp sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h6">Noise Level</Typography>
                <Typography variant="h4">{latestData?.noiseLevelDescription || 'N/A'}</Typography>
              </Box>
            </Paper>
          </Tooltip>
        </Grid>
      </Grid>
    );
  }, [healthData]);

  const HealthScoresView: React.FC = useMemo(() => () => {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <Tooltip title="Cardio health score">
            <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <Favorite sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h6">Cardio Health Score</Typography>
                <Typography variant="h4" color={getScoreColor(healthScores.cardioHealthScore)}>
                  {healthScores.cardioHealthScore || 'N/A'}
                </Typography>
              </Box>
            </Paper>
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Tooltip title="Respiratory health score">
            <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <Favorite sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h6">Respiratory Health Score</Typography>
                <Typography variant="h4" color={getScoreColor(healthScores.respiratoryHealthScore)}>
                  {healthScores.respiratoryHealthScore || 'N/A'}
                </Typography>
              </Box>
            </Paper>
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Tooltip title="Physical activity score">
            <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <Favorite sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h6">Physical Activity Score</Typography>
                <Typography variant="h4" color={getScoreColor(healthScores.physicalActivityScore)}>
                  {healthScores.physicalActivityScore || 'N/A'}
                </Typography>
              </Box>
            </Paper>
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Tooltip title="Environmental impact score">
            <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <Favorite sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h6">Environmental Impact Score</Typography>
                <Typography variant="h4" color={getScoreColor(healthScores.environmentalImpactScore)}>
                  {healthScores.environmentalImpactScore || 'N/A'}
                </Typography>
              </Box>
            </Paper>
          </Tooltip>
        </Grid>
      </Grid>
    );
  }, [healthScores]);

  const RegionalComparisonView: React.FC = useMemo(() => () => {
    if (!regionalComparison) {
      return (
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">No regional comparison data available.</Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Tooltip title="Average environmental impact score">
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6">Average Environmental Impact Score</Typography>
              <Typography variant="h4">{regionalComparison.averageEnvironmentalImpactScore || 'N/A'}</Typography>
            </Paper>
          </Tooltip>
        </Grid>
        <Grid item xs={12}>
          <Tooltip title="Top environmental concerns">
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6">Top Environmental Concerns</Typography>
              <Typography variant="h4">
                {regionalComparison.topEnvironmentalConcerns.length > 0
                  ? regionalComparison.topEnvironmentalConcerns.join(', ')
                  : 'No concerns reported'}
              </Typography>
            </Paper>
          </Tooltip>
        </Grid>
      </Grid>
    );
  }, [regionalComparison]);

  if (!user || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Welcome, {user.name}</Typography>
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
          Last updated: {new Date(healthData[healthData.length - 1]?.timestamp).toLocaleString()}
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
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="info" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
