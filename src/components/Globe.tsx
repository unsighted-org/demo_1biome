import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber';
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
  useDynamicTexture = false,
  dynamicTexture
}) => {
  const globeRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const starFieldRef = useRef<THREE.Points | null>(null);
  const lastCameraPosition = useRef<THREE.Vector3>(new THREE.Vector3());
  
  const { camera, gl } = useThree();
  const { healthData } = useHealth();

  const [materials, setMaterials] = useState<{
    earth?: THREE.Material;
    clouds?: THREE.Material;
    atmosphere?: THREE.Material;
    glow?: THREE.Material;
  }>({});

  useEffect(() => {
    const setupMaterials = async () => {
      const cloudTexture = new THREE.TextureLoader().load('/clouds.png');
      const earthMaterial = await createImprovedEarthMaterial(useDynamicTexture && dynamicTexture ? dynamicTexture : cloudTexture, cloudTexture);
      const cloudsMaterial = await createAnimatedCloudMaterial(cloudTexture);
      const atmosphereMaterial = createAtmosphereMaterial(cloudTexture);
      const glowMaterial = createAdvancedGlowMaterial();

      setMaterials({
        earth: earthMaterial,
        clouds: cloudsMaterial,
        atmosphere: atmosphereMaterial,
        glow: glowMaterial
      });
    };

    setupMaterials();
  }, [useDynamicTexture, dynamicTexture]);

  const dataPointManager = useMemo(() => {
    return DataPointManager.getInstance({ 
      maxPoints: 1000,
      chunkSize: 100,
      updateInterval: 50
    });
  }, []);

  useEffect(() => {
    const visibleArea = new THREE.Box2(
      new THREE.Vector2(-1, -1),
      new THREE.Vector2(1, 1)
    );
    dataPointManager.updatePoints(healthData, displayMetric, visibleArea);
  }, [healthData, displayMetric, dataPointManager]);

  useFrame((state, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.05;
    }

    if (starFieldRef.current) {
      animateStarField(starFieldRef.current, delta);
    }

    if (camera.position.distanceTo(lastCameraPosition.current) > 0.1) {
      const { lat, lon } = calculateLatLonFromCamera(camera as THREE.PerspectiveCamera);
      onCameraChange({ latitude: lat, longitude: lon }, camera.position.length());
      lastCameraPosition.current.copy(camera.position);
    }
  });

  const handleGlobeClick = useCallback((event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      const intersection = event.intersections[0];
      if (intersection) {
        const { lat, lon } = calculateLatLonFromPosition(intersection.point);
        const point = dataPointManager.getPointData(lat, lon);
        onPointSelect(point || null);
      } else {
        onPointSelect(null);
      }
    }, [dataPointManager, onPointSelect]);

  const handleGlobeHover = throttle((event: THREE.Intersection | null) => {
    if (!event) {
      onLocationHover(null);
      return;
    }

    const { lat, lon } = calculateLatLonFromPosition(event.point);
    onLocationHover({ latitude: lat, longitude: lon });
  }, 100);

  return (
    <group>
      {/* Earth */}
      <mesh
      ref={globeRef}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => handleGlobeHover(e.intersections[0] || null)}
      onPointerOut={() => handleGlobeHover(null)}
      onClick={(e: ThreeEvent<MouseEvent>) => handleGlobeClick(e)}
      >
      <sphereGeometry args={[1, 64, 64]} />
      {materials.earth && <primitive object={materials.earth} attach="material" />}
      </mesh>

      {/* Clouds */}
      <mesh ref={cloudsRef} scale={1.003}>
      <sphereGeometry args={[1, 32, 32]} />
      {materials.clouds && <primitive object={materials.clouds} attach="material" />}
      </mesh>

      {/* Atmosphere */}
      <mesh ref={atmosphereRef} scale={1.05}>
      <sphereGeometry args={[1, 32, 32]} />
      {materials.atmosphere && <primitive object={materials.atmosphere} attach="material" />}
      </mesh>

      {/* Glow */}
      <mesh ref={glowRef} scale={1.1}>
      <sphereGeometry args={[1, 32, 32]} />
      {materials.glow && <primitive object={materials.glow} attach="material" />}
      </mesh>

      {/* Data Points */}
      {dataPointManager.getInstancedMesh() && (
        <primitive 
          object={dataPointManager.getInstancedMesh()!} 
          onClick={(event: ThreeEvent<MouseEvent>) => {
            const instanceId = event.instanceId;
            if (instanceId !== undefined) {
              const mesh = dataPointManager.getInstancedMesh();
              const point = dataPointManager.getPointData(
                mesh!.geometry.attributes.position.getY(instanceId),
                mesh!.geometry.attributes.position.getZ(instanceId)
              );
              if (point) {
                onPointSelect(point);
              }
            }
          }}
        />
      )}
    </group>
  );
};

function calculateLatLonFromPosition(position: THREE.Vector3): { lat: number; lon: number } {
  const lat = Math.asin(position.y);
  const lon = Math.atan2(position.x, position.z);
  return {
    lat: (lat * 180) / Math.PI,
    lon: (lon * 180) / Math.PI
  };
}

function calculateLatLonFromCamera(camera: THREE.PerspectiveCamera): { lat: number; lon: number } {
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  return calculateLatLonFromPosition(direction);
}

export default Globe;