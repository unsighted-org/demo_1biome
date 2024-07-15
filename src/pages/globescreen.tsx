import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import type { NextPage } from 'next';
import { useRouter } from 'next/router';

import HealthTrendChart from '@/components/HealthTrendChart';
import { useHealth } from '@/services/HealthContext';
import { useAuth } from '@/context/AuthContext';
import {
  formatDate,
  calculateBMI,
  getActivityLevel,
  getEnvironmentalImpact,
  getAirQualityDescription,
  getUVIndexDescription,
  getNoiseLevelDescription,
  getHealthScoreDescription,
} from '@/lib/helpers';
import type { HealthEnvironmentData } from '@/types';

const AnimatedGlobe = dynamic(() => import('@/components/AnimatedGlobe'), { ssr: false });

type ProcessedHealthData = HealthEnvironmentData & {
  formattedDate: string;
  bmi: number;
  activityLevel: string;
  environmentalImpact: string;
  airQualityDescription: string;
  uvIndexDescription: string;
  noiseLevelDescription: string;
  healthScoreDescription: string;
};

const GlobePage: NextPage = () => {
  const { fetchHealthData, loading: healthDataLoading, error, healthData } = useHealth();
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [processedHealthData, setProcessedHealthData] = useState<ProcessedHealthData[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const chartRef = useRef<any>(null);
  const [page, setPage] = useState(1);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loadingState, setLoadingState] = useState('');

const processHealthData = useCallback((data: HealthEnvironmentData[]): ProcessedHealthData[] => {
  return data.map(item => {
    const overallHealthScore = (
      item.cardioHealthScore +
      item.respiratoryHealthScore +
      item.physicalActivityScore +
      item.environmentalImpactScore
    ) / 4; // Simple average of all scores

    return {
      ...item,
      formattedDate: formatDate(item.timestamp.toString()),
      bmi: calculateBMI(Number(item.weight), Number(item.height)),
      activityLevel: getActivityLevel(Number(item.steps)),
      environmentalImpact: getEnvironmentalImpact(item),
      airQualityDescription: getAirQualityDescription(Number(item.airQualityIndex)),
      uvIndexDescription: getUVIndexDescription(Number(item.uvIndex)),
      noiseLevelDescription: getNoiseLevelDescription(Number(item.noiseLevel)),
      healthScoreDescription: getHealthScoreDescription(overallHealthScore),
    };
  });
  }, []);

  const handleHealthTrendDataUpdate = useCallback((data: HealthEnvironmentData[], metrics: string[]) => {
    const processed = processHealthData(data);
    setProcessedHealthData(processed);
    setSelectedMetrics(metrics);
  }, [processHealthData]);

  useEffect(() => {
    if (isInitialLoad && user) {
      console.log('Initial load, fetching health data');
      setLoadingState('Fetching initial health data');
      fetchHealthData(1).then(() => {
        console.log('Initial health data fetched');
        setIsInitialLoad(false);
        setLoadingState('Processing data');
      });
    }
  }, [user, fetchHealthData, isInitialLoad]);

  useEffect(() => {
    if (!isInitialLoad && healthData.length > 0) {
      console.log('Processing health data');
      const processed = processHealthData(healthData);
      setProcessedHealthData(processed);
      setLoadingState('Ready');
    }
  }, [healthData, processHealthData, isInitialLoad]);

  const handleRefresh = async () => {
    setPage(1);
    await fetchHealthData(1);
    if (chartRef.current) {
      chartRef.current.refreshData();
    }
  };

  const handleLoadMore = useCallback(() => {
    setPage(prevPage => {
      const nextPage = prevPage + 1;
      fetchHealthData(nextPage);
      return nextPage;
    });
  }, [fetchHealthData]);

  if (!user || isInitialLoad) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
        <Typography variant="h6" style={{ marginTop: '1rem' }}>{loadingState}</Typography>
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
        <Button 
          variant="contained" 
          onClick={handleRefresh} 
          startIcon={<Refresh />}
          disabled={healthDataLoading}
        >
          {healthDataLoading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </Box>

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.main' }}>
          <Typography color="error">Error: {error}</Typography>
        </Paper>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {isInitialLoad ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="60vh" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : processedHealthData.length > 0 ? (
            <Box sx={{ height: '60vh', minHeight: '400px' }}>
              <AnimatedGlobe 
                healthData={processedHealthData} 
                isLoading={healthDataLoading} 
                error={error} 
                selectedMetrics={selectedMetrics}
              />
            </Box>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" height="60vh" minHeight="400px">
              <Typography variant="h6">No health data available. Start tracking to see your globe!</Typography>
            </Box>
          )}
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <HealthTrendChart 
              ref={chartRef}
              onDataUpdate={handleHealthTrendDataUpdate} 
            />
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
            {isInitialLoad ? (
              <TableRow>
                <TableCell colSpan={isMobile ? 4 : 7}>
                  <Skeleton variant="rectangular" height={40} />
                </TableCell>
              </TableRow>
            ) : processedHealthData.length > 0 ? (
              processedHealthData.map((data) => (
                <TableRow key={data.timestamp.toString()}>
                  <TableCell>{data.formattedDate}</TableCell>
                  <TableCell>{data.steps}</TableCell>
                  <TableCell>{data.activityLevel}</TableCell>
                  <TableCell>{data.heartRate}</TableCell>
                  {!isMobile && (
                    <>
                      <TableCell>{data.bmi.toFixed(2)}</TableCell>
                      <TableCell>{data.environmentalImpact}</TableCell>
                      <TableCell>{data.airQualityDescription}</TableCell>
                    </>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isMobile ? 4 : 7}>
                  <Typography align="center">No health data available</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {!isInitialLoad && !healthDataLoading && healthData.length > 0 && (
        <Button onClick={handleLoadMore} sx={{ mt: 2 }} disabled={healthDataLoading}>
          {healthDataLoading ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </Box>
  );
};

export default GlobePage;
