import React, { useEffect, useState, useCallback } from 'react';
import { OrbitControls, Stars } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';

import * as THREE from 'three';

import { initializeGeoData } from '@/lib/helpers';
import { useHealth } from '@/contexts/HealthContext';
import Globe from './Globe';
import { useGlobeOptimizations } from './useGlobeOptimizations';

import type { HealthEnvironmentData, HealthMetric } from '@/types';
import type { OrbitControlsChangeEvent } from '@react-three/drei';

interface EnhancedGlobeVisualizationProps {
  onLocationHover: (location: { latitude: number; longitude: number; } | null) => void;
  isInteracting: boolean;
  onZoomChange: (zoom: number) => void;
  onCameraChange: (center: { latitude: number; longitude: number; }, zoom: number) => void;
  displayMetric: HealthMetric;
}

const ZOOM_THRESHOLD = 2;

export const EnhancedGlobeVisualization: React.FC<EnhancedGlobeVisualizationProps> = ({
  onLocationHover,
  isInteracting,
  onZoomChange,
  onCameraChange,
  displayMetric
}) => {
  const { healthData } = useHealth();
  const [error, setError] = useState<string | null>(null);
  const [isGeoDataLoading, setIsGeoDataLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<HealthEnvironmentData | null>(null);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [dynamicTexture, setDynamicTexture] = useState<THREE.Texture | undefined>();

  const { isOptimized, frameRate } = useGlobeOptimizations();
  const { scene } = useThree();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsGeoDataLoading(true);
        await initializeGeoData();
        setIsGeoDataLoading(false);
      } catch (err) {
        console.error('Failed to initialize geo data:', err);
        setIsGeoDataLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (scene && dynamicTexture) {
      const earth = new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 32),
        new THREE.MeshPhongMaterial({ 
          map: dynamicTexture,
          bumpScale: 0.05,
          specular: new THREE.Color('grey'),
          shininess: 5
        })
      );
      // enableFeature('earth', earth);

      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, 32, 32),
        new THREE.MeshPhongMaterial({
          transparent: true,
          opacity: 0.3,
          color: 0x0077ff
        })
      );
      // enableFeature('atmosphere', atmosphere);

      return () => {
        // disableFeature('earth');
        // disableFeature('atmosphere');
      };
    }
  }, [scene, dynamicTexture]);

  useEffect(() => {
    if (scene && frameRate < 30) {
      // updateConfig({ priority: 'LOW' });
      // optimizeScene();
    }
  }, [scene, frameRate]);

  const handleZoomChange = useCallback((zoom: number) => {
    onZoomChange(zoom);
    setIsZoomedIn(zoom > ZOOM_THRESHOLD);
  }, [onZoomChange]);

  const handlePointSelect = useCallback((point: HealthEnvironmentData | null) => {
    setSelectedPoint(point);
  }, []);

  const handleTextureReady = useCallback((texture: THREE.Texture) => {
    setDynamicTexture(texture);
  }, []);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (isGeoDataLoading) {
    return <div className="loading-message">Initializing geographical data...</div>;
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          enableRotate={true}
          onChange={(e?: OrbitControlsChangeEvent | undefined) => handleZoomChange(e?.target?.object?.position?.z ?? 0)}
        />
        <Stars />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.7} />
        <Globe
          onPointSelect={handlePointSelect}
          onLocationHover={onLocationHover}
          isInteracting={isInteracting}
          onZoomChange={handleZoomChange}
          onCameraChange={onCameraChange}
          displayMetric={displayMetric}
          dynamicTexture={dynamicTexture}
          useDynamicTexture={!!dynamicTexture}
        />
      </Canvas>
      <AnimatePresence>
        {isZoomedIn && selectedPoint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="point-details"
          >
            <h3>Selected Point Details</h3>
            <p>Location: {selectedPoint.location?.toString() || 'Unknown'}</p>
            <p>Health Score: {selectedPoint[displayMetric]?.toString() || 'N/A'}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedGlobeVisualization;
