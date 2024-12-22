import { useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RenderingPipeline } from '@/lib/renderingPipeline';
import { notificationService } from '@/services/CustomNotificationService';

interface ThreeContextState {
  isInitialized: boolean;
  error: Error | null;
  renderer: THREE.WebGLRenderer | null;
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
}

export function useThreeContext(renderingPipeline?: RenderingPipeline) {
  const [state, setState] = useState<ThreeContextState>({
    isInitialized: false,
    error: null,
    renderer: null,
    scene: null,
    camera: null
  });

  const handleError = useCallback((error: Error) => {
    setState(prev => ({ ...prev, error }));
    notificationService.error('3D rendering error: ' + error.message);
  }, []);

  const initializeContext = useCallback(() => {
    try {
      // Create renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });

      // Create scene
      const scene = new THREE.Scene();
      
      // Create camera
      const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 2.5;

      if (renderingPipeline) {
        renderingPipeline.setRenderer(renderer);
        renderingPipeline.setScene(scene);
        renderingPipeline.setCamera(camera);
      }

      setState({
        isInitialized: true,
        error: null,
        renderer,
        scene,
        camera
      });
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to initialize THREE.js context'));
    }
  }, [renderingPipeline, handleError]);

  const handleResize = useCallback(() => {
    if (state.camera && state.renderer) {
      const { camera, renderer } = state;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }, [state]);

  useEffect(() => {
    initializeContext();

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      
      // Cleanup THREE.js resources
      if (state.renderer) {
        state.renderer.dispose();
      }
      if (state.scene) {
        state.scene.clear();
      }
    };
  }, [initializeContext, handleResize]);

  return {
    ...state,
    reinitialize: initializeContext,
    handleError
  };
}
