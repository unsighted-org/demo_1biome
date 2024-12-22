import { MetricCategory, MetricType, MetricUnit } from './constants/metrics';

export interface MetricData {
  category: MetricCategory;
  type: MetricType;
  name: string;
  value: number;
  unit: MetricUnit;
  timestamp?: number;
  tags?: Record<string, string>;
  dimensions?: Record<string, string>;
}

class MonitoringManager {
  private static instance: MonitoringManager;
  private metrics: MetricData[];

  private constructor() {
    this.metrics = [];
  }

  static getInstance(): MonitoringManager {
    if (!MonitoringManager.instance) {
      MonitoringManager.instance = new MonitoringManager();
    }
    return MonitoringManager.instance;
  }

  recordMetric(metric: MetricData): void {
    this.metrics.push({
      ...metric,
      timestamp: metric.timestamp || Date.now()
    });
  }

  getMetrics(): MetricData[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

export const monitoringManager = MonitoringManager.getInstance();
