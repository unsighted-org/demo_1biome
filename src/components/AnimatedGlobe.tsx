import { Box, CircularProgress, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { debounce } from 'lodash';
import dynamic from 'next/dynamic';
import React, { useState, useCallback, useMemo, useEffect } from 'react';

import { useHealth } from '@/contexts/HealthContext';
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout';
import { LoadingTimeoutError } from '@/components/LoadingTimeoutError';

import GlobeErrorBoundary from './GlobeErrorBoundary';

import type { HealthEnvironmentData, HealthMetric } from '@/types';
import type { SelectChangeEvent } from '@mui/material';

const EnhancedGlobeVisualization = dynamic(() => import('./EnhancedGlobeVisualization'), {
  ssr: false,
  loading: () => <CircularProgress />
});

const HOVER_DEBOUNCE_TIME = 200; // ms

interface AnimatedGlobeProps {
  onLocationHover: (location: { name: string; country: string; state: string; continent: string } | null) => void;
  onPointSelect: (point: HealthEnvironmentData | null) => void;
}

const AnimatedGlobe: React.FC<AnimatedGlobeProps> = ({ onLocationHover, onPointSelect }) => {
  const { selectedMetrics, displayMetric, setDisplayMetric, error } = useHealth();
  const [selectedPoint,] = useState<HealthEnvironmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const { healthData } = useHealth();

  const hasTimedOut = useLoadingTimeout({ 
    isLoading: loading,
    timeoutMs: 20000 // 20 seconds for 3D globe initialization
  });

  useEffect(() => {
    // Set loading to false when globe is ready
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // Assuming initial load takes about 2 seconds

    return () => clearTimeout(timer);
  }, []);

  if (hasTimedOut) {
    return (
      <LoadingTimeoutError 
        message="3D Globe visualization is taking longer than expected to load." 
        onRetry={() => setLoading(false)}
      />
    );
  }

  if (loading) {
    return <CircularProgress />;
  }

  const handleMetricChange = useCallback((event: SelectChangeEvent<HealthMetric>) => {
    setDisplayMetric(event.target.value as HealthMetric);
  }, [setDisplayMetric]);

  const handlePointSelection = useCallback((point: HealthEnvironmentData | null): void => {
    onPointSelect(point);
  }, [onPointSelect]);

  const debouncedHandleLocationHover = useMemo(
    () => debounce(onLocationHover, HOVER_DEBOUNCE_TIME),
    [onLocationHover]
  );

  if (error) {
    return <Typography color="error">Error loading globe data: {error}</Typography>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      style={{ height: '100%', width: '100%' }}
    >
      <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
        <InputLabel id="metric-select-label">Select Metric</InputLabel>
        <Select
          labelId="metric-select-label"
          value={displayMetric}
          onChange={handleMetricChange}
          label="Select Metric"
        >
          {selectedMetrics.map((metric) => (
            <MenuItem key={metric} value={metric}>
              {metric.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Box sx={{ height: 'calc(100% - 80px)', width: '100%', position: 'relative' }}>
        <GlobeErrorBoundary>
          <EnhancedGlobeVisualization 
            onPointSelect={handlePointSelection} 
            onLocationHover={debouncedHandleLocationHover}
          />
        </GlobeErrorBoundary>
      </Box>
      {selectedPoint && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
          <Typography variant="h6">Selected Point</Typography>
          <Typography>Date: {new Date(selectedPoint.timestamp).toLocaleString()}</Typography>
          <Typography>Score: {selectedPoint[displayMetric]}</Typography>
        </Box>
      )}
    </motion.div>
  );
};

export default React.memo(AnimatedGlobe);