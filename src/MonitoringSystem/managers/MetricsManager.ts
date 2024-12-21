// src/MonitoringSystem/managers/MetricsManager.ts
import { EventEmitter } from 'events';
import { MetricType, MetricUnit, MetricCategory } from '../constants/metrics';
import { MetricComponent, MetricEntry, MetricResponse } from '../types/metrics';
import { ServiceBus } from '../core/ServiceBus';
import { CircuitBreaker } from '../utils/CircuitBreaker';
import { MetricsAggregator } from '../Metrics/MetricsAggregator';
import { MetricsPersistence } from '../Metrics/MetricsPersistence';
import { LogEntry } from '../types/logging';
import { LogLevel } from '../constants/logging';

export interface MetricFilter {
  metadata?: Record<string, unknown>;
  category?: MetricCategory;
  component?: string;
  action?: string;
  type?: MetricType;
  startTime?: Date;
  endTime?: Date;
}

export class MetricsManager {
  private maxListeners = 10;
  private metrics: Map<string, MetricEntry> = new Map();
  private static instance: MetricsManager;
  private aggregator: MetricsAggregator;
  private persistence: MetricsPersistence;
  private eventEmitter = new EventEmitter();

  private constructor(
    private circuitBreaker: CircuitBreaker,
    private serviceBus: ServiceBus
  ) {
    if (typeof process.setMaxListeners === 'function') {
      process.setMaxListeners(this.maxListeners);
    }

    this.aggregator = MetricsAggregator.getInstance(this.serviceBus);
    this.persistence = MetricsPersistence.getInstance(
      this.circuitBreaker,
      this.serviceBus
    );

    this.serviceBus.on('metric.recorded', (metric: MetricEntry) => {
      this.eventEmitter.emit('metric.recorded', metric);
    });

    this.serviceBus.on('log.processed', (logEntry: LogEntry) => {
      if (logEntry.level === LogLevel.ERROR) {
        this.recordMetric(
          MetricCategory.SYSTEM,
          'logs',
          'error_count',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          { category: logEntry.category }
        );
      }
    });
  }

  public static getInstance(
    circuitBreaker: CircuitBreaker,
    serviceBus: ServiceBus
  ): MetricsManager {
    if (!MetricsManager.instance) {
      MetricsManager.instance = new MetricsManager(circuitBreaker, serviceBus);
    }
    return MetricsManager.instance;
  }

  private generateReference(component: MetricComponent): string {
    return `${component.category}_${component.component}_${component.action}_${Date.now().toString(36)}`;
  }

  private shouldProcessMetric(metric: MetricEntry): boolean {
    if (metric.category === MetricCategory.SYSTEM && metric.metadata?.isError) {
      return true;
    }

    if (metric.category === MetricCategory.PERFORMANCE) {
      const threshold = metric.metadata?.threshold as number;
      return threshold && metric.value > threshold ? true : Math.random() < 0.1;
    }

    if (metric.category === MetricCategory.SECURITY) {
      return true;
    }

    if (metric.category === MetricCategory.SYSTEM) {
      const isImportant = metric.metadata?.important === true;
      if (isImportant) return true;

      switch (metric.type) {
        case MetricType.COUNTER:
          return Math.random() < 0.5;
        case MetricType.GAUGE:
          const previousValue = this.metrics.get(this.generateReference(metric))
            ?.value;
          return (
            !previousValue || Math.abs(metric.value - previousValue) > 0.1
          );
        case MetricType.HISTOGRAM:
          return Math.random() < 0.2;
        default:
          return Math.random() < 0.1;
      }
    }

    return Math.random() < 0.3;
  }

  public recordMetric(
    category: MetricCategory,
    component: string,
    action: string,
    value: number,
    type: MetricType = MetricType.COUNTER,
    unit: MetricUnit = MetricUnit.COUNT,
    metadata?: Record<string, unknown>
  ): MetricResponse {
    try {
      const metricComponent: MetricComponent = {
        category,
        component,
        action,
        value,
        type,
        unit,
      };

      const reference = this.generateReference(metricComponent);
      const entry: MetricEntry = {
        ...metricComponent,
        reference,
        timestamp: new Date(),
        metadata,
      };

      if (!this.shouldProcessMetric(entry)) {
        this.serviceBus.emit('metric.filtered', {
          category,
          component,
          action,
          type,
        });
        return {
          reference,
          value,
          unit,
          type,
          metadata: { ...metadata, filtered: true },
        };
      }

      this.metrics.set(reference, entry);
      this.aggregator.aggregate(entry);
      void this.persistence.persistMetric(entry);

      this.serviceBus.emit('metric.recorded', entry);

      return {
        reference,
        value,
        unit,
        type,
        metadata,
      };
    } catch (error) {
      this.serviceBus.emit('error.occurred', {
        type: 'system/metric_recording_failed',
        message: 'Failed to record metric',
        metadata: { category, component, action, value, error },
      });
      throw error;
    }
  }

  public getMetric(reference: string): MetricEntry | undefined {
    return this.metrics.get(reference);
  }

  public getAllMetrics(): MetricEntry[] {
    return Array.from(this.metrics.values());
  }

  public async getMetricsByFilter(filter: MetricFilter): Promise<MetricEntry[]> {
    try {
      const allMetrics = this.getAllMetrics();
      return allMetrics.filter((metric) => {
        if (filter.metadata) {
          for (const [key, value] of Object.entries(filter.metadata)) {
            if (metric.metadata?.[key] !== value) {
              return false;
            }
          }
        }

        if (filter.category && metric.category !== filter.category) {
          return false;
        }

        if (filter.component && metric.component !== filter.component) {
          return false;
        }

        if (filter.action && metric.action !== filter.action) {
          return false;
        }

        if (filter.type && metric.type !== filter.type) {
          return false;
        }

        if (filter.startTime && metric.timestamp < filter.startTime) {
          return false;
        }

        if (filter.endTime && metric.timestamp > filter.endTime) {
          return false;
        }

        return true;
      });
    } catch (error) {
      this.serviceBus.emit('error.occurred', {
        type: 'system/metrics_filter_failed',
        message: 'Failed to filter metrics',
        metadata: { filter, error },
      });
      throw error;
    }
  }

  public async flush(): Promise<void> {
    try {
      await this.persistence.flush();
    } catch (error) {
      this.serviceBus.emit('error.occurred', {
        type: 'system/metrics_flush_failed',
        message: 'Failed to flush metrics',
        metadata: { error },
      });
      throw error;
    }
  }

  public destroy(): void {
    try {
      this.persistence.destroy();
      this.metrics.clear();
    } catch (error) {
      this.serviceBus.emit('error.occurred', {
        type: 'system/metrics_destroy_failed',
        message: 'Failed to destroy metrics manager',
        metadata: { error },
      });
    }
  }

  public subscribe(
    event: 'metric.recorded',
    listener: (metric: MetricEntry) => void
  ): void {
    this.eventEmitter.on(event, listener);
  }

  public unsubscribe(
    event: 'metric.recorded',
    listener: (metric: MetricEntry) => void
  ): void {
    this.eventEmitter.off(event, listener);
  }
}

export { MetricCategory };
