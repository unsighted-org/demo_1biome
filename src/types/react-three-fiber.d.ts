// src/types/react-three-fiber.d.ts
import type { Object3DNode} from '@react-three/fiber';
import type { OrbitControls, TransformControls } from 'three-stdlib';

declare module '@react-three/fiber' {
  interface ThreeElements {
    orbitControls: Object3DNode<OrbitControls, typeof OrbitControls>;
    transformControls: Object3DNode<TransformControls, typeof TransformControls>;
    mesh: JSX.IntrinsicElements['mesh'];
    sphereGeometry: JSX.IntrinsicElements['sphereGeometry'];
    instancedMesh: JSX.IntrinsicElements['instancedMesh'];
    group: JSX.IntrinsicElements['group'];
  }
}