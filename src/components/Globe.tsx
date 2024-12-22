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
  tileManager,
  calculateTileCoords,
  getTileUrl,
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
  const mapMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const [mapMaterial, setMapMaterial] = useState<THREE.ShaderMaterial | null>(null);
  
  const { camera, gl } = useThree();
  const { healthData } = useHealth();

  const [materials, setMaterials] = useState<{
    earth?: THREE.Material;
    clouds?: THREE.Material;
    atmosphere?: THREE.Material;
    glow?: THREE.Material;
  }>({});

  const [currentZoom, setCurrentZoom] = useState(2);
  const [tileCoords, setTileCoords] = useState(new THREE.Vector4(1, 1, 0, 0));
  const [transitionProgress, setTransitionProgress] = useState(1.0);

  useEffect(() => {
    const setupMaterials = async () => {
      try {
        const earthMaterial = createImprovedEarthMaterial();
        const cloudTexture = await new THREE.TextureLoader().load('/earth-day.jpg');
        const cloudsMaterial = await createAnimatedCloudMaterial(cloudTexture);
        const atmosphereMaterial = createAtmosphereMaterial(cloudTexture);
        const glowMaterial = createAdvancedGlowMaterial();

        if (useDynamicTexture && dynamicTexture) {
          earthMaterial.map = dynamicTexture;
          earthMaterial.needsUpdate = true;
        }

        setMaterials({
          earth: earthMaterial,
          clouds: cloudsMaterial,
          atmosphere: atmosphereMaterial,
          glow: glowMaterial
        });
      } catch (error) {
        console.error('Error setting up materials:', error);
      }
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

  useEffect(() => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        tileTextures: { value: [] },
        previousTileTextures: { value: [] },
        zoomLevel: { value: currentZoom },
        transitionProgress: { value: transitionProgress },
        tileCoords: { value: new THREE.Vector4() },
        hoverPosition: { value: new THREE.Vector2() },
        isHovering: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tileTextures[8];
        uniform sampler2D previousTileTextures[8];
        uniform float zoomLevel;
        uniform float transitionProgress;
        uniform vec4 tileCoords;
        uniform vec2 hoverPosition;
        uniform float isHovering;
        varying vec2 vUv;
        void main() {
          vec2 adjustedUv = vec2(
            mod(vUv.x * tileCoords.x + tileCoords.z, 1.0),
            mod(vUv.y * tileCoords.y + tileCoords.w, 1.0)
          );
          vec4 currentColor = texture2D(tileTextures[0], adjustedUv);
          vec4 previousColor = texture2D(previousTileTextures[0], adjustedUv);
          gl_FragColor = mix(previousColor, currentColor, transitionProgress);
        }
      `,
      transparent: true,
    });
    
    setMapMaterial(material);
    mapMaterialRef.current = material;
  }, [currentZoom, transitionProgress]);

  useEffect(() => {
    const loadInitialTiles = async () => {
      if (!mapMaterial) return;
      
      try {
        const { lat, lon } = calculateLatLonFromCamera(camera as THREE.PerspectiveCamera);
        const tileInfo = calculateTileCoords(lat, lon, currentZoom);
        
        const texture = await tileManager.loadTile(tileInfo.x, tileInfo.y, currentZoom);
        
        mapMaterial.uniforms.tileTextures.value = [texture];
        mapMaterial.uniforms.tileCoords.value.set(
          tileInfo.offsetX,
          tileInfo.offsetY,
          currentZoom,
          0
        );
      } catch (error) {
        console.error('Failed to load initial tiles:', error);
      }
    };
    
    loadInitialTiles();
  }, [camera, currentZoom, mapMaterial]);

  useEffect(() => {
    const handleZoom = async () => {
      if (!mapMaterial) return;
      
      try {
        const distance = camera.position.length();
        const newZoom = Math.max(2, Math.min(18, Math.floor(20 - Math.log2(distance))));
        
        if (newZoom !== currentZoom) {
          setTransitionProgress(0.0);
          const oldTextures = mapMaterial.uniforms.tileTextures.value;
          
          const { lat, lon } = calculateLatLonFromCamera(camera as THREE.PerspectiveCamera);
          const tileInfo = calculateTileCoords(lat, lon, newZoom);
          
          const texture = await tileManager.loadTile(tileInfo.x, tileInfo.y, newZoom);
          
          mapMaterial.uniforms.previousTileTextures.value = oldTextures;
          mapMaterial.uniforms.tileTextures.value = [texture];
          mapMaterial.uniforms.zoomLevel.value = newZoom;
          mapMaterial.uniforms.tileCoords.value.set(
            tileInfo.offsetX,
            tileInfo.offsetY,
            newZoom,
            0
          );
          
          // Animate transition
          let progress = 0;
          const animate = () => {
            progress += 0.05;
            setTransitionProgress(Math.min(1.0, progress));
            
            if (progress < 1.0) {
              requestAnimationFrame(animate);
            } else {
              tileManager.clearOldTiles(newZoom);
            }
          };
          animate();
          
          setCurrentZoom(newZoom);
          onZoomChange(newZoom);
        }
      } catch (error) {
        console.error('Failed to handle zoom:', error);
      }
    };
    
    const throttledZoom = throttle(handleZoom, 200);
    window.addEventListener('wheel', throttledZoom);
    return () => window.removeEventListener('wheel', throttledZoom);
  }, [camera, currentZoom, onZoomChange, mapMaterial]);

  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!globeRef.current || !event.intersections.length) {
      onLocationHover(null);
      return;
    }

    event.stopPropagation(); // Prevent event bubbling
    const intersection = event.intersections[0];
    const point = intersection.point;
    const { lat, lon } = calculateLatLonFromPosition(point);

    // Debug logging
    console.debug('Globe hover:', { lat, lon });

    onLocationHover({ latitude: lat, longitude: lon });
  }, [onLocationHover]);

  const handlePointerOut = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation(); // Prevent event bubbling
    onLocationHover(null);
  }, [onLocationHover]);

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.addEventListener('pointermove', handlePointerMove as any);
      globeRef.current.addEventListener('pointerout', handlePointerOut as any);
    }

    return () => {
      if (globeRef.current) {
        globeRef.current.removeEventListener('pointermove', handlePointerMove as any);
        globeRef.current.removeEventListener('pointerout', handlePointerOut as any);
      }
    };
  }, [handlePointerMove, handlePointerOut]);

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

  return (
    <group>
      {/* Earth */}
      <mesh
        ref={globeRef}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          handleGlobeClick(e);
        }}
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

      {/* Map */}
      <mesh>
        <sphereGeometry args={[1.01, 64, 64]} />
        {mapMaterial && <primitive object={mapMaterial} attach="material" />}
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