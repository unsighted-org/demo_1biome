import { useFrame, useThree } from '@react-three/fiber';
import { throttle } from 'lodash';
import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import * as THREE from 'three';

import {
  createAdvancedGlowMaterial,
  createImprovedEarthMaterial,
  createAnimatedCloudMaterial,
  animateStarField,
  createAtmosphereMaterial,
  createGeospatialMaterial,
} from '@/lib/globe-helpers';
import { useGlobeOptimization } from '@/hooks/useGlobeOptimization';
import { optimizationManager } from '@/utils/optimizationManager';

import type { HealthEnvironmentData, HealthMetric } from '@/types';

interface GlobeProps {
  healthData: HealthEnvironmentData[];
  displayMetric: HealthMetric;
  onLocationHover: (location: { latitude: number; longitude: number; } | null) => void;
  isInteracting: boolean;
  onZoomChange: (zoom: number) => void;
  onCameraChange: (center: { latitude: number; longitude: number }, zoom: number) => void;
  useDynamicTexture: boolean;
  dynamicTexture: THREE.Texture | null | undefined;
}

const POSITION_DELTA_THRESHOLD = 0.001;
const ZOOM_FACTOR = 5.5;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;

const Globe: React.FC<GlobeProps> = async ({
  healthData, 
  displayMetric, 
  onLocationHover, 
  isInteracting, 
  onZoomChange,
  onCameraChange,
  useDynamicTexture,
  dynamicTexture
}) => {
  const { scene } = useThree();
  const globeRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const starFieldRef = useRef<THREE.Points | null>(null);
  const lastCameraPosition = useRef<THREE.Vector3>(new THREE.Vector3());
  const [visibleArea, setVisibleArea] = useState<THREE.Box2 | null>(null);

  // Optimized texture loading with error handling and progress tracking
  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const loadTexture = async (url: string): Promise<THREE.Texture> => {
      return new Promise((resolve, reject) => {
        loader.load(
          url,
          resolve,
          (event) => {
            const progress = event.loaded / event.total;
            optimizationManager.recordProgress('texture_loading', progress);
          },
          reject
        );
      });
    };

    return {
      earth: loadTexture('/earth-dark.jpg'),
      clouds: loadTexture('/clouds.png'),
      night: loadTexture('/earth-night.jpg'),
      topology: loadTexture('/earth-topology.png')
    };
  }, []);

  // Use the optimization hook for data points
  const { loading: pointsLoading, error: pointsError, getPointData, clear: clearPoints } = useGlobeOptimization(
    scene,
    healthData,
    displayMetric,
    visibleArea,
    {
      maxPoints: 10000,
      chunkSize: 100,
      updateInterval: 50,
      onPointsUpdate: (count) => {
        optimizationManager.recordMetric('visible_points', count);
      }
    }
  );

  // Memoized materials with proper cleanup
  const materials = useMemo(async () => {
    const [earthTex, cloudsTex, nightTex, topologyTex] = await Promise.all([
      textures.earth,
      textures.clouds,
      textures.night,
      textures.topology
    ]);

    return {
      earth: useDynamicTexture && dynamicTexture
        ? new THREE.MeshBasicMaterial({ map: dynamicTexture })
        : createImprovedEarthMaterial(earthTex, nightTex),
      clouds: createAnimatedCloudMaterial(cloudsTex),
      atmosphere: createAtmosphereMaterial(topologyTex),
      geospatial: createGeospatialMaterial(healthData, displayMetric),
      glow: createAdvancedGlowMaterial()
    };
  }, [textures, useDynamicTexture, dynamicTexture, healthData, displayMetric]);

  const throttledCameraChange = useCallback(
    throttle((center: { latitude: number; longitude: number }, zoom: number) => {
      onCameraChange(center, zoom);
    }, 100),
    [onCameraChange]
  );

  const handleGlobeHover = useCallback((intersects: THREE.Intersection[]) => {
    if (!isInteracting || intersects.length === 0) {
      onLocationHover(null);
      return;
    }

    const { point } = intersects[0];
    const latLon = cartesianToLatLon(point);
    const pointData = getPointData(latLon.latitude, latLon.longitude);

    if (pointData) {
      onLocationHover(latLon);
    }
  }, [isInteracting, onLocationHover, getPointData]);

  useFrame((state, delta) => {
    if (!globeRef.current) return;

    // Optimized material updates
    if (cloudsRef.current?.material instanceof THREE.ShaderMaterial) {
      const cloudUniforms = cloudsRef.current.material.uniforms;
      if (cloudUniforms?.time) {
        cloudUniforms.time.value += delta;
      }
    }

    if (atmosphereRef.current?.material instanceof THREE.ShaderMaterial) {
      const atmosphereUniforms = atmosphereRef.current.material.uniforms;
      if (atmosphereUniforms?.time) {
        atmosphereUniforms.time.value += delta;
      }
    }

    if (starFieldRef.current) {
      animateStarField(starFieldRef.current, delta);
    }

    // Rotate only when not using dynamic texture
    if (!useDynamicTexture) {
      globeRef.current.rotation.y += 0.001;
    }

    // Optimized camera updates
    const cameraPosition = state.camera.position;
    if (cameraPosition.distanceTo(lastCameraPosition.current) > POSITION_DELTA_THRESHOLD) {
      lastCameraPosition.current.copy(cameraPosition);

      const distance = cameraPosition.length();
      onZoomChange(distance);

      // Calculate visible area for optimization
      const frustum = new THREE.Frustum();
      frustum.setFromProjectionMatrix(
        new THREE.Matrix4().multiplyMatrices(
          state.camera.projectionMatrix,
          state.camera.matrixWorldInverse
        )
      );

      const box = new THREE.Box2();
      const sphere = new THREE.Sphere(new THREE.Vector3(), 1);
      frustum.intersectsSphere(sphere);
      setVisibleArea(box);

      // Update camera target
      const cameraDirection = new THREE.Vector3();
      state.camera.getWorldDirection(cameraDirection);
      const raycaster = new THREE.Raycaster(cameraPosition, cameraDirection);
      const intersects = raycaster.intersectObject(globeRef.current);
      
      if (intersects.length > 0) {
        const intersectionPoint = intersects[0].point;
        const latLon = cartesianToLatLon(intersectionPoint);
        const zoom = calculateZoomLevel(distance);
        throttledCameraChange(latLon, zoom);
      }
    }
  });

  // Cleanup
  useEffect(() => {
    return () => {
      clearPoints();
      materials.then(mats => {
        Object.values(mats).forEach(material => {
          if (material instanceof THREE.Material) {
            material.dispose();
          }
        });
      });
      Object.values(textures).forEach(texturePromise => {
        texturePromise.then(texture => texture.dispose());
      });
    };
  }, [materials, textures, clearPoints]);

  if (pointsError) {
    console.error('Error loading data points:', pointsError);
  }

  const mats = await materials;

  return (
    <group>
      <mesh 
        ref={globeRef}
        onPointerMove={(event) => handleGlobeHover(event.intersections)}
      >
        <sphereGeometry args={[1, 64, 64]} />
        <primitive object={mats.earth} attach="material" />
      </mesh>
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.02, 64, 64]} />
        <primitive object={mats.clouds} attach="material" />
      </mesh>
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[1.1, 64, 64]} />
        <primitive object={mats.atmosphere} attach="material" />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.15, 64, 64]} />
        <primitive object={mats.glow} attach="material" />
      </mesh>
      {starFieldRef.current && <primitive object={starFieldRef.current} />}
      {pointsLoading && <pointLight position={[0, 0, 0]} intensity={0.5} />}
    </group>
  );
};

function cartesianToLatLon(position: THREE.Vector3): { latitude: number; longitude: number } {
  const latitude = 90 - (Math.acos(position.y) * 180) / Math.PI;
  const longitude = ((270 + (Math.atan2(position.x, position.z) * 180) / Math.PI) % 360) - 180;
  return { latitude, longitude };
}

function calculateZoomLevel(distance: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, ZOOM_FACTOR / distance));
}

export default Globe;