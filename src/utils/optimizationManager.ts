import { LazyLoadManager } from './lazyLoader';
import * as THREE from 'three';
import { monitoringManager } from '@/MonitoringSystem/monitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

interface ChunkConfig {
  size: number;
  priority: number;
  retryAttempts: number;
  interval: number;
}

interface DataStreamConfig {
  batchSize: number;
  interval: number;
  maxRetries: number;
}

interface PerformanceConfig {
  fpsThreshold: number;
  drawCallThreshold: number;
  memoryThreshold: number;
  pointCountThreshold: number;
}

interface OptimizationLevel {
  maxPoints: number;
  chunkSize: number;
  interval: number;
  quality: 'high' | 'medium' | 'low';
}

class OptimizationManager {
  private static instance: OptimizationManager;
  private lazyLoadManager: LazyLoadManager;
  private activeStreams: Map<string, AbortController>;
  private loadingChunks: Set<string>;
  private memoryThreshold: number;
  private renderer?: THREE.WebGLRenderer;
  private currentOptimizationLevel: OptimizationLevel;

  private constructor() {
    this.lazyLoadManager = LazyLoadManager.getInstance();
    this.activeStreams = new Map();
    this.loadingChunks = new Set();
    this.memoryThreshold = 50 * 1024 * 1024; // 50MB default
    this.currentOptimizationLevel = {
      maxPoints: 10000,
      chunkSize: 100,
      interval: 50,
      quality: 'high'
    };
    this.initializeMemoryMonitoring();
  }

  static getInstance(): OptimizationManager {
    if (!OptimizationManager.instance) {
      OptimizationManager.instance = new OptimizationManager();
    }
    return OptimizationManager.instance;
  }

  private initializeMemoryMonitoring() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory && memory.usedJSHeapSize > this.memoryThreshold) {
          this.handleMemoryPressure();
        }
      }, 10000);
    }
  }

  private handleMemoryPressure() {
    // Cancel low-priority streams
    this.activeStreams.forEach((controller, key) => {
      if (key.startsWith('low_priority')) {
        controller.abort();
        this.activeStreams.delete(key);
      }
    });

    // Clear non-essential caches
    this.clearNonEssentialCache();
  }

  setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
    this.initializePerformanceMonitoring();
  }

  private initializePerformanceMonitoring(): void {
    if (typeof window !== 'undefined') {
      let lastTime = performance.now();
      let frames = 0;

      const checkPerformance = () => {
        const now = performance.now();
        frames++;

        if (now - lastTime >= 1000) {
          const fps = frames;
          const memory = (performance as any).memory?.usedJSHeapSize || 0;
          const drawCalls = this.renderer?.info.render.calls || 0;

          // Record FPS
          monitoringManager.recordMetric({
            category: MetricCategory.PERFORMANCE,
            type: MetricType.GAUGE,
            name: 'globe_fps',
            value: fps,
            unit: MetricUnit.COUNT
          });

          // Record Draw Calls
          monitoringManager.recordMetric({
            category: MetricCategory.PERFORMANCE,
            type: MetricType.GAUGE,
            name: 'globe_draw_calls',
            value: drawCalls,
            unit: MetricUnit.COUNT
          });

          // Record Memory Usage
          monitoringManager.recordMetric({
            category: MetricCategory.RESOURCE,
            type: MetricType.GAUGE,
            name: 'globe_memory_usage',
            value: memory,
            unit: MetricUnit.BYTES
          });

          frames = 0;
          lastTime = now;

          // Adjust optimization based on performance
          if (fps < 30) {
            this.adjustOptimizationLevel('down');
          } else if (fps > 45) {
            this.adjustOptimizationLevel('up');
          }
        }

        requestAnimationFrame(checkPerformance);
      };

      requestAnimationFrame(checkPerformance);
    }
  }

  private adjustOptimizationLevel(direction: 'up' | 'down') {
    const currentLevel = this.currentOptimizationLevel;

    if (direction === 'down') {
      this.currentOptimizationLevel = {
        maxPoints: Math.max(currentLevel.maxPoints * 0.8, 1000),
        chunkSize: Math.max(currentLevel.chunkSize * 0.8, 50),
        interval: Math.min(currentLevel.interval * 1.2, 100),
        quality: currentLevel.quality === 'high' ? 'medium' : 
                currentLevel.quality === 'medium' ? 'low' : 'low'
      };
    } else {
      this.currentOptimizationLevel = {
        maxPoints: Math.min(currentLevel.maxPoints * 1.2, 20000),
        chunkSize: Math.min(currentLevel.chunkSize * 1.2, 200),
        interval: Math.max(currentLevel.interval * 0.8, 30),
        quality: currentLevel.quality === 'low' ? 'medium' : 
                currentLevel.quality === 'medium' ? 'high' : 'high'
      };
    }

    this.applyOptimizationLevel();
  }

  private applyOptimizationLevel() {
    // Update all active streams with new configuration
    this.activeStreams.forEach((controller, streamId) => {
      this.updateStreamConfig(streamId, {
        batchSize: this.currentOptimizationLevel.chunkSize,
        interval: this.currentOptimizationLevel.interval,
        maxRetries: 3
      });
    });
  }

  recordPointUpdateTime(duration: number): void {
    monitoringManager.recordMetric({
      category: MetricCategory.PERFORMANCE,
      type: MetricType.HISTOGRAM,
      name: 'globe_point_update_time',
      value: duration,
      unit: MetricUnit.MILLISECONDS
    });
  }

  recordTextureLoadTime(duration: number): void {
    monitoringManager.recordMetric({
      category: MetricCategory.PERFORMANCE,
      type: MetricType.HISTOGRAM,
      name: 'globe_texture_load_time',
      value: duration,
      unit: MetricUnit.MILLISECONDS
    });
  }

  async streamData<T>(
    fetcher: (config: DataStreamConfig) => AsyncGenerator<T[], void, unknown>,
    config: DataStreamConfig,
    onChunk: (data: T[]) => void,
    streamId: string
  ): Promise<void> {
    const controller = new AbortController();
    this.activeStreams.set(streamId, controller);

    try {
      const generator = fetcher(config);
      let retryCount = 0;

      while (true) {
        try {
          const { value, done } = await generator.next();
          if (done) break;

          if (controller.signal.aborted) {
            await generator.return(undefined);
            break;
          }

          onChunk(value);
          retryCount = 0;
          
          await new Promise(resolve => setTimeout(resolve, config.interval));
        } catch (error) {
          if (retryCount >= config.maxRetries) throw error;
          retryCount++;
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, retryCount) * 1000)
          );
        }
      }
    } finally {
      this.activeStreams.delete(streamId);
    }
  }

  async loadChunk<T>(
    loader: () => Promise<T>,
    chunkId: string,
    config: ChunkConfig
  ): Promise<T> {
    if (this.loadingChunks.has(chunkId)) {
      throw new Error(`Chunk ${chunkId} is already loading`);
    }

    this.loadingChunks.add(chunkId);
    let retryCount = 0;

    try {
      while (true) {
        try {
          const startTime = performance.now();
          const result = await loader();
          const duration = performance.now() - startTime;

          monitoringManager.recordMetric({
            category: MetricCategory.PERFORMANCE,
            type: MetricType.HISTOGRAM,
            name: 'chunk_load_time',
            value: duration,
            unit: MetricUnit.MILLISECONDS,
            dimensions: { chunkId, priority: config.priority.toString() }
          });

          return result;
        } catch (error) {
          if (retryCount >= config.retryAttempts) throw error;
          retryCount++;
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, retryCount) * 1000)
          );
        }
      }
    } finally {
      this.loadingChunks.delete(chunkId);
    }
  }

  private async streamChunks<T>(
    generator: AsyncGenerator<T[], void, unknown>,
    config: ChunkConfig,
    processor: (chunk: T[]) => void,
    streamId: string
  ): Promise<void> {
    try {
      for await (const chunk of generator) {
        if (this.activeStreams.get(streamId)?.signal.aborted) {
          break;
        }

        await processor(chunk);
        await new Promise(resolve => setTimeout(resolve, config.interval));
      }
    } catch (error) {
      throw error;
    }
  }

  recordProgress(category: string, progress: number): void {
    monitoringManager.recordMetric({
      category: MetricCategory.PERFORMANCE,
      type: MetricType.GAUGE,
      name: `${category}_progress`,
      value: progress,
      unit: MetricUnit.PERCENTAGE
    });
  }

  recordMetric(name: string, value: number): void {
    monitoringManager.recordMetric({
      category: MetricCategory.PERFORMANCE,
      type: MetricType.GAUGE,
      name,
      value,
      unit: MetricUnit.COUNT
    });
  }

  private clearNonEssentialCache(): void {
    // Clear non-essential caches
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (!cacheName.includes('essential')) {
            caches.delete(cacheName);
          }
        });
      });
    }
  }

  cancelStream(streamId: string) {
    const controller = this.activeStreams.get(streamId);
    if (controller) {
      controller.abort();
      this.activeStreams.delete(streamId);
    }
  }

  setMemoryThreshold(bytes: number) {
    this.memoryThreshold = bytes;
  }

  private updateStreamConfig(streamId: string, config: DataStreamConfig) {
    // Update the stream configuration
  }
}

export const optimizationManager = OptimizationManager.getInstance();
