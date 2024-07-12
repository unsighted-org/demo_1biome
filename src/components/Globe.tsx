import { useFrame, useLoader, useThree } from '@react-three/fiber';
import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

import { latLongToVector3, getColorFromScore, createGlowMaterial, createLightBeam, createCustomEarthMaterial } from '@/lib/globe-helpers';
import HealthService from '@/services/HealthService';

import type { HealthEnvironmentData } from '@/types';

interface GlobeProps {
  healthData: HealthEnvironmentData[];
  displayMetric: keyof HealthEnvironmentData;
}

const Globe: React.FC<GlobeProps> = ({ healthData, displayMetric }) => {
  const globeRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.InstancedMesh>(null);
  const beamsRef = useRef<THREE.Group>(null);
  const [pointsProcessed, setPointsProcessed] = useState(0);
  const { camera } = useThree();

  const earthTexture = useLoader(THREE.TextureLoader, '/earth-topology.png');
  const globeMaterial = useMemo(() => createCustomEarthMaterial(earthTexture), [earthTexture]);
  const glowMaterial = useMemo(() => createGlowMaterial(), []);
  const atmosphere = useMemo(() => new THREE.Mesh(new THREE.SphereGeometry(1.02, 64, 64), glowMaterial), [glowMaterial]);

  const lodLevels = useMemo(() => [
    { distance: 1.5, size: 0.005, maxPoints: 5000 },
    { distance: 2.5, size: 0.003, maxPoints: 2000 },
    { distance: 3.5, size: 0.002, maxPoints: 1000 },
  ], []);

  const processedData = useMemo(() => {
    return healthData.map(data => ({
      position: latLongToVector3(Number(data.latitude), Number(data.longitude), 1),
      color: getColorFromScore(data[displayMetric] as number)
    }));
  }, [healthData, displayMetric]);

  const frustum = useMemo(() => new THREE.Frustum(), []);
  const projScreenMatrix = useMemo(() => new THREE.Matrix4(), []);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    const setupSubscription = async (): Promise<void> => {
      try {
        unsubscribe = await HealthService.subscribeToHealthData(
          (newData) => {
            console.log('Received new health data:', newData);
          },
          (err) => {
            console.error('WebSocket error:', err);
          }
        );
      } catch (error) {
        console.error('Failed to set up health data subscription:', error);
      }
    };
    setupSubscription();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const updateLightBeams = useCallback((position: THREE.Vector3, color: THREE.Color) => {
    const beam = createLightBeam(position, color);
    beamsRef.current?.add(beam);
  }, []);

  const updateFrame = useCallback(() => {
    const points = pointsRef.current;
    const beams = beamsRef.current;

    if (points && beams) {
      projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(projScreenMatrix);

      const cameraDistance = camera.position.length();
      const lodLevel = lodLevels.find(level => cameraDistance <= level.distance) || lodLevels[lodLevels.length - 1];

      const maxPointsPerFrame = 100;
      const startIndex = pointsProcessed;
      const endIndex = Math.min(startIndex + maxPointsPerFrame, Math.min(processedData.length, lodLevel.maxPoints));

      points.geometry.scale(lodLevel.size, lodLevel.size, lodLevel.size);

      for (let i = startIndex; i < endIndex; i++) {
        const { position, color } = processedData[i];

        if (frustum.containsPoint(position)) {
          const quaternion = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            position.normalize()
          );

          points.setMatrixAt(
            i,
            new THREE.Matrix4().compose(
              position,
              quaternion,
              new THREE.Vector3(1, 1, 1)
            )
          );
          points.setColorAt(i, color);

          updateLightBeams(position, color);
        }
      }

      points.instanceMatrix.needsUpdate = true;
      if (points.instanceColor) {
        points.instanceColor.needsUpdate = true;
      }

      setPointsProcessed(endIndex);
    }

    if (globeRef.current) {
      globeRef.current.rotation.y += 0.001;
    }
  }, [camera, frustum, lodLevels, pointsProcessed, processedData, projScreenMatrix, updateLightBeams]);

  useFrame(updateFrame);

  return (
    <>
      <mesh ref={globeRef} material={globeMaterial}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>
      <primitive object={atmosphere} />
      <instancedMesh
        ref={pointsRef}
        args={[new THREE.SphereGeometry(1, 16, 16), new THREE.MeshBasicMaterial(), healthData.length]}
      />
      <group ref={beamsRef} />
    </>
  );
};

export default React.memo(Globe);
