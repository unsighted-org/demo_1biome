// src/components/EnhancedGlobeVisualization.tsx
import { OrbitControls, Stars } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';

import type { HealthEnvironmentData } from '@/types';

interface GlobeProps {
  healthData: HealthEnvironmentData[];
  displayMetric: keyof HealthEnvironmentData;
}

interface EnhancedGlobeVisualizationProps {
  healthData: HealthEnvironmentData[];
  displayMetric: keyof HealthEnvironmentData;
}

const Globe = dynamic(() => import('./Globe'), { ssr: false });

interface EnhancedGlobeVisualizationProps {
  healthData: HealthEnvironmentData[];
  displayMetric: keyof HealthEnvironmentData;
}

const EnhancedGlobeVisualization: React.FC<EnhancedGlobeVisualizationProps & GlobeProps> = ({ healthData, displayMetric }) => {
  const [error, setError] = useState<string | null>(null);
  const [isGeoDataLoading, setIsGeoDataLoading] = useState(true);

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        const { loadGeoData } = await import('@/lib/helpers');
        await loadGeoData();
        setIsGeoDataLoading(false);
      } catch (err) {
        console.error('Failed to load geo data:', err);
        setError('Failed to load geographical data. Please refresh the page.');
        setIsGeoDataLoading(false);
      }
    };
    loadData();
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  if (isGeoDataLoading) {
    return <div>Loading geographical data...</div>;
  }

  return (
    <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
      <OrbitControls enableZoom={true} enablePan={false} enableRotate={true} />
      <Stars />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.7} />
      <Globe displayMetric={displayMetric} healthData={[]} />
    </Canvas>
  );
};

export default EnhancedGlobeVisualization;