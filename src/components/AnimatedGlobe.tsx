import React, {
  useState,
  useCallback,
  useMemo,
  useEffect
} from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';
import { CircularProgress, Typography } from '@mui/material';

import { useHealth } from '@/contexts/HealthContext';
import { getLocationInfo } from '@/lib/helpers';
import { RenderingPipeline } from '@/lib/renderingPipeline';
import { LocationInfo } from '@/services/GeocodingService';
import { useGlobeTexture } from '@/hooks/useGlobeTexture';
import type { HealthMetric } from '@/types';

// Dynamically import the Globe Visualization
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
    ),
  }
);

// Dynamically import a fallback component for error states
const FallbackComponent = dynamic(() => import('./FallbackComponent'), {
  ssr: false
});

interface AnimatedGlobeProps {
  onLocationHover: (location: LocationInfo | null) => void;
  displayMetric: HealthMetric;
  renderingPipeline?: RenderingPipeline;
}

// A small utility to clamp numeric values (e.g., zoom)
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export const AnimatedGlobe: React.FC<AnimatedGlobeProps> = ({
  onLocationHover,
  displayMetric,
  renderingPipeline
}) => {
  const { healthData } = useHealth();
  
  // Local states
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ latitude: 0, longitude: 0 });
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);

  // Get texture from pipeline (if any)
  const {
    currentTexture,
    setTexture: handleTextureChange,
    loading: textureLoading,
    error: textureError
  } = useGlobeTexture(renderingPipeline);

  /**
   * Handle zoom updates: clamp the zoom value
   */
  const handleZoomChange = useCallback((newZoom: number) => {
    // For example, clamp between 0.5 and 10 (customize to your preference)
    setZoom((prevZoom) => clamp(newZoom, 0.5, 10));
  }, []);

  /**
   * Handle camera changes (center lat/long + zoom).
   * Note: also clamp zoom here in case EnhancedGlobeVisualization
   * calls onCameraChange with out-of-range zoom.
   */
  const handleCameraChange = useCallback(
    (newCenter: { latitude: number; longitude: number }, newZoom: number) => {
      setCenter(newCenter);
      setZoom(clamp(newZoom, 0.5, 10));
    },
    []
  );

  /**
   * Debounced function to fetch location info only every 300ms or so,
   * preventing spamming your geocoding service if the user hovers quickly.
   */
  const handleLocationHoverDebounced = useMemo(
    () =>
      debounce(async (location: { latitude: number; longitude: number } | null) => {
        if (!location) {
          setLocationInfo(null);
          onLocationHover(null);
          return;
        }
        try {
          const regionInfo = await getLocationInfo(location.latitude, location.longitude);
          const loc: LocationInfo = {
            ...regionInfo,
            formattedAddress: regionInfo.formattedAddress || ''
          };
          setLocationInfo(loc);
          onLocationHover(loc);
        } catch (err) {
          console.error('Error getting region info:', err);
          setLocationInfo(null);
          onLocationHover(null);
          // If you'd like to show an error fallback:
          // setError(new Error('Failed to fetch location info.'));
        }
      }, 300),
    [onLocationHover]
  );

  /**
   * Wrapper for the debounced hover to keep stable references in your component
   */
  const handleLocationHover = useCallback(
    async (location: { latitude: number; longitude: number } | null) => {
      await handleLocationHoverDebounced(location);
    },
    [handleLocationHoverDebounced]
  );

  /**
   * Watch for texture errors, or when texture loading finishes
   */
  useEffect(() => {
    if (textureError) {
      setError(
        new Error(textureError || 'Something went wrong loading the texture.')
      );
    }
    // If texture is done loading, remove the loading state
    if (!textureLoading) {
      setIsLoading(false);
    }
  }, [textureError, textureLoading]);

  /**
   * If there's a top-level error, show fallback
   */
  if (error) {
    return (
      <FallbackComponent
        error={error}
        resetErrorBoundary={() => setError(null)}
      />
    );
  }

  return (
    <div className="globe-visualization">
      <EnhancedGlobeVisualization
        // UI interactions
        isInteracting={isInteracting}
        // Hover
        onLocationHover={handleLocationHover}
        // Zoom & camera
        onZoomChange={handleZoomChange}
        onCameraChange={handleCameraChange}
        // Metrics & textures
        displayMetric={displayMetric}
        currentTexture={currentTexture}
        onTextureChange={handleTextureChange}
        // Loading & error
        isLoading={isLoading}
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
                  {locationInfo.state && <span>{locationInfo.state}</span>}
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
};

export default AnimatedGlobe;
