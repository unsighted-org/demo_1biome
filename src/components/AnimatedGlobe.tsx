import { CircularProgress, Typography, Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import React, { useState, Suspense } from 'react';

import GlobeErrorBoundary from './GlobeErrorBoundary';

import type { HealthEnvironmentData } from '@/types';

interface AnimatedGlobeProps {
  healthData: HealthEnvironmentData[];
  isLoading: boolean;
  error: string | null;
}

const EnhancedGlobeVisualization = dynamic(() => import('./EnhancedGlobeVisualization'), {
  ssr: false,
  loading: () => <div>Loading Globe...</div>
});

const AnimatedGlobe: React.FC<AnimatedGlobeProps> = ({ healthData, isLoading, error }) => {
  const [displayMetric, setDisplayMetric] = useState<keyof HealthEnvironmentData>('environmentalImpactScore');

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="animated-globe-container"
    >
      {healthData.length === 0 ? (
        <Typography align="center">No health data available. Start tracking to see your globe!</Typography>
      ) : (
        <>
          <FormControl fullWidth variant="outlined" margin="normal">
            <InputLabel id="metric-select-label">Select Metric</InputLabel>
            <Select
              labelId="metric-select-label"
              value={displayMetric}
              onChange={(e) => setDisplayMetric(e.target.value as keyof HealthEnvironmentData)}
              label="Select Metric"
            >
              <MenuItem value="environmentalImpactScore">Environmental Impact</MenuItem>
              <MenuItem value="cardioHealthScore">Cardiovascular Health</MenuItem>
              <MenuItem value="respiratoryHealthScore">Respiratory Health</MenuItem>
              <MenuItem value="physicalActivityScore">Physical Activity</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ height: '60vh', width: '100%', position: 'relative' }}>
            <GlobeErrorBoundary>
              <Suspense fallback={<div>Loading Globe...</div>}>
                <EnhancedGlobeVisualization healthData={healthData} displayMetric={displayMetric} />
              </Suspense>
            </GlobeErrorBoundary>
          </Box>
        </>
      )}
    </motion.div>
  );
};

export default AnimatedGlobe;
