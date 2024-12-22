import { HealthEnvironmentData } from '@/types';
import { AppleHealthAdapter, OuraRingAdapter, HealthDataMerger } from '@/adapters/healthDataAdapter';
import { healthIntegrationService } from './healthIntegrations';
import { API_BASE_URL, getCurrentBaseUrl } from '@/constants';
import io, { Socket } from 'socket.io-client';

interface PaginatedHealthData {
  data: HealthEnvironmentData[];
  currentPage: number;
  totalPages: number;
}

class HealthService {
  private static instance: HealthService;
  private socket: Socket | null = null;
  private token: string | null = null;
  private appleHealthAdapter: AppleHealthAdapter;
  private ouraAdapter: OuraRingAdapter;
  private cachedHealthData: Map<number, { data: HealthEnvironmentData[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private requestCount: number = 0;
  private subscribers: Set<(data: HealthEnvironmentData) => void> = new Set();

  private constructor() {
    this.appleHealthAdapter = new AppleHealthAdapter();
    this.ouraAdapter = new OuraRingAdapter();
  }

  static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  setToken(token: string): void {
    this.token = token;
    this.initializeSocket();
  }

  private initializeSocket(): void {
    if (!this.token) return;

    this.socket = io(getCurrentBaseUrl(), {
      auth: { token: this.token }
    });

    this.socket.on('healthUpdate', (data: HealthEnvironmentData) => {
      this.notifySubscribers(data);
    });
  }

  subscribe(callback: (data: HealthEnvironmentData) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(data: HealthEnvironmentData): void {
    this.subscribers.forEach(callback => callback(data));
  }

  async getPaginatedHealthData(page: number): Promise<PaginatedHealthData> {
    if (!this.token) {
      throw new Error('Authentication token not set');
    }

    const cached = this.cachedHealthData.get(page);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return {
        data: cached.data,
        currentPage: page,
        totalPages: Math.ceil(cached.data.length / 10)
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/health/data?page=${page}`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch health data');
      }

      const data = await response.json();
      this.cachedHealthData.set(page, { data: data.data, timestamp: Date.now() });
      
      return data;
    } catch (error) {
      console.error('Error fetching paginated health data:', error);
      throw error;
    }
  }

  async refreshHealthData(): Promise<void> {
    if (!this.token) {
      throw new Error('Authentication token not set');
    }

    try {
      // Get data from different sources
      const [appleHealthData, ouraData] = await Promise.all([
        healthIntegrationService.fetchHealthKitData(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()),
        healthIntegrationService.fetchOuraData(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          new Date().toISOString().split('T')[0]
        )
      ]);

      // Transform data using adapters
      const [transformedAppleHealth, transformedOura] = await Promise.all([
        appleHealthData ? this.appleHealthAdapter.transform(appleHealthData) : [],
        ouraData ? this.ouraAdapter.transform(ouraData) : []
      ]);

      // Merge and normalize data
      const mergedData = await HealthDataMerger.mergeData([
        transformedAppleHealth,
        transformedOura
      ]);

      // Send merged data to backend
      await fetch(`${API_BASE_URL}/health/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`
        },
        body: JSON.stringify({ data: mergedData })
      });

      // Clear cache to force refresh
      this.cachedHealthData.clear();
      
      // Notify subscribers of new data
      mergedData.forEach(data => this.notifySubscribers(data));
    } catch (error) {
      console.error('Error refreshing health data:', error);
      throw error;
    }
  }

  clearCache(): void {
    this.cachedHealthData.clear();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

const healthServiceInstance = HealthService.getInstance();
export default healthServiceInstance;
