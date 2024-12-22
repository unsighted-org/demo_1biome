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
            <Paper elevation={3} className="dashboard-paper">
              <DirectionsRun className="metric-icon" />
              <div className="metric-container">
                <Typography variant="h6">Steps</Typography>
                <div className="metric-value">
                  <Typography variant="h4">{latestData?.steps.toLocaleString() || 'N/A'}</Typography>
                  {getTrendIcon(latestData?.steps, previousData.steps)}
                </div>
              </div>
            </Paper>
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Tooltip title="Current heart rate">
            <Paper elevation={3} className="dashboard-paper">
              <Favorite className="metric-icon" />
              <div className="metric-container">
                <Typography variant="h6">Heart Rate</Typography>
                <div className="metric-value">
                  <Typography variant="h4">{latestData?.heartRate || 'N/A'} bpm</Typography>
                </div>
              </div>
            </Paper>
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Tooltip title="Activity level">
            <Paper elevation={3} className="dashboard-paper">
              <Speed className="metric-icon" />
              <div className="metric-container">
                <Typography variant="h6">Activity Level</Typography>
                <div className="metric-value">
                  <Typography variant="h4">{latestData?.activityLevel || 'N/A'}</Typography>
                </div>
              </div>
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
            <Paper elevation={3} className="dashboard-paper">
              <CloudQueue className="metric-icon" />
              <div className="metric-container">
                <Typography variant="h6">Air Quality</Typography>
                <div className="metric-value">
                  <Typography variant="h4">{latestData?.airQualityDescription || 'N/A'}</Typography>
                </div>
              </div>
            </Paper>
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Tooltip title="Current UV index">
            <Paper elevation={3} className="dashboard-paper">
              <WbSunny className="metric-icon" />
              <div className="metric-container">
                <Typography variant="h6">UV Index</Typography>
                <div className="metric-value">
                  <Typography variant="h4">{latestData?.uvIndexDescription || 'N/A'}</Typography>
                </div>
              </div>
            </Paper>
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Tooltip title="Current noise level">
            <Paper elevation={3} className="dashboard-paper">
              <VolumeUp className="metric-icon" />
              <div className="metric-container">
                <Typography variant="h6">Noise Level</Typography>
                <div className="metric-value">
                  <Typography variant="h4">{latestData?.noiseLevelDescription || 'N/A'} dB</Typography>
                </div>
              </div>
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
            <Paper elevation={3} className="dashboard-paper">
              <Favorite className="metric-icon" />
              <div className="metric-container">
                <Typography variant="h6">Cardio Health Score</Typography>
                <div className="metric-value">
                  <Typography variant="h4" color={getScoreColor(healthScores.cardioHealthScore)}>
                    {healthScores.cardioHealthScore || 'N/A'}
                  </Typography>
                  <Typography variant="body2" style={{ color: getScoreColor(healthScores.cardioHealthScore) }}>
                    {healthScores.cardioHealthScore >= 80 ? 'Excellent' : 'Needs Improvement'}
                  </Typography>
                </div>
              </div>
            </Paper>
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Tooltip title="Respiratory health score">
            <Paper elevation={3} className="dashboard-paper">
              <Favorite className="metric-icon" />
              <div className="metric-container">
                <Typography variant="h6">Respiratory Health Score</Typography>
                <div className="metric-value">
                  <Typography variant="h4" color={getScoreColor(healthScores.respiratoryHealthScore)}>
                    {healthScores.respiratoryHealthScore || 'N/A'}
                  </Typography>
                  <Typography variant="body2" style={{ color: getScoreColor(healthScores.respiratoryHealthScore) }}>
                    {healthScores.respiratoryHealthScore >= 80 ? 'Excellent' : 'Needs Improvement'}
                  </Typography>
                </div>
              </div>
            </Paper>
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Tooltip title="Physical activity score">
            <Paper elevation={3} className="dashboard-paper">
              <Favorite className="metric-icon" />
              <div className="metric-container">
                <Typography variant="h6">Physical Activity Score</Typography>
                <div className="metric-value">
                  <Typography variant="h4" color={getScoreColor(healthScores.physicalActivityScore)}>
                    {healthScores.physicalActivityScore || 'N/A'}
                  </Typography>
                  <Typography variant="body2" style={{ color: getScoreColor(healthScores.physicalActivityScore) }}>
                    {healthScores.physicalActivityScore >= 80 ? 'Excellent' : 'Needs Improvement'}
                  </Typography>
                </div>
              </div>
            </Paper>
          </Tooltip>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Tooltip title="Environmental impact score">
            <Paper elevation={3} className="dashboard-paper">
              <Favorite className="metric-icon" />
              <div className="metric-container">
                <Typography variant="h6">Environmental Impact Score</Typography>
                <div className="metric-value">
                  <Typography variant="h4" color={getScoreColor(healthScores.environmentalImpactScore)}>
                    {healthScores.environmentalImpactScore || 'N/A'}
                  </Typography>
                  <Typography variant="body2" style={{ color: getScoreColor(healthScores.environmentalImpactScore) }}>
                    {healthScores.environmentalImpactScore >= 80 ? 'Excellent' : 'Needs Improvement'}
                  </Typography>
                </div>
              </div>
            </Paper>
          </Tooltip>
        </Grid>
      </Grid>
    );
  }, [healthScores]);

  const RegionalComparisonView: React.FC = useMemo(() => () => {
    if (!regionalComparison) {
      return (
        <div className="dashboard-last-updated">
          <Typography variant="h6">No regional comparison data available.</Typography>
        </div>
      );
    }

    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Tooltip title="Average environmental impact score">
            <Paper elevation={3} className="dashboard-paper">
              <Typography variant="h6">Average Environmental Impact Score</Typography>
              <Typography variant="h4">{regionalComparison.averageEnvironmentalImpactScore || 'N/A'}</Typography>
            </Paper>
          </Tooltip>
        </Grid>
        <Grid item xs={12}>
          <Tooltip title="Top environmental concerns">
            <Paper elevation={3} className="dashboard-paper">
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

  if (loading) {
    return (
      <div className="dashboard-loading">
        <CircularProgress />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-loading">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <Typography variant="h4">Welcome, {user.name}</Typography>
        <IconButton onClick={handleMenuClick}>
          <MoreVert />
        </IconButton>
      </div>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>Sync Data</MenuItem>
        <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
        <MenuItem onClick={handleMenuClose}>Help</MenuItem>
      </Menu>
      <div className="dashboard-tabs">
        <Tabs value={currentView} onChange={handleViewChange} aria-label="dashboard views">
          <Tab label="Health Data" />
          <Tab label="Environmental Data" />
          <Tab label="Health Scores" />
          <Tab label="Regional Comparison" />
        </Tabs>
      </div>
      <Typography variant="caption" className="dashboard-last-updated">
        Last updated: {new Date(healthData[healthData.length - 1]?.timestamp).toLocaleString()}
      </Typography>
      <div className="dashboard-content">
        {currentView === 0 && <HealthDataView />}
        {currentView === 1 && <EnvironmentalDataView />}
        {currentView === 2 && <HealthScoresView />}
        {currentView === 3 && <RegionalComparisonView />}
      </div>
      <div className="dashboard-pagination">
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
        />
      </div>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="info" className="full-width">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Dashboard;
