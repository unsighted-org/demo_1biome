import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GlobePerformanceMonitor, RenderingPriority } from '@/utils/performance/GlobePerformanceMonitor';
import { GlobeSceneManager, OptimizationConfig, CoreGlobeFeatures } from '@/utils/performance/GlobeSceneManager';

interface UseGlobeOptimizationsProps {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  initialConfig?: Partial<OptimizationConfig>;
}

interface OptimizationState {
  isOptimizing: boolean;
  currentPriority: RenderingPriority;
  enabledFeatures: Set<keyof CoreGlobeFeatures>;
  metrics: {
    fps: number;
    drawCalls: number;
    points: number;
  };
}

export function useGlobeOptimizations({
  scene,
  renderer,
  initialConfig
}: UseGlobeOptimizationsProps) {
  const performanceMonitor = useRef(GlobePerformanceMonitor.getInstance());
  const sceneManager = useRef(GlobeSceneManager.getInstance(scene, initialConfig));
  const [state, setState] = useState<OptimizationState>({
    isOptimizing: false,
    currentPriority: RenderingPriority.HIGH,
    enabledFeatures: new Set(['earth', 'points']),
    metrics: {
      fps: 60,
      drawCalls: 0,
      points: 0
    }
  });

  useEffect(() => {
    performanceMonitor.current.setRenderer(renderer);

    const intervalId = setInterval(() => {
      const metrics = performanceMonitor.current.measurePerformance(scene);
      const priority = performanceMonitor.current.getOptimizationLevel();
      const enabledFeatures = sceneManager.current.getActiveFeatures();

      setState(prev => ({
        ...prev,
        currentPriority: priority,
        enabledFeatures,
        metrics: {
          fps: metrics.fps,
          drawCalls: metrics.drawCalls,
          points: metrics.points
        }
      }));
    }, 1000);

    return () => {
      clearInterval(intervalId);
      sceneManager.current.dispose();
    };
  }, [scene, renderer]);

  const enableFeature = useCallback(<T extends keyof CoreGlobeFeatures>(
    feature: T,
    object: THREE.Object3D
  ) => {
    sceneManager.current.enableFeature(feature, object);
  }, []);

  const disableFeature = useCallback((feature: keyof CoreGlobeFeatures) => {
    sceneManager.current.disableFeature(feature);
  }, []);

  const updateConfig = useCallback((newConfig: Partial<OptimizationConfig>) => {
    sceneManager.current.updateConfig(newConfig);
  }, []);

  const optimizeScene = useCallback(() => {
    setState(prev => ({ ...prev, isOptimizing: true }));
    
    // Apply optimizations based on current performance
    const priority = performanceMonitor.current.getOptimizationLevel();
    sceneManager.current.updateConfig({ priority });
    
    setState(prev => ({ ...prev, isOptimizing: false }));
  }, []);

  return {
    state,
    enableFeature,
    disableFeature,
    updateConfig,
    optimizeScene
  };
}
