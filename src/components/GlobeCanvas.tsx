import { OrbitControls, Stars } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import React, { Suspense, useEffect, useState } from 'react';
import * as THREE from 'three';
import ErrorBoundary from './ErrorBoundary';

interface GlobeCanvasProps {
  children: React.ReactNode;
  onError?: (error: Error) => void;
  onLoaded?: () => void;
}

// Scene setup component that handles camera and controls initialization
const SceneSetup: React.FC = () => {
  const { camera, gl } = useThree();

  useEffect(() => {
    // Configure renderer
    gl.setPixelRatio(window.devicePixelRatio);
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1;
    gl.outputColorSpace = THREE.SRGBColorSpace;

    // Configure camera
    camera.near = 0.1;
    camera.far = 1000;
    camera.updateProjectionMatrix();

    return () => {
      // Cleanup
      gl.dispose();
    };
  }, [camera, gl]);

  return null;
};

// Loading fallback component
const LoadingFallback = () => (
  <mesh>
    <sphereGeometry args={[1, 32, 32]} />
    <meshBasicMaterial color="#123456" wireframe />
  </mesh>
);

// Error fallback component for R3F context
const R3FErrorFallback = ({ error }: { error: Error }) => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshBasicMaterial color="red" wireframe />
  </mesh>
);

const GlobeCanvas: React.FC<GlobeCanvasProps> = ({ 
  children, 
  onError,
  onLoaded 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleCreated = () => {
    setIsLoaded(true);
    onLoaded?.();
  };

  const handleError = (error: Error) => {
    console.error('R3F Error:', error);
    onError?.(error);
  };

  return (
    <ErrorBoundary>
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 45 }}
        onCreated={handleCreated}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        style={{
          background: 'transparent',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      >
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <SceneSetup />
            <OrbitControls 
              enableZoom={true} 
              enablePan={false} 
              enableRotate={true}
              minDistance={1.5}
              maxDistance={4}
              rotateSpeed={0.5}
              zoomSpeed={0.5}
            />
            <Stars 
              radius={100} 
              depth={50} 
              count={5000} 
              factor={4} 
              saturation={0} 
            />
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={0.7} />
            <pointLight position={[-10, -10, -10]} intensity={0.3} />
            {children}
          </Suspense>
        </ErrorBoundary>
      </Canvas>
    </ErrorBoundary>
  );
};

export default GlobeCanvas;