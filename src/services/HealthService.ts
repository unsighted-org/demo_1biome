import type { HealthEnvironmentData, ConnectedDevice, UserSignupData } from '@/types';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import {
  CACHE_DURATION,
  MAX_CACHE_AGE,
  MAX_CACHE_SIZE,
  MAX_PAGES,
  MAX_DATA_POINTS_PER_PAGE,
  MAX_DATA_POINTS_PER_SECOND,
  MAX_RETRIES,
  INITIAL_RETRY_DELAY,
  API_BASE_URL,
  getCurrentBaseUrl
} from '@/constants';

interface PaginatedHealthData {
  data: HealthEnvironmentData[];
  totalPages: number;
  currentPage: number;
}

class HealthService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private cachedHealthData: Map<number, { data: HealthEnvironmentData[]; timestamp: number }> = new Map();
  private lastRequestTime: number = 0;
  private requestCount: number = 0;

  setToken(token: string): void {
    this.token = token;
  }

  private getToken(): string | null {
    return this.token;
  }

  private getApiUrl(): string {
    return typeof window === 'undefined'
      ? `${API_BASE_URL}/api/health-data`
      : '/api/health-data';
  }

  private isCacheValid(timestamp: number): boolean {
    const now = Date.now();
    return now - timestamp < CACHE_DURATION && now - timestamp < MAX_CACHE_AGE;
  }

  private async rateLimitedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < 1000) {
      this.requestCount++;
      if (this.requestCount > MAX_DATA_POINTS_PER_SECOND) {
        await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
        this.requestCount = 1;
      }
    } else {
      this.requestCount = 1;
    }
    
    this.lastRequestTime = Date.now();
    return this.fetchWithRetry(url, options);
  }

  private async fetchWithRetry(url: string, options: RequestInit = {}, retries: number = 0): Promise<Response> {
    try {
      const response = await this.fetchWithAuth(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (retries < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retries);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, retries + 1);
      }
      throw error;
    }
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Token not found. Cannot make authenticated request.');
    }
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private updateCacheWithNewData(newData: HealthEnvironmentData): void {
    for (const [page, cachedData] of this.cachedHealthData.entries()) {
      const index = cachedData.data.findIndex(item => item.timestamp === newData.timestamp);
      if (index !== -1) {
        cachedData.data[index] = newData;
        this.cachedHealthData.set(page, { ...cachedData, timestamp: Date.now() });
        break;
      }
    }

    if (this.cachedHealthData.size > MAX_CACHE_SIZE) {
      let oldestKey = -1;
      let oldestTimestamp = Infinity;
      for (const [key, value] of this.cachedHealthData.entries()) {
        if (value.timestamp < oldestTimestamp) {
          oldestKey = key;
          oldestTimestamp = value.timestamp;
        }
      }
      if (oldestKey !== -1) {
        this.cachedHealthData.delete(oldestKey);
      }
    }
  }

  async getHealthDataForLastWeek(): Promise<HealthEnvironmentData[]> {
    const cachedFirstPage = this.cachedHealthData.get(1);
    if (cachedFirstPage && this.isCacheValid(cachedFirstPage.timestamp)) {
      console.log('Using cached health data');
      return cachedFirstPage.data;
    }

    try {
      const response = await this.rateLimitedFetch(this.getApiUrl());
      const { data } = await response.json() as PaginatedHealthData;
      this.cachedHealthData.set(1, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      throw error;
    }
  }

  async getPaginatedHealthData(page: number = 1): Promise<PaginatedHealthData> {
    if (page < 1 || page > MAX_PAGES) {
      throw new Error(`Page number must be between 1 and ${MAX_PAGES}`);
    }

    const cachedPage = this.cachedHealthData.get(page);
    if (cachedPage && this.isCacheValid(cachedPage.timestamp)) {
      console.log(`Using cached health data for page ${page}`);
      return { data: cachedPage.data, totalPages: MAX_PAGES, currentPage: page };
    }

    try {
      const response = await this.rateLimitedFetch(`${this.getApiUrl()}?page=${page}`);
      const paginatedData = await response.json() as PaginatedHealthData;
      
      if (paginatedData.data.length > MAX_DATA_POINTS_PER_PAGE) {
        paginatedData.data = paginatedData.data.slice(0, MAX_DATA_POINTS_PER_PAGE);
      }
      
      this.cachedHealthData.set(page, { data: paginatedData.data, timestamp: Date.now() });
      return paginatedData;
    } catch (error) {
      console.error('Failed to fetch paginated health data:', error);
      throw error;
    }
  }

  async submitUserData(data: Omit<UserSignupData, 'email' | 'password'>): Promise<void> {
    try {
      const response = await this.rateLimitedFetch(`${this.getApiUrl()}/user-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to submit user data');
    } catch (error) {
      console.error('Failed to submit user data:', error);
      throw error;
    }
  }

  async getConnectedDevices(): Promise<ConnectedDevice[]> {
    try {
      const response = await this.rateLimitedFetch(`${this.getApiUrl()}/devices`);
      if (!response.ok) throw new Error('Failed to fetch connected devices');
      return await response.json() as ConnectedDevice[];
    } catch (error) {
      console.error('Failed to fetch connected devices:', error);
      throw error;
    }
  }

  async subscribeToHealthData(
    callback: (data: HealthEnvironmentData) => void,
    errorCallback: (error: Error) => void
  ): Promise<(() => void) | null> {
    if (typeof window === 'undefined') return null;
    
    const token = this.getToken();
    if (!token) {
      errorCallback(new Error('Token not found. Cannot subscribe to health data.'));
      return null;
    }

    const baseUrl = getCurrentBaseUrl();
    this.socket = io(baseUrl, {
      path: '/api/socketio',
      auth: { token },
    });

    this.socket.on('health-data', (data: HealthEnvironmentData) => {
      this.updateCacheWithNewData(data);
      callback(data);
    });

    this.socket.on('connect_error', (error: Error) => {
      errorCallback(error);
    });

    return () => {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
    };
  }

  async syncDeviceData(deviceId: string): Promise<void> {
    try {
      const response = await this.rateLimitedFetch(`${this.getApiUrl()}/devices/${deviceId}/sync`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to sync device data');
    } catch (error) {
      console.error('Failed to sync device data:', error);
      throw error;
    }
  }

  clearCache(): void {
    this.cachedHealthData.clear();
  }
}

const healthServiceInstance = new HealthService();
export default healthServiceInstance;