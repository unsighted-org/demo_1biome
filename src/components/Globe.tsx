import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { throttle } from 'lodash';

import { optimizationManager } from '@/utils/optimizationManager';
import { DataPointManager } from '@/utils/DataPointManager';
import { useHealth } from '@/contexts/HealthContext';
import {
  createAdvancedGlowMaterial,
  createImprovedEarthMaterial,
  createAnimatedCloudMaterial,
  animateStarField,
  createAtmosphereMaterial,
  createGeospatialMaterial,
} from '@/lib/globe-helpers';

import type { HealthEnvironmentData, HealthMetric } from '@/types';
import type { RootState } from '@react-three/fiber';

interface GlobeProps {
  onPointSelect: (point: HealthEnvironmentData | null) => void;
  onLocationHover: (location: { latitude: number; longitude: number; } | null) => void;
  isInteracting: boolean;
  onZoomChange: (zoom: number) => void;
  onCameraChange: (center: { latitude: number; longitude: number; }, zoom: number) => void;
  displayMetric: HealthMetric;
  useDynamicTexture?: boolean;
  dynamicTexture?: THREE.Texture;
}

const Globe: React.FC<GlobeProps> = ({ 
  onPointSelect, 
  onLocationHover,
  isInteracting,
  onZoomChange,
  onCameraChange,
  displayMetric,
  useDynamicTexture,
  dynamicTexture 
}) => {
  const { scene, gl } = useThree();
  const globeRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const starFieldRef = useRef<THREE.Points | null>(null);
  const lastCameraPosition = useRef<THREE.Vector3>(new THREE.Vector3());
  const { healthData } = useHealth();
  const [materials, setMaterials] = useState<{
    earth: THREE.Material;
    clouds: THREE.Material;
    atmosphere: THREE.Material;
    geospatial: THREE.Material;
    glow: THREE.Material;
  } | null>(null);
  const dataPointManagerRef = useRef<DataPointManager | null>(null);

  // Initialize renderer and performance monitoring
  useEffect(() => {
    if (gl) {
      optimizationManager.setRenderer(gl);
    }
  }, [gl]);

  // Initialize DataPointManager
  useEffect(() => {
    if (scene) {
      dataPointManagerRef.current = DataPointManager.getInstance({
        maxPoints: 10000,
        chunkSize: 100,
        updateInterval: 50
      });
      dataPointManagerRef.current.initialize(scene);

      return () => {
        if (dataPointManagerRef.current) {
          dataPointManagerRef.current.dispose();
        }
      };
    }
  }, [scene]);

  // Update points when health data changes
  useEffect(() => {
    if (dataPointManagerRef.current && healthData) {
      const startTime = performance.now();
      dataPointManagerRef.current.updatePoints(
        healthData,
        displayMetric,
        new THREE.Box2(new THREE.Vector2(-180, -90), new THREE.Vector2(180, 90))
      ).then(() => {
        const duration = performance.now() - startTime;
        optimizationManager.recordPointUpdateTime(duration);
      });
    }
  }, [healthData, displayMetric]);

  // Load textures and create materials
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const loadTexture = (url: string): Promise<THREE.Texture> => {
      return new Promise((resolve, reject) => {
        const startTime = performance.now();
        loader.load(
          url,
          (texture) => {
            const duration = performance.now() - startTime;
            optimizationManager.recordTextureLoadTime(duration);
            resolve(texture);
          },
          undefined,
          reject
        );
      });
    };

    Promise.all([
      loadTexture('/textures/earth.jpg'),
      loadTexture('/textures/clouds.jpg'),
      loadTexture('/textures/night.jpg'),
      loadTexture('/textures/topology.jpg')
    ]).then(([earthTex, cloudsTex, nightTex, topologyTex]) => {
      setMaterials({
        earth: useDynamicTexture && dynamicTexture
          ? new THREE.MeshBasicMaterial({ map: dynamicTexture })
          : createImprovedEarthMaterial(earthTex, nightTex),
        clouds: createAnimatedCloudMaterial(cloudsTex),
        atmosphere: createAtmosphereMaterial(topologyTex),
        geospatial: createGeospatialMaterial(healthData, displayMetric),
        glow: createAdvancedGlowMaterial()
      });
    });
  }, [useDynamicTexture, dynamicTexture, healthData, displayMetric]);

  // Animation frame handler
  useFrame((state: RootState) => {
    const delta = state.clock.getDelta();

    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.05;
    }
    
    if (starFieldRef.current) {
      animateStarField(starFieldRef.current, delta);
    }
    
    // Update camera position if changed
    if (state.camera instanceof THREE.PerspectiveCamera) {
      const camera = state.camera;
      if (!lastCameraPosition.current.equals(camera.position)) {
        lastCameraPosition.current.copy(camera.position);
        const { lat, lon } = calculateLatLonFromCamera(camera);
        onCameraChange({ latitude: lat, longitude: lon }, camera.zoom);
      }
    }
  });

  return (
    <group>
      {materials && (
        <>
          <mesh ref={globeRef} scale={[1, 1, 1]}>
            <sphereGeometry args={[1, 64, 64]} />
            <primitive object={materials.earth} attach="material" />
          </mesh>
          <mesh ref={cloudsRef}>
            <sphereGeometry args={[1.02, 64, 64]} />
            <primitive object={materials.clouds} attach="material" />
          </mesh>
          <mesh ref={atmosphereRef}>
            <sphereGeometry args={[1.1, 64, 64]} />
            <primitive object={materials.atmosphere} attach="material" />
          </mesh>
          <mesh ref={glowRef}>
            <sphereGeometry args={[1.15, 64, 64]} />
            <primitive object={materials.glow} attach="material" />
          </mesh>
          {starFieldRef.current && <primitive object={starFieldRef.current} />}
        </>
      )}
    </group>
  );
};

function calculateLatLonFromCamera(camera: THREE.PerspectiveCamera): { lat: number; lon: number } {
  const vector = new THREE.Vector3();
  vector.setFromMatrixPosition(camera.matrixWorld);
  const spherical = new THREE.Spherical();
  spherical.setFromVector3(vector);
  const lat = 90 - (spherical.phi * 180) / Math.PI;
  const lon = ((270 + (spherical.theta * 180) / Math.PI) % 360) - 180;
  return { lat, lon };
}

export default Globe;