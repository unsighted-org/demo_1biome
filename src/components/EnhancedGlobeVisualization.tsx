import React, { useEffect, useState, useCallback } from 'react';
import { Stars } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

import { initializeGeoData } from '@/lib/helpers';
import { useHealth } from '@/contexts/HealthContext';
import Globe from './Globe';
import { useGlobeOptimizations } from './useGlobeOptimizations';

import type { HealthEnvironmentData, HealthMetric } from '@/types';
import { OrbitControls } from '@react-three/drei';

interface EnhancedGlobeVisualizationProps {
  onLocationHover: (location: { latitude: number; longitude: number; } | null) => void;
  isInteracting: boolean;
  onZoomChange: (zoom: number) => void;
  onCameraChange: (center: { latitude: number; longitude: number; }, zoom: number) => void;
  displayMetric: HealthMetric;
}

const ZOOM_THRESHOLD = 2;

// This component contains the actual 3D scene content
const GlobeScene: React.FC<EnhancedGlobeVisualizationProps> = ({
  onLocationHover,
  isInteracting,
  onZoomChange,
  onCameraChange,
  displayMetric
}) => {
  const { healthData } = useHealth();
  const [selectedPoint, setSelectedPoint] = useState<HealthEnvironmentData | null>(null);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [dynamicTexture, setDynamicTexture] = useState<THREE.Texture | undefined>();

  const { isOptimized, frameRate } = useGlobeOptimizations();

  const handlePointSelect = useCallback((point: HealthEnvironmentData | null) => {
    setSelectedPoint(point);
  }, []);

  const handleOrbitChange = useCallback((event?: THREE.Event) => {
    if (!event) return;
    const controls = event?.target as typeof OrbitControls;
    const zoom = (controls as any).object.position.length();
    const wasZoomedIn = isZoomedIn;
    const newIsZoomedIn = zoom < ZOOM_THRESHOLD;

    if (wasZoomedIn !== newIsZoomedIn) {
      setIsZoomedIn(newIsZoomedIn);
    }

    onZoomChange(zoom);
  }, [isZoomedIn, onZoomChange]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Stars radius={300} depth={60} count={1000} factor={7} fade={true} />
      <Globe
        onPointSelect={handlePointSelect}
        onLocationHover={onLocationHover}
        isInteracting={isInteracting}
        onZoomChange={onZoomChange}
        onCameraChange={onCameraChange}
        displayMetric={displayMetric}
        useDynamicTexture={true}
        dynamicTexture={dynamicTexture}
      />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        onChange={handleOrbitChange}
        minDistance={1.5}
        maxDistance={10}
      />
    </>
  );
};

// Main component that wraps the scene with Canvas
export const EnhancedGlobeVisualization: React.FC<EnhancedGlobeVisualizationProps> = (props) => {
  const [error, setError] = useState<string | null>(null);
  const [isGeoDataLoading, setIsGeoDataLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsGeoDataLoading(true);
        await initializeGeoData();
        setIsGeoDataLoading(false);
      } catch (err) {
        console.error('Failed to initialize geo data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load geographical data');
        setIsGeoDataLoading(false);
      }
    };

    loadData();
  }, []);

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{
          position: [0, 0, 4],
          fov: 45,
          near: 0.1,
          far: 1000
        }}
        style={{ background: 'transparent' }}
      >
        <GlobeScene {...props} />
      </Canvas>
      {isGeoDataLoading && (
        <div className="loading-overlay">
          <p>Loading geographical data...</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedGlobeVisualization;
