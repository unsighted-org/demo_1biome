import * as THREE from 'three';
import { monitoringManager } from '@/MonitoringSystem/monitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

export enum RenderingPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface PerformanceMetrics {
  fps: number;
  drawCalls: number;
  triangles: number;
  points: number;
  memoryUsage: number;
  lastUpdate: number;
}

export interface PerformanceThresholds {
  [RenderingPriority.CRITICAL]: number;
  [RenderingPriority.HIGH]: number;
  [RenderingPriority.MEDIUM]: number;
  [RenderingPriority.LOW]: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  [RenderingPriority.CRITICAL]: 30,
  [RenderingPriority.HIGH]: 45,
  [RenderingPriority.MEDIUM]: 55,
  [RenderingPriority.LOW]: 60
};

export class GlobePerformanceMonitor {
  private static instance: GlobePerformanceMonitor;
  private metrics: PerformanceMetrics;
  private thresholds: PerformanceThresholds;
  private renderer?: THREE.WebGLRenderer;
  private lastTime: number = 0;
  private frameCount: number = 0;

  private constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    this.metrics = {
      fps: 60,
      drawCalls: 0,
      triangles: 0,
      points: 0,
      memoryUsage: 0,
      lastUpdate: Date.now()
    };
  }

  static getInstance(thresholds?: Partial<PerformanceThresholds>): GlobePerformanceMonitor {
    if (!GlobePerformanceMonitor.instance) {
      GlobePerformanceMonitor.instance = new GlobePerformanceMonitor(thresholds);
    }
    return GlobePerformanceMonitor.instance;
  }

  setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
  }

  measurePerformance(scene: THREE.Scene): PerformanceMetrics {
    if (!this.renderer) {
      throw new Error('Renderer not set. Call setRenderer before measuring performance.');
    }

    const now = performance.now();
    this.frameCount++;

    // Update FPS every second
    if (now - this.lastTime >= 1000) {
      this.metrics.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = now;
    }

    const info = this.renderer.info;
    this.metrics = {
      ...this.metrics,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      points: this.countVisiblePoints(scene),
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      lastUpdate: Date.now()
    };

    this.recordMetrics();
    return { ...this.metrics };
  }

  shouldOptimize(priority: RenderingPriority): boolean {
    return this.metrics.fps < this.thresholds[priority];
  }

  getOptimizationLevel(): RenderingPriority {
    const { fps } = this.metrics;
    if (fps < this.thresholds[RenderingPriority.CRITICAL]) return RenderingPriority.CRITICAL;
    if (fps < this.thresholds[RenderingPriority.HIGH]) return RenderingPriority.HIGH;
    if (fps < this.thresholds[RenderingPriority.MEDIUM]) return RenderingPriority.MEDIUM;
    return RenderingPriority.LOW;
  }

  private countVisiblePoints(scene: THREE.Scene): number {
    let count = 0;
    scene.traverse((object) => {
      if (object instanceof THREE.Points) {
        count += (object.geometry.attributes.position?.count || 0);
      }
    });
    return count;
  }

  private recordMetrics(): void {
    const metrics = [
      { name: 'globe_fps', value: this.metrics.fps, unit: MetricUnit.COUNT },
      { name: 'globe_draw_calls', value: this.metrics.drawCalls, unit: MetricUnit.COUNT },
      { name: 'globe_triangles', value: this.metrics.triangles, unit: MetricUnit.COUNT },
      { name: 'globe_points', value: this.metrics.points, unit: MetricUnit.COUNT },
      { name: 'globe_memory', value: this.metrics.memoryUsage, unit: MetricUnit.BYTES }
    ];

    metrics.forEach(({ name, value, unit }) => {
      monitoringManager.recordMetric({
        category: MetricCategory.PERFORMANCE,
        type: MetricType.GAUGE,
        name,
        value,
        unit
      });
    });
  }
}
