import { Container, Grid, Paper, Typography, Card, CardContent, Stack } from '@mui/material';
import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import HealthTrendChart from '@/components/HealthTrendChart';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { HealthEnvironmentData, HealthMetric } from '@/types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<HealthEnvironmentData[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<HealthMetric[]>([]);

  const handleDataUpdate = useCallback((data: HealthEnvironmentData[], metrics: HealthMetric[]) => {
    setHealthData(data);
    setSelectedMetrics(metrics);
  }, []);

  return (
    <ErrorBoundary>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <Typography variant="h4" component="h1">
            Welcome back, {user?.name || 'User'}
          </Typography>
        </div>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <div className="dashboard-card health-trend-card">
              <div className="card-content">
                <Typography variant="h6" component="h2" className="dashboard-card-title">
                  Health Trends
                </Typography>
                <HealthTrendChart onDataUpdate={handleDataUpdate} />
              </div>
            </div>
          </Grid>

          <Grid item xs={12} md={4}>
            <div className="dashboard-card">
              <div className="card-content">
                <Typography variant="h6" component="h2" className="dashboard-card-title">
                  Quick Stats
                </Typography>
                {/* Add quick stats component here */}
              </div>
            </div>
          </Grid>

          <Grid item xs={12}>
            <div className="dashboard-card">
              <div className="card-content">
                <Typography variant="h6" component="h2" className="dashboard-card-title">
                  Recent Activity
                </Typography>
                {/* Add recent activity component here */}
              </div>
            </div>
          </Grid>
        </Grid>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;