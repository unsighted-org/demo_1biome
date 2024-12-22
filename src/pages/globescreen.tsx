import React, { useEffect, useCallback, Suspense, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/material/styles';
import {
  CircularProgress,
  Typography,
  Button,
  Grid,
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Container,
} from '@mui/material';
import {
  Refresh,
  Error,
  LocationOn,
  Public
} from '@mui/icons-material';

import { RenderingPipeline } from '@/lib/renderingPipeline';
import GlobeControls from '@/components/GlobeControls';
import { useAuth } from '@/contexts/AuthContext';
import { useHealth } from '@/contexts/HealthContext';
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout';
import { LoadingTimeoutError } from '@/components/LoadingTimeoutError';
import type { LocationInfo } from '@/services/GeocodingService';
import { HealthTrendChart } from '@/components/HealthTrendChart';
import notificationService from '@/services/CustomNotificationService';
import { formatDate, calculateBMI, getActivityLevel, getEnvironmentalImpact, getAirQualityDescription } from '@/lib/helpers';

const LocationPanel = styled(motion(Paper))(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  left: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(5px)',
  maxWidth: '300px',
}));

const LoadingContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
  width: '100%',
  backgroundColor: theme.palette.background.default
}));

const AnimatedGlobe = dynamic(
  () => import('@/components/AnimatedGlobe').then(mod => mod.default),
  { 
    loading: () => (
      <LoadingContainer>
        <CircularProgress />
      </LoadingContainer>
    ),
    ssr: false
  }
);

export default function GlobePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { healthData, error: healthError, loading: healthLoading } = useHealth();
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const [currentTexture, setCurrentTexture] = useState<string>('blue-marble');
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const { loading, timedOut } = useLoadingTimeout({
    isLoading: healthLoading || authLoading,
    timeoutMs: 15000
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleTextureChange = useCallback(async (texture: string) => {
    setCurrentTexture(texture);
  }, []);

  const handleLocationHover = useCallback((location: LocationInfo | null) => {
    setSelectedLocation(location);
  }, []);

  if (timedOut) {
    return <LoadingTimeoutError />;
  }

  if (loading) {
    return (
      <LoadingContainer>
        <CircularProgress />
      </LoadingContainer>
    );
  }

  if (error || healthError) {
    return (
      <Container
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          gap: 2
        }}
      >
        <Error color="error" fontSize="large" />
        <Typography variant="h6" color="error">
          {(error || healthError)?.message || 'An error occurred while loading the globe'}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <AnimatedGlobe
        onLocationHover={handleLocationHover}
        displayMetric="cardioHealthScore"
      />
      <GlobeControls
        currentTexture={currentTexture}
        onTextureChange={handleTextureChange}
        rotation={rotation}
      />
      <AnimatePresence>
        {selectedLocation && (
          <LocationPanel
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Grid container spacing={1} alignItems="center">
              <Grid item>
                <LocationOn color="primary" />
              </Grid>
              <Grid item xs>
                <Typography variant="subtitle1">
                  {selectedLocation.formattedAddress}
                </Typography>
              </Grid>
            </Grid>
          </LocationPanel>
        )}
      </AnimatePresence>
      {healthData && (
        <Container sx={{ p: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Health Trends
                </Typography>
                <HealthTrendChart 
                  data={healthData}
                  onDataUpdate={(data, metrics) => {
                    console.log('Health data updated:', data, metrics);
                  } } selectedMetric={'steps'}                />
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Health Data Summary
                </Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Steps</TableCell>
                      <TableCell>Activity Level</TableCell>
                      <TableCell>Heart Rate</TableCell>
                      <TableCell>BMI</TableCell>
                      <TableCell>Environmental Impact</TableCell>
                      <TableCell>Air Quality</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {healthData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No health data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      healthData.map((data: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{formatDate(data.date)}</TableCell>
                          <TableCell>{data.steps}</TableCell>
                          <TableCell>{getActivityLevel(data.activityLevel)}</TableCell>
                          <TableCell>{data.heartRate}</TableCell>
                          <TableCell>{calculateBMI(data.height, data.weight)}</TableCell>
                          <TableCell>{getEnvironmentalImpact(data.environmentalImpact)}</TableCell>
                          <TableCell>{getAirQualityDescription(data.airQuality)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      )}
    </div>
  );
}