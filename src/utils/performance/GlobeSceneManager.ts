import * as THREE from 'three';
import { RenderingPriority } from './GlobePerformanceMonitor';
import { DataPointManager } from '../DataPointManager';
import type { HealthEnvironmentData, HealthMetric } from '@/types';

export interface CoreGlobeFeatures {
  earth: THREE.Object3D;
  points: THREE.Object3D;
  atmosphere: THREE.Object3D;
  clouds: THREE.Object3D;
}

export interface OptimizationConfig {
  priority: RenderingPriority;
  maxPoints: number;
  chunkSize: number;
  updateInterval: number;
}

const DEFAULT_CONFIG: OptimizationConfig = {
  priority: RenderingPriority.HIGH,
  maxPoints: 10000,
  chunkSize: 100,
  updateInterval: 50
};

export class GlobeSceneManager {
  private static instance: GlobeSceneManager;
  private scene: THREE.Scene;
  private config: OptimizationConfig;
  private features: Map<keyof CoreGlobeFeatures, THREE.Object3D>;
  private dataPointManager: DataPointManager;

  private constructor(scene: THREE.Scene, initialConfig?: Partial<OptimizationConfig>) {
    this.scene = scene;
    this.config = { ...DEFAULT_CONFIG, ...initialConfig };
    this.features = new Map();
    this.dataPointManager = DataPointManager.getInstance({
      maxPoints: this.config.maxPoints,
      chunkSize: this.config.chunkSize,
      updateInterval: this.config.updateInterval
    });
    this.dataPointManager.initialize(scene);
  }

  static getInstance(scene: THREE.Scene, initialConfig?: Partial<OptimizationConfig>): GlobeSceneManager {
    if (!GlobeSceneManager.instance) {
      GlobeSceneManager.instance = new GlobeSceneManager(scene, initialConfig);
    }
    return GlobeSceneManager.instance;
  }

  enableFeature<T extends keyof CoreGlobeFeatures>(feature: T, object: THREE.Object3D): void {
    if (this.features.has(feature)) {
      this.scene.remove(this.features.get(feature)!);
    }
    this.features.set(feature, object);
    this.scene.add(object);
  }

  disableFeature(feature: keyof CoreGlobeFeatures): void {
    if (this.features.has(feature)) {
      this.scene.remove(this.features.get(feature)!);
      this.features.delete(feature);
    }
  }

  getActiveFeatures(): Set<keyof CoreGlobeFeatures> {
    return new Set(this.features.keys());
  }

  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update data point manager config
    this.dataPointManager.updateConfig({
      maxPoints: this.config.maxPoints,
      chunkSize: this.config.chunkSize,
      updateInterval: this.config.updateInterval
    });

    // Apply optimizations based on priority
    this.applyOptimizations();
  }

  async updatePoints(
    healthData: HealthEnvironmentData[],
    displayMetric: HealthMetric,
    visibleArea: THREE.Box2
  ): Promise<void> {
    await this.dataPointManager.updatePoints(healthData, displayMetric, visibleArea);
  }

  getPointData(lat: number, lon: number): HealthEnvironmentData | undefined {
    return this.dataPointManager.getPointData(lat, lon);
  }

  private applyOptimizations(): void {
    switch (this.config.priority) {
      case RenderingPriority.HIGH:
        // Enable all features
        break;
      case RenderingPriority.MEDIUM:
        // Disable some features for better performance
        this.disableFeature('clouds');
        break;
      case RenderingPriority.LOW:
        // Disable most features for maximum performance
        this.disableFeature('clouds');
        this.disableFeature('atmosphere');
        break;
    }
  }

  dispose(): void {
    this.features.forEach(object => {
      this.scene.remove(object);
    });
    this.features.clear();
    this.dataPointManager.dispose();
  }
}
