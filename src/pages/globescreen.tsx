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
import React, { useEffect, useState, useCallback } from 'react';
import styled from '@emotion/styled';
import type { Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';

import HealthTrendChart from '@/components/HealthTrendChart';
import { useAuth } from '@/contexts/AuthContext';
import { useHealth, HealthContextType } from '@/contexts/HealthContext';
import { formatDate, calculateBMI, getActivityLevel, getEnvironmentalImpact, getAirQualityDescription } from '@/lib/helpers';

import type { NextPage } from 'next';
import notificationService from '@/services/CustomNotificationService';
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout';
import { LoadingTimeoutError } from '@/components/LoadingTimeoutError';

const AnimatedGlobe = dynamic(() => import('@/components/AnimatedGlobe'), { ssr: false });

// Predefined styles to reduce complexity
const mainBoxStyles: SystemStyleObject<Theme> = {
  minHeight: '100vh',
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column',
  bgcolor: 'black',
  p: 2
} as const;

const headerBoxStyles: SystemStyleObject<Theme> = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: 'white',
  mb: 2
} as const;

const paperStyles: SystemStyleObject<Theme> = {
  p: 2,
  bgcolor: 'rgba(255,255,255,0.1)',
  borderRadius: 2,
  height: '100%'
} as const;

const summaryPaperStyles: SystemStyleObject<Theme> = {
  ...paperStyles,
  mt: 3,
  overflow: 'auto'
} as const;

const tableCellStyles: SystemStyleObject<Theme> = {
  color: 'white'
} as const;

const LoadingContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  backgroundColor: 'black'
});

interface LocationInfo {
  name: string;
  country: string;
  state: string;
  continent: string;
}

const GlobePage: NextPage = () => {
  const { 
    healthData, 
    error,
    loading: healthLoading, 
    displayMetric,
    fetchHealthData
  }: HealthContextType = useHealth();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const hasTimedOut = useLoadingTimeout({ 
    isLoading: healthLoading || authLoading,
    timeoutMs: 15000 // 15 seconds for globe since it's more complex
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchHealthData().catch(console.error);
      notificationService.initializeNotifications(user, user.token).catch(console.error);
    }
  }, [authLoading, user, router, fetchHealthData]);

  if (!user && !authLoading) {
    router.push('/login');
    return null;
  }

  if (hasTimedOut) {
    return (
      <LoadingContainer>
        <LoadingTimeoutError 
          message="Loading the health globe is taking longer than expected." 
          onRetry={() => fetchHealthData()}
        />
      </LoadingContainer>
    );
  }

  if (authLoading || healthLoading) {
    return (
      <LoadingContainer>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ marginTop: '20px', color: 'white' }}>
          {authLoading ? 'Verifying your session...' : 'Loading your health data...'}
        </Typography>
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <LoadingContainer>
        <Error color="error" sx={{ fontSize: 60, marginBottom: '20px' }} />
        <Typography variant="h6" color="error" gutterBottom>
          {error.toString()}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Refresh />}
          onClick={() => fetchHealthData()}
          sx={{ marginTop: '20px' }}
        >
          Retry
        </Button>
      </LoadingContainer>
    );
  }

  const handleLocationHover = useCallback((location: LocationInfo | null) => {
    console.log('Location hover:', location);
  }, []);

  return (
    <Box component="main" sx={mainBoxStyles}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
        color: 'white'
      }}>
        <Typography variant="h4">Your Health Globe</Typography>
        <Button variant="contained" onClick={() => fetchHealthData()} startIcon={<Refresh />}>Refresh Data</Button>
      </div>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <div style={{ 
            height: '60vh',
            minHeight: '400px',
            position: 'relative'
          }}>
            <AnimatedGlobe 
              onLocationHover={handleLocationHover}
              displayMetric={displayMetric}
            />
            {healthData.length === 0 && (
              <div style={{ 
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: '20px',
                borderRadius: '8px',
                zIndex: 10
              }}>
                <Typography variant="h6" color="white">
                  No health data available. Start tracking to see your data on the globe!
                </Typography>
              </div>
            )}
          </div>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={paperStyles}>
            <Typography variant="h6" gutterBottom color="white">Health Trends</Typography>
            <HealthTrendChart onDataUpdate={(data, selectedMetrics) => {
              // Handle data updates here if needed
              console.log('Health trend data updated:', data, selectedMetrics);
            }} />
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={summaryPaperStyles}>
        <Typography variant="h6" gutterBottom color="white">Health Data Summary</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={tableCellStyles}>Date</TableCell>
              <TableCell sx={tableCellStyles}>Steps</TableCell>
              <TableCell sx={tableCellStyles}>Activity Level</TableCell>
              <TableCell sx={tableCellStyles}>Heart Rate</TableCell>
              {!isMobile && (
                <>
                  <TableCell sx={tableCellStyles}>BMI</TableCell>
                  <TableCell sx={tableCellStyles}>Environmental Impact</TableCell>
                  <TableCell sx={tableCellStyles}>Air Quality</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {healthData.length > 0 ? (
              healthData.map((data: any) => (
                <TableRow key={data.timestamp}>
                  <TableCell sx={tableCellStyles}>{formatDate(data.timestamp.toString())}</TableCell>
                  <TableCell sx={tableCellStyles}>{data.steps}</TableCell>
                  <TableCell sx={tableCellStyles}>{data.steps ? getActivityLevel(Number(data.steps)) : ''}</TableCell>
                  <TableCell sx={tableCellStyles}>{data.heartRate}</TableCell>
                  {!isMobile && (
                    <>
                      <TableCell sx={tableCellStyles}>{calculateBMI(Number(data.weight), Number(data.height))}</TableCell>
                      <TableCell sx={tableCellStyles}>{getEnvironmentalImpact(data)}</TableCell>
                      <TableCell sx={tableCellStyles}>{getAirQualityDescription(Number(data.airQualityIndex))}</TableCell>
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
