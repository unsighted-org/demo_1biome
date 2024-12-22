import React, { useCallback, useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useThreeContext } from '@/hooks/useThreeContext';
import { GlobeTextureType, useGlobeTexture } from '@/hooks/useGlobeTexture';
import GlobeCanvas from './GlobeCanvas';
import Globe from './Globe';
import GlobeControls from './GlobeControls';
import ErrorBoundary from './ErrorBoundary';
import type { HealthEnvironmentData, HealthMetric } from '@/types';
import { RenderingPipeline } from '@/lib/renderingPipeline';
import notificationService from '@/services/CustomNotificationService';
import { width } from '@mui/system';

interface EnhancedGlobeVisualizationProps {
  onLocationHover: (location: { latitude: number; longitude: number; } | null) => Promise<void>;
  isInteracting: boolean;
  onZoomChange: (newZoom: number) => void;
  onCameraChange: (newCenter: { latitude: number; longitude: number; }, newZoom: number) => void;
  displayMetric: HealthMetric;
  currentTexture: GlobeTextureType;
  onTextureChange: (texture: GlobeTextureType) => void;
  isLoading: boolean;
  error: string | null;
}

const EnhancedGlobeVisualization: React.FC<EnhancedGlobeVisualizationProps> = ({
  onLocationHover,
  isInteracting,
  onZoomChange,
  onCameraChange,
  displayMetric,
  currentTexture,
  onTextureChange,
  isLoading,
  error
}) => {
  const [renderingPipeline] = useState(() => new RenderingPipeline(document.createElement('canvas'), { quality: 'high' }));
  const { error: contextError, isInitialized } = useThreeContext(renderingPipeline);
  const { 
    currentTexture: propTexture,
    setTexture: handleTextureChange,
    loading: textureLoading,
    error: textureError 
  } = useGlobeTexture(renderingPipeline);

  useEffect(() => {
    if (propTexture && propTexture !== currentTexture) {
      handleTextureChange(propTexture as GlobeTextureType);
    }
  }, [propTexture, currentTexture, handleTextureChange]);

  const handleTextureUpdate = useCallback((texture: string) => {
    handleTextureChange(texture as GlobeTextureType);
    onTextureChange?.(texture as GlobeTextureType);
  }, [handleTextureChange, onTextureChange]);

  const handleError = useCallback((error: Error) => {
    notificationService.error('An error occurred while loading the globe. Please try again later.');
  }, []);

  const boxStyles = {
    width: '100%', 
    height: '100%', 
    position: 'relative',
    overflow: 'hidden'
  };

  return (
    <ErrorBoundary>

      <Box 
        sx={boxStyles}
      >
        {(!isInitialized || textureLoading) && (
            <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1
            }}
            >
            <CircularProgress />
            </Box>
        )}
        
        <GlobeCanvas onError={handleError}>
          <Globe
            displayMetric={displayMetric}
            onLocationHover={onLocationHover}
            isInteracting={isInteracting}
            onZoomChange={onZoomChange}
            onCameraChange={onCameraChange}
            onPointSelect={(point) => {
              console.log('Point selected:', point);
            } }          />
        </GlobeCanvas>

        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            zIndex: 1
          }}
        >
          <GlobeControls
            currentTexture={currentTexture}
            onTextureChange={handleTextureUpdate}
            rotation={{ x: 0, y: 0 }}
          />
        </Box>
      </Box>
    </ErrorBoundary>
  );
};

export default EnhancedGlobeVisualization;
