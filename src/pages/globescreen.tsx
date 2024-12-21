import { Refresh, Error } from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Skeleton,
  Paper,
  useTheme,
  useMediaQuery,
  Grid,
} from '@mui/material';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

import HealthTrendChart from '@/components/HealthTrendChart';
import { useAuth } from '@/context/AuthContext';
import { useHealth, HealthContextType } from '@/contexts/HealthContext';
import { formatDate, calculateBMI, getActivityLevel, getEnvironmentalImpact, getAirQualityDescription } from '@/lib/helpers';
import { notificationService } from '@/services/CustomNotificationService';

import type { NextPage } from 'next';

const AnimatedGlobe = dynamic(() => import('@/components/AnimatedGlobe'), { ssr: false });

const GlobePage: NextPage = () => {
  const { 
    healthData, 
    loading: healthLoading, 
    error, 
    fetchHealthData 
  }: HealthContextType = useHealth();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      notificationService.initializeNotifications(user, user.token).catch(console.error);
    }
  }, [authLoading, user, router]);

  if (authLoading || healthLoading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh" bgcolor="black">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ marginTop: '20px', color: 'white' }}>Loading your health data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh" bgcolor="black">
        <Error color="error" sx={{ fontSize: 60, marginBottom: '20px' }} />
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Refresh />}
          onClick={() => fetchHealthData(1)}
          sx={{ marginTop: '20px' }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (!user) {
    return null; // The useEffect will handle redirecting to login
  }

  return (
    <Box component="main" sx={{ minHeight: '100vh', overflow: 'auto', display: 'flex', flexDirection: 'column', bgcolor: 'black', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', mb: 2 }}>
        <Typography variant="h4">Your Health Globe</Typography>
        <Button variant="contained" onClick={() => fetchHealthData(1)} startIcon={<Refresh />}>Refresh Data</Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {healthData.length > 0 ? (
            <Box sx={{ height: '60vh', minHeight: '400px' }}>
              <AnimatedGlobe 
                healthData={healthData} 
                isLoading={healthLoading} 
                error={error} 
              />
            </Box>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" height="60vh" minHeight="400px">
              <Typography variant="h6" color="white">No health data available. Start tracking to see your globe!</Typography>
            </Box>
          )}
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="white">Health Trends</Typography>
            <HealthTrendChart healthData={healthData} />
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, mt: 3, overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom color="white">Health Data Summary</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'white' }}>Date</TableCell>
              <TableCell sx={{ color: 'white' }}>Steps</TableCell>
              <TableCell sx={{ color: 'white' }}>Activity Level</TableCell>
              <TableCell sx={{ color: 'white' }}>Heart Rate</TableCell>
              {!isMobile && (
                <>
                  <TableCell sx={{ color: 'white' }}>BMI</TableCell>
                  <TableCell sx={{ color: 'white' }}>Environmental Impact</TableCell>
                  <TableCell sx={{ color: 'white' }}>Air Quality</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {healthData.length > 0 ? (
              healthData.map((data: any) => (
                <TableRow key={data.timestamp}>
                  <TableCell>{formatDate(data.timestamp.toString())}</TableCell>
                  <TableCell>{data.steps}</TableCell>
                  <TableCell>{data.steps ? getActivityLevel(Number(data.steps)) : ''}</TableCell>
                  <TableCell>{data.heartRate}</TableCell>
                  {!isMobile && (
                    <>
                      <TableCell>{calculateBMI(Number(data.weight), Number(data.height))}</TableCell>
                      <TableCell>{getEnvironmentalImpact(data)}</TableCell>
                      <TableCell>{getAirQualityDescription(Number(data.airQualityIndex))}</TableCell>
                    </>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isMobile ? 4 : 7}>
                  <Skeleton variant="rectangular" height={40} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default GlobePage;
