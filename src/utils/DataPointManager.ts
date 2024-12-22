import * as THREE from 'three';
import { optimizationManager } from './optimizationManager';
import { HealthEnvironmentData, HealthMetric } from '@/types';

interface DataPointOptions {
  maxPoints: number;
  chunkSize: number;
  updateInterval: number;
}

export class DataPointManager {
  private static instance: DataPointManager;
  private instancedMesh: THREE.InstancedMesh | null = null;
  private pointsGeometry: THREE.BufferGeometry;
  private pointsMaterial: THREE.MeshBasicMaterial;
  private dataCache: Map<string, HealthEnvironmentData>;
  private visiblePoints: Set<string>;
  private options: DataPointOptions;
  private updateQueued: boolean = false;

  private constructor(options: DataPointOptions) {
    this.options = options;
    this.dataCache = new Map();
    this.visiblePoints = new Set();
    this.pointsGeometry = new THREE.SphereGeometry(0.02, 16, 16);
    this.pointsMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  }

  static getInstance(options: DataPointOptions): DataPointManager {
    if (!DataPointManager.instance) {
      DataPointManager.instance = new DataPointManager(options);
    }
    return DataPointManager.instance;
  }

  initialize(scene: THREE.Scene): void {
    if (this.instancedMesh) {
      scene.remove(this.instancedMesh);
    }

    this.instancedMesh = new THREE.InstancedMesh(
      this.pointsGeometry,
      this.pointsMaterial,
      this.options.maxPoints
    );
    this.instancedMesh.count = 0;
    scene.add(this.instancedMesh);
  }

  async updatePoints(
    healthData: HealthEnvironmentData[] | undefined,
    displayMetric: HealthMetric,
    visibleArea: THREE.Box2
  ): Promise<void> {
    if (this.updateQueued) return;
    this.updateQueued = true;

    try {
      // Clear existing points if no health data
      if (!healthData || healthData.length === 0) {
        this.clear();
        return;
      }

      const streamId = Math.random().toString(36).substring(7);

      const boundUpdatePoints = async function*(this: DataPointManager) {
        const chunks: HealthEnvironmentData[][] = [];
        for (let i = 0; i < healthData.length; i += this.options.chunkSize) {
          chunks.push(healthData.slice(i, i + this.options.chunkSize));
        }

        for (const chunk of chunks) {
          const visiblePoints = chunk.filter(point => {
            const lat = point.latitude || 0;
            const lon = point.longitude || 0;
            return visibleArea.containsPoint(new THREE.Vector2(lon, lat));
          });

          yield visiblePoints;
        }
      }.bind(this);

      await optimizationManager.streamData(
        boundUpdatePoints,
        {
          batchSize: this.options.chunkSize,
          interval: this.options.updateInterval,
          maxRetries: 3
        },
        (points) => {
          this.updateChunk(points, displayMetric);
        },
        streamId
      );
    } finally {
      this.updateQueued = false;
    }
  }

  private updateChunk(points: HealthEnvironmentData[], displayMetric: HealthMetric): void {
    if (!this.instancedMesh) return;

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();

    points.forEach((point, index) => {
      const key = `${point.latitude},${point.longitude}`;
      if (!this.visiblePoints.has(key)) {
        const position = this.latLonToPosition(point.latitude || 0, point.longitude || 0);
        matrix.setPosition(position);
        this.instancedMesh!.setMatrixAt(this.instancedMesh!.count++, matrix);

        const value = point[displayMetric] as number;
        color.setHSL(Math.max(0, Math.min(1, value / 100)), 1, 0.5);
        this.instancedMesh!.setColorAt(this.instancedMesh!.count - 1, color);

        this.visiblePoints.add(key);
        this.dataCache.set(key, point);
      }
    });

    if (this.instancedMesh.count > 0) {
      this.instancedMesh.instanceMatrix.needsUpdate = true;
      if (this.instancedMesh.instanceColor) {
        this.instancedMesh.instanceColor.needsUpdate = true;
      }
    }
  }

  private latLonToPosition(lat: number, lon: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(Math.sin(phi) * Math.cos(theta));
    const z = Math.sin(phi) * Math.sin(theta);
    const y = Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  }

  getPointData(lat: number, lon: number): HealthEnvironmentData | undefined {
    return this.dataCache.get(`${lat},${lon}`);
  }

  clear(): void {
    if (this.instancedMesh) {
      this.instancedMesh.count = 0;
      this.instancedMesh.instanceMatrix.needsUpdate = true;
      if (this.instancedMesh.instanceColor) {
        this.instancedMesh.instanceColor.needsUpdate = true;
      }
    }
    this.visiblePoints.clear();
  }

  dispose(): void {
    this.pointsGeometry.dispose();
    if (Array.isArray(this.pointsMaterial)) {
      this.pointsMaterial.forEach(mat => mat.dispose());
    } else {
      this.pointsMaterial.dispose();
    }
    if (this.instancedMesh) {
      if (Array.isArray(this.instancedMesh.material)) {
        this.instancedMesh.material.forEach(mat => mat.dispose());
      } else {
        this.instancedMesh.material.dispose();
      }
      this.instancedMesh.geometry.dispose();
    }
  }

  getVisiblePointCount(): number {
    return this.visiblePoints.size;
  }

  updateConfig(newOptions: Partial<DataPointOptions>): void {
    this.options = { ...this.options, ...newOptions };
    // Trigger a re-render if needed
    if (this.instancedMesh) {
      this.updateQueued = true;
    }
  }

  // Public getter for instancedMesh
  public getInstancedMesh(): THREE.InstancedMesh | null {
    return this.instancedMesh;
  }
}
