import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  Stack,
  CircularProgress,
  Skeleton,
  Chip,
  IconButton,
  useTheme,
  alpha
} from '@mui/material';
import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';
import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { HealthTrendChart } from '@/components/HealthTrendChart';
import ErrorBoundary from '@/components/ErrorBoundary';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import type { HealthEnvironmentData, HealthMetric } from '@/types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [healthData, setHealthData] = useState<HealthEnvironmentData[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<HealthMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const handleDataUpdate = useCallback((data: HealthEnvironmentData[], metrics: HealthMetric[]) => {
    setHealthData(data);
    setSelectedMetrics(metrics);
    setIsLoading(false);
    setLastUpdated(new Date());
  }, []);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    // Trigger your data refresh logic here
  }, []);

  useEffect(() => {
    // Initial data fetch
    if (user) {
      handleRefresh();
    }
  }, [user, handleRefresh]);

  const QuickStatCard = ({ title, value, trend }: { title: string; value: string; trend?: 'up' | 'down' }) => (
    <Card sx={{ height: '100%', bgcolor: alpha(theme.palette.primary.main, 0.04) } as SxProps<Theme>}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          {trend && (
            <Chip
              size="small"
              icon={trend === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />}
              label={trend === 'up' ? '+2.5%' : '-1.2%'}
              color={trend === 'up' ? 'success' : 'error'}
              variant="outlined"
            />
          )}
        </Stack>
        <Typography variant="h4" component="div">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <ErrorBoundary>
      <Container maxWidth="xl" sx={{ py: 4 } as SxProps<Theme>}>
        <Container sx={{ mb: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' } as SxProps<Theme>}>
              Welcome back, {user?.name || 'User'}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Typography>
              <IconButton onClick={handleRefresh} disabled={isLoading}>
                <RefreshIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Container>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={{ p: 3, height: '100%', bgcolor: alpha(theme.palette.primary.main, 0.02) } as SxProps<Theme>}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" component="h2">
                  Health Trends
                </Typography>
                {selectedMetrics.length > 0 && (
                  <Stack direction="row" spacing={1}>
                    {selectedMetrics.map((metric) => (
                      <Chip key={metric} label={metric} size="small" />
                    ))}
                  </Stack>
                )}
              </Stack>
              {isLoading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <ErrorBoundary>
                  {selectedMetrics.map((metric) => (
                    <Container key={metric} sx={{ mb: metric !== selectedMetrics[selectedMetrics.length - 1] ? 4 : 0 }}>
                      <HealthTrendChart 
                        data={healthData} 
                        selectedMetric={metric} 
                        onDataUpdate={handleDataUpdate} 
                      />
                    </Container>
                  ))}
                </ErrorBoundary>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              <QuickStatCard 
                title="Average Air Quality" 
                value="Good" 
                trend="up"
              />
              <QuickStatCard 
                title="Temperature" 
                value="72°F"
                trend="down"
              />
              <QuickStatCard 
                title="Humidity" 
                value="45%"
              />
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) } as SxProps<Theme>}>
              <Typography variant="h6" component="h2" sx={{ mb: 3 } as SxProps<Theme>}>
                Recent Activity
              </Typography>
              {isLoading ? (
                <Stack spacing={2}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rectangular" height={60} />
                  ))}
                </Stack>
              ) : (
                <Typography color="text.secondary">
                  No recent activity to display
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </ErrorBoundary>
  );
};

export default Dashboard;