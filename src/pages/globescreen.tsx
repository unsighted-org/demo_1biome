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
import React, { useEffect, useState, useCallback } from 'react';
import type { GetServerSideProps, NextPage } from 'next';

import HealthTrendChart from '@/components/HealthTrendChart';
import { useAuth } from '@/context/AuthContext';
import { formatDate, calculateBMI, getActivityLevel, getEnvironmentalImpact, getAirQualityDescription } from '@/lib/helpers';
import { useHealthData, fetchInitialHealthData } from '@/hooks/useHealthData';

import type { HealthEnvironmentData } from '@/types';
import { GetServerSidePropsContext } from 'next';

const AnimatedGlobe = dynamic(() => import('@/components/AnimatedGlobe'), { ssr: false });

interface GlobePageProps {
  initialHealthData: HealthEnvironmentData[];
}

const GlobePage: NextPage<GlobePageProps> = ({ initialHealthData }: GlobePageProps) => {
  const [healthData, setHealthData] = useState<HealthEnvironmentData[]>(initialHealthData || []);
  const { user, loading: authLoading } = useAuth();
  const { loading: healthDataLoading, error, fetchHealthData } = useHealthData(user);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (user && !healthData.length) {
      fetchHealthData(1).catch((error) => {
        console.error('Failed to fetch health data:', error);
      });
    }
  }, [user, fetchHealthData, healthData]);

  if (authLoading || healthDataLoading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh" bgcolor="black">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ marginTop: '20px', color: 'white' }}>Loading your health data...</Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh" bgcolor="black">
        <Typography variant="h6" sx={{ marginTop: '20px', color: 'white' }}>Please login to view your health data.</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh" bgcolor="black">
        <Error color="error" sx={{ fontSize: 60, marginBottom: '20px' }} />
        <Typography variant="h5" color="error" gutterBottom>Oops! Something went wrong.</Typography>
        <Typography variant="body1" gutterBottom color="white">{error}</Typography>
        <Button variant="contained" onClick={() => fetchHealthData(1)} startIcon={<Refresh />} sx={{ marginTop: '20px' }}>Retry</Button>
      </Box>
    );
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
        <Button variant="contained" onClick={() => fetchHealthData(1)} startIcon={<Refresh />}>Refresh Data</Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {healthData && healthData.length > 0 ? (
            <Box sx={{ height: '60vh', minHeight: '400px' }}>
              <AnimatedGlobe healthData={healthData} isLoading={healthDataLoading} error={error} />
            </Box>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" height="60vh" minHeight="400px">
              <Typography variant="h6">No health data available. Start tracking to see your globe!</Typography>
            </Box>
          )}
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <HealthTrendChart healthData={healthData} />
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, borderRadius: 2, mt: 3, overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>Health Data Summary</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Steps</TableCell>
              <TableCell>Activity Level</TableCell>
              <TableCell>Heart Rate</TableCell>
              {!isMobile && (
                <>
                  <TableCell>BMI</TableCell>
                  <TableCell>Environmental Impact</TableCell>
                  <TableCell>Air Quality</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {healthData && healthData.length > 0 ? (
              healthData.map((data: HealthEnvironmentData) => (
                <TableRow key={data.timestamp.toString()}>
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

export const getServerSideProps: GetServerSideProps<GlobePageProps> = async (
  context: GetServerSidePropsContext
) => {
  const token = context.req.cookies['auth_token'];

  if (!token) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  try {
    const initialHealthData = await fetchInitialHealthData(token);
    return { props: { initialHealthData } };
  } catch (error) {
    console.error('Error fetching initial health data:', error);
    return { props: { initialHealthData: [] } };
  }
};

export default GlobePage;
