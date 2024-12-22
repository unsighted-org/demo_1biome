import React, { useCallback, useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useThreeContext } from '@/hooks/useThreeContext';
import { GlobeTextureType, useGlobeTexture } from '@/hooks/useGlobeTexture';
import GlobeCanvas from './GlobeCanvas';
import Globe from './Globe';
import GlobeControls from './GlobeControls';
import ErrorBoundary from './ErrorBoundary';
import type { HealthMetric } from '@/types';
import { RenderingPipeline } from '@/lib/renderingPipeline';
import notificationService from '@/services/CustomNotificationService';
import styles from '@/styles/Globe.module.css';

interface EnhancedGlobeVisualizationProps {
  onLocationHover: (location: { latitude: number; longitude: number; } | null) => Promise<void>;
  isInteracting: boolean;
  onZoomChange: (newZoom: number) => void;
  onCameraChange: (newCenter: { latitude: number; longitude: number; }, newZoom: number) => void;
  displayMetric: HealthMetric;
  currentTexture: GlobeTextureType;
  onTextureChange: (texture: GlobeTextureType) => Promise<void>;
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

  const handleTextureUpdate = useCallback(async (texture: GlobeTextureType) => {
    handleTextureChange(texture);
    await onTextureChange?.(texture);
  }, [handleTextureChange, onTextureChange]);

  const handleError = useCallback((error: Error) => {
    notificationService.error('An error occurred while loading the globe. Please try again later.');
  }, []);

  return (
    <ErrorBoundary>
      <div className={styles['globe-visualization']}>
        {(!isInitialized || textureLoading) && (
          <div className={styles['globe-loading-overlay']}>
            <div className={styles['globe-loading-container']}>
              <CircularProgress />
              <span className={styles['loading-text']}>Loading Globe...</span>
            </div>
          </div>
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
            }}
          />
        </GlobeCanvas>

        <div className={styles['globe-controls-container']}>
          <div className={styles['globe-controls-panel']}>
            <GlobeControls
              currentTexture={currentTexture}
              onTextureChange={handleTextureUpdate}
              rotation={{ x: 0, y: 0 }}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default EnhancedGlobeVisualization;