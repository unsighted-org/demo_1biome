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
  { 
    ssr: false,
    loading: () => (
      <div className="globe-loading-container">
        <CircularProgress size={40} />
        <Typography variant="body1" className="loading-text">
          Loading Globe...
        </Typography>
      </div>
    )
  }
);

const FallbackComponent = dynamic(
  () => import('./FallbackComponent'),
  { ssr: false }
);

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
        name: regionInfo.city,
        country: regionInfo.country,
        state: regionInfo.state,
        continent: regionInfo.continent
      });
    } catch (error) {
      console.error('Error getting region info:', error);
      onLocationHover(null);
    }
  }, [onLocationHover]);

  useEffect(() => {
    // Simulate loading time for smoother transitions
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return <FallbackComponent error={error} resetErrorBoundary={() => setError(null)} />;
  }

  return (
    <div className="globe-visualization">
      <EnhancedGlobeVisualization
        onLocationHover={handleLocationHover}
        isInteracting={isInteracting}
        onZoomChange={handleZoomChange}
        onCameraChange={handleCameraChange}
        displayMetric={displayMetric}
      />
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="globe-loading-container"
          >
            <CircularProgress size={40} />
            <Typography variant="body1" className="loading-text">
              Loading Globe...
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedGlobe;