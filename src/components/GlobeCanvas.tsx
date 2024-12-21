import { OrbitControls, Stars } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React from 'react';

interface GlobeCanvasProps {
  children: React.ReactNode;
}

const GlobeCanvas: React.FC<GlobeCanvasProps> = ({ children }) => (
  <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
    <OrbitControls enableZoom={true} enablePan={false} enableRotate={true} />
    <Stars />
    <ambientLight intensity={0.2} />
    <pointLight position={[10, 10, 10]} intensity={0.7} />
    {children}
  </Canvas>
);

export default GlobeCanvas;