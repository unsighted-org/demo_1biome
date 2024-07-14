import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import {
  latLongToVector3,
  getColorFromScore,
  createAdvancedGlowMaterial,
  createBeamMesh,
  createImprovedEarthMaterial,
  createStarField,
  animateStarField
} from '@/lib/globe-helpers';
import type { HealthEnvironmentData } from '@/types';

interface GlobeProps {
  healthData: HealthEnvironmentData[];
  displayMetric: keyof HealthEnvironmentData;
}

const Globe: React.FC<GlobeProps> = ({ healthData, displayMetric }) => {
  const globeRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.InstancedMesh>(null);
  const beamsRef = useRef<THREE.Group>(null);
  const starsRef = useRef<THREE.Group>(null);  // Changed from THREE.Points to THREE.Group

  const earthTexture = useLoader(TextureLoader, '/earth-dark.jpg');
  const cloudTexture = useLoader(TextureLoader, '/earth-topology.png');

  const globeMaterial = useMemo(() => createImprovedEarthMaterial(earthTexture, cloudTexture), [earthTexture, cloudTexture]);
  const glowMaterial = useMemo(() => createAdvancedGlowMaterial(), []);
  const atmosphere = useMemo(() => new THREE.Mesh(new THREE.SphereGeometry(1.02, 64, 64), glowMaterial), [glowMaterial]);

  const starField = useMemo(() => createStarField(1000, 5), []);

  useEffect(() => {
    if (starsRef.current) {
      starsRef.current.add(starField);
    }
  }, [starField]);

  const pointsGeometry = useMemo(() => new THREE.SphereGeometry(0.005, 16, 16), []);
  const pointsMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xffffff }), []);

  useEffect(() => {
    if (pointsRef.current && beamsRef.current) {
      pointsRef.current.count = healthData.length;
      beamsRef.current.clear();

      healthData.forEach((data, index) => {
        const position = latLongToVector3(Number(data.latitude), Number(data.longitude), 1);
        const color = getColorFromScore(data[displayMetric] as number);

        pointsRef.current?.setMatrixAt(
          index,
          new THREE.Matrix4().setPosition(position)
        );
        pointsRef.current?.setColorAt(index, color);

        const beam = createBeamMesh(color, 0.3);
        beam.position.copy(position);
        beam.lookAt(0, 0, 0);
        beamsRef.current?.add(beam);
      });

      pointsRef.current.instanceMatrix.needsUpdate = true;
      if (pointsRef.current.instanceColor) pointsRef.current.instanceColor.needsUpdate = true;
    }
  }, [healthData, displayMetric]);

  useFrame((state) => {
    const { clock } = state;
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.001;
    }
    if (glowMaterial instanceof THREE.ShaderMaterial) {
      glowMaterial.uniforms.time.value = clock.getElapsedTime();
    }
    if (globeMaterial instanceof THREE.ShaderMaterial) {
      globeMaterial.uniforms.time.value = clock.getElapsedTime();
    }
    animateStarField(starField, clock.getElapsedTime());
  });

  return (
    <>
      <mesh ref={globeRef} material={globeMaterial}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>
      <primitive object={atmosphere} />
      <instancedMesh ref={pointsRef} args={[pointsGeometry, pointsMaterial, healthData.length]} />
      <group ref={beamsRef} />
      <group ref={starsRef} />
    </>
  );
};

export default React.memo(Globe);
