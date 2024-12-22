import { CircularProgress, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';
import dynamic from 'next/dynamic';
import React, { useState, useCallback, useMemo, useEffect } from 'react';

import { useHealth } from '@/contexts/HealthContext';
import { getRegionInfo } from '@/lib/helpers';
import type { HealthEnvironmentData, HealthMetric } from '@/types';

// Dynamically import the EnhancedGlobeVisualization component
const EnhancedGlobeVisualization = dynamic(
  () => import('./EnhancedGlobeVisualization'),
  { ssr: false }
);

const GlobeErrorBoundary = dynamic(
  () => import('./GlobeErrorBoundary'),
  { ssr: false }
);

const HOVER_DEBOUNCE_TIME = 200; // ms

interface AnimatedGlobeProps {
  onLocationHover: (location: { name: string; country: string; state: string; continent: string; } | null) => void;
  displayMetric: HealthMetric;
}

export const AnimatedGlobe: React.FC<AnimatedGlobeProps> = ({ onLocationHover, displayMetric }) => {
  const { healthData } = useHealth();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ latitude: 0, longitude: 0 });

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const handleCameraChange = useCallback((newCenter: { latitude: number; longitude: number; }, newZoom: number) => {
    setCenter(newCenter);
    setZoom(newZoom);
  }, []);

  const handleLocationHover = useCallback(async (location: { latitude: number; longitude: number; } | null) => {
    if (!location) {
      onLocationHover(null);
      return;
    }

    try {
      const regionInfo = await getRegionInfo(location.latitude, location.longitude);
      onLocationHover({
        name: regionInfo.city || 'Unknown',
        country: regionInfo.country || 'Unknown',
        state: regionInfo.state || 'Unknown',
        continent: regionInfo.continent || 'Unknown'
      });
    } catch (error) {
      console.error('Error getting region info:', error);
      onLocationHover(null);
    }
  }, [onLocationHover]);

  const debouncedHandleLocationHover = useMemo(
    () => debounce(handleLocationHover, HOVER_DEBOUNCE_TIME),
    [handleLocationHover]
  );

  useEffect(() => {
    return () => {
      debouncedHandleLocationHover.cancel();
    };
  }, [debouncedHandleLocationHover]);

  if (error) {
    return (
      <Typography color="error" variant="h6">
        Error loading globe visualization: {error.message}
      </Typography>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="globe-container">
      <div className="globe-visualization">
        <GlobeErrorBoundary>
          <EnhancedGlobeVisualization 
            onLocationHover={debouncedHandleLocationHover}
            isInteracting={isInteracting}
            onZoomChange={handleZoomChange}
            onCameraChange={handleCameraChange}
            displayMetric={displayMetric}
          />
        </GlobeErrorBoundary>
      </div>
      <AnimatePresence>
        {isInteracting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="interaction-overlay"
          >
            <p>Zoom: {zoom.toFixed(2)}</p>
            <p>Center: {center.latitude.toFixed(2)}, {center.longitude.toFixed(2)}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedGlobe;