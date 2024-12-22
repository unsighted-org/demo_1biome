import { CircularProgress, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';
import dynamic from 'next/dynamic';
import React, { useState, useCallback, useMemo, useEffect } from 'react';

import { useHealth } from '@/contexts/HealthContext';
import { getLocationInfo } from '@/lib/helpers';
import { RenderingPipeline } from '@/lib/renderingPipeline';
import type { HealthEnvironmentData, HealthMetric } from '@/types';
import { LocationInfo } from '@/services/GeocodingService';
import { useGlobeTexture } from '@/hooks/useGlobeTexture';

// Dynamically import components
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
  onLocationHover: (location: LocationInfo | null) => void;
  displayMetric: HealthMetric;
  renderingPipeline?: RenderingPipeline;
}

export const AnimatedGlobe: React.FC<AnimatedGlobeProps> = ({ 
  onLocationHover, 
  displayMetric,
  renderingPipeline 
}) => {
  const { healthData } = useHealth();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ latitude: 0, longitude: 0 });
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);

  const { 
    currentTexture, 
    setTexture: handleTextureChange,
    loading: textureLoading,
    error: textureError 
  } = useGlobeTexture(renderingPipeline);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const handleCameraChange = useCallback((newCenter: { latitude: number; longitude: number; }, newZoom: number) => {
    setCenter(newCenter);
    setZoom(newZoom);
  }, []);

  const handleLocationHover = useCallback(async (location: { latitude: number; longitude: number; } | null) => {
    if (!location) {
      setLocationInfo(null);
      onLocationHover(null);
      return;
    }

    try {
      const regionInfo = await getLocationInfo(location.latitude, location.longitude);
      setLocationInfo({
        ...regionInfo,
        formattedAddress: regionInfo.formattedAddress || ''
      });
      onLocationHover({
        ...regionInfo,
        formattedAddress: regionInfo.formattedAddress || ''
      });
    } catch (error) {
      console.error('Error getting region info:', error);
      setLocationInfo(null);
      onLocationHover(null);
    }
  }, [onLocationHover]);

  useEffect(() => {
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
        currentTexture={currentTexture}
        onTextureChange={handleTextureChange}
        isLoading={isLoading || textureLoading}
        error={textureError}
      />
      <AnimatePresence>
        {locationInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="location-info"
          >
            <Typography variant="h6" component="div">
              {locationInfo.formattedAddress || (
                <>
                  {locationInfo.formattedAddress && <span>{locationInfo.formattedAddress}</span>}
                  {locationInfo.state && <span>, {locationInfo.state}</span>}
                  {locationInfo.country && <span>, {locationInfo.country}</span>}
                </>
              )}
            </Typography>
            {locationInfo.neighborhood && (
              <Typography variant="body2" color="textSecondary">
                Neighborhood: {locationInfo.neighborhood}
              </Typography>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AnimatedGlobe;