import { optimizationManager } from './optimizationManager';
import { HealthEnvironmentData, HealthMetric } from '@/types';

interface ChartDataOptions {
  windowSize: number;
  maxPoints: number;
  aggregationInterval: number; // in milliseconds
}

export class ChartDataManager {
  private static instance: ChartDataManager;
  private dataCache: Map<string, HealthEnvironmentData[]>;
  private aggregatedData: Map<string, HealthEnvironmentData[]>;
  private options: ChartDataOptions;

  private constructor(options: ChartDataOptions) {
    this.options = options;
    this.dataCache = new Map();
    this.aggregatedData = new Map();
  }

  static getInstance(options: ChartDataOptions): ChartDataManager {
    if (!ChartDataManager.instance) {
      ChartDataManager.instance = new ChartDataManager(options);
    }
    return ChartDataManager.instance;
  }

  private getCacheKey(metrics: HealthMetric[], startDate?: Date, endDate?: Date): string {
    return `${metrics.sort().join(',')}_${startDate?.toISOString() || ''}_${endDate?.toISOString() || ''}`;
  }

  private aggregateData(data: HealthEnvironmentData[]): HealthEnvironmentData[] {
    if (data.length <= this.options.maxPoints) return data;

    const interval = Math.ceil(data.length / this.options.maxPoints);
    const aggregated: HealthEnvironmentData[] = [];

    for (let i = 0; i < data.length; i += interval) {
      const chunk = data.slice(i, i + interval);
      const basePoint = { ...chunk[0] };
      const aggregatedPoint = chunk.reduce<HealthEnvironmentData>((acc, point) => {
        Object.entries(point).forEach(([key, value]) => {
          if (typeof value === 'number' && typeof acc[key as keyof HealthEnvironmentData] === 'number') {
            (acc[key as keyof HealthEnvironmentData] as number) += value / chunk.length;
          }
        });
        return acc;
      }, basePoint);

      aggregated.push(aggregatedPoint);
    }

    return aggregated;
  }

  async getChartData(
    data: HealthEnvironmentData[],
    metrics: HealthMetric[],
    startDate?: Date,
    endDate?: Date,
    onProgress?: (progress: number) => void
  ): Promise<HealthEnvironmentData[]> {
    const cacheKey = this.getCacheKey(metrics, startDate, endDate);
    
    if (this.aggregatedData.has(cacheKey)) {
      return this.aggregatedData.get(cacheKey)!;
    }

    const boundStreamData = async function*(this: ChartDataManager) {
      const filteredData = data.filter(point => {
        if (!startDate || !endDate) return true;
        const timestamp = new Date(point.timestamp);
        return timestamp >= startDate && timestamp <= endDate;
      });

      const chunks: HealthEnvironmentData[][] = [];
      for (let i = 0; i < filteredData.length; i += this.options.windowSize) {
        chunks.push(filteredData.slice(i, i + this.options.windowSize));
      }

      for (const chunk of chunks) {
        yield chunk;
      }
    }.bind(this);

    return new Promise((resolve, reject) => {
      let processedData: HealthEnvironmentData[] = [];
      let totalProcessed = 0;

      const streamId = `chart_data_${Date.now()}`;
      
      optimizationManager.streamData(
        boundStreamData,
        {
          batchSize: this.options.windowSize,
          interval: this.options.aggregationInterval,
          maxRetries: 3
        },
        (chunk) => {
          processedData = [...processedData, ...chunk];
          totalProcessed += chunk.length;
          if (onProgress) {
            onProgress(totalProcessed / data.length);
          }
        },
        streamId
      ).then(() => {
        const aggregatedData = this.aggregateData(processedData);
        this.aggregatedData.set(cacheKey, aggregatedData);
        resolve(aggregatedData);
      }).catch(reject);
    });
  }

  clearCache(): void {
    this.dataCache.clear();
    this.aggregatedData.clear();
  }

  updateOptions(options: Partial<ChartDataOptions>): void {
    this.options = { ...this.options, ...options };
    this.clearCache(); // Clear cache when options change
  }
}
