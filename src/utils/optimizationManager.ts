import { LazyLoadManager } from './lazyLoader';
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

class OptimizationManager {
  private static instance: OptimizationManager;
  private lazyLoadManager: LazyLoadManager;
  private activeStreams: Map<string, AbortController>;
  private loadingChunks: Set<string>;
  private memoryThreshold: number;

  private constructor() {
    this.lazyLoadManager = LazyLoadManager.getInstance();
    this.activeStreams = new Map();
    this.loadingChunks = new Set();
    this.memoryThreshold = 50 * 1024 * 1024; // 50MB default
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
}

export const optimizationManager = OptimizationManager.getInstance();
