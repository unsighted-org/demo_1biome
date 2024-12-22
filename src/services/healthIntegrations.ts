// Add this interface at the top of the file
interface WebKitMessageHandler {
  postMessage(message: any): void;
}

interface WebKitInterface {
  messageHandlers: {
    healthKit: WebKitMessageHandler;
  };
}

interface HealthKitPermissions {
  authorized: boolean;
}

declare global {
  interface Window {
    webkit?: WebKitInterface;
  }
}

import axios from 'axios';

export interface HealthKitData {
  steps: number;
  heartRate: number;
  activeEnergy: number;
  sleepAnalysis: any;
  workout: any;
}

export interface OuraRingData {
  readiness: {
    score: number;
    temperature: number;
  };
  sleep: {
    duration: number;
    efficiency: number;
    deepSleep: number;
  };
  activity: {
    steps: number;
    calories: number;
  };
}

class HealthIntegrationService {
  private static instance: HealthIntegrationService;
  private ouraToken: string | null = null;
  private healthKitAuthorized: boolean = false;
  private subscribers: Set<(data: any) => void> = new Set();

  private constructor() {
    // Only access localStorage on the client side
    if (typeof window !== 'undefined') {
      this.ouraToken = localStorage.getItem('ouraToken');
    }
  }

  static getInstance(): HealthIntegrationService {
    if (!HealthIntegrationService.instance) {
      HealthIntegrationService.instance = new HealthIntegrationService();
    }
    return HealthIntegrationService.instance;
  }

  subscribe(callback: (data: any) => void) {
    this.subscribers.add(callback);
  }

  unsubscribe(callback: (data: any) => void) {
    this.subscribers.delete(callback);
  }

  private notifySubscribers(data: any) {
    this.subscribers.forEach(callback => callback(data));
  }

  // Apple HealthKit Integration
  async authorizeHealthKit(): Promise<boolean> {
    try {
      return new Promise<boolean>((resolve, reject) => {
        // Create a message handler for the response
        const messageHandler = (event: any) => {
          const permissions = event.data as HealthKitPermissions;
          this.healthKitAuthorized = permissions?.authorized ?? false;
          window.removeEventListener('message', messageHandler);
          resolve(this.healthKitAuthorized);
        };

        // Add event listener for the response
        window.addEventListener('message', messageHandler);

        // Send the authorization request
        window.webkit?.messageHandlers.healthKit.postMessage({
          action: 'requestAuthorization',
          dataTypes: [
            'steps',
            'heartRate',
            'activeEnergy',
            'sleepAnalysis',
            'workout'
          ]
        });
      });
    } catch (error) {
      console.error('HealthKit authorization failed:', error);
      return false;
    }
  }

  async fetchHealthKitData(startDate: Date, endDate: Date): Promise<HealthKitData | null> {
    if (!this.healthKitAuthorized) {
      throw new Error('HealthKit not authorized');
    }

    try {
      return new Promise((resolve, reject) => {
        // Create a unique message ID for this request
        const messageId = Date.now().toString();
        
        // Set up a one-time message handler for this specific request
        const messageHandler = (event: MessageEvent) => {
          if (event.data && event.data.messageId === messageId) {
            window.removeEventListener('message', messageHandler);
            resolve(event.data.healthData);
          }
        };
        
        window.addEventListener('message', messageHandler);

        // Send the message with the messageId
        window.webkit?.messageHandlers?.healthKit?.postMessage({
          messageId,
          action: 'fetchData',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });

        // Add a timeout to prevent hanging
        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          reject(new Error('HealthKit data fetch timeout'));
        }, 30000); // 30 second timeout
      });
    } catch (error) {
      console.error('Failed to fetch HealthKit data:', error);
      return null;
    }
  }

  // Oura Ring Integration
  async authorizeOuraRing(): Promise<boolean> {
    try {
      // Redirect to Oura OAuth page
      const clientId = process.env.NEXT_PUBLIC_OURA_CLIENT_ID;
      const redirectUri = `${window.location.origin}/api/oura/callback`;
      const scope = 'daily readiness sleep activity';
      
      window.location.href = `https://cloud.ouraring.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
      
      return true;
    } catch (error) {
      console.error('Oura Ring authorization failed:', error);
      return false;
    }
  }

  async getOuraToken(): Promise<string | null> {
    return this.ouraToken;
  }

  setOuraToken(token: string | null): void {
    this.ouraToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('ouraToken', token);
      } else {
        localStorage.removeItem('ouraToken');
      }
    }
  }

  async fetchOuraData(startDate: string, endDate: string): Promise<OuraRingData | null> {
    if (!this.ouraToken) {
      throw new Error('Oura Ring not authorized');
    }

    try {
      const [readiness, sleep, activity] = await Promise.all([
        axios.get(`https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${startDate}&end_date=${endDate}`, {
          headers: { Authorization: `Bearer ${this.ouraToken}` }
        }),
        axios.get(`https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=${startDate}&end_date=${endDate}`, {
          headers: { Authorization: `Bearer ${this.ouraToken}` }
        }),
        axios.get(`https://api.ouraring.com/v2/usercollection/daily_activity?start_date=${startDate}&end_date=${endDate}`, {
          headers: { Authorization: `Bearer ${this.ouraToken}` }
        })
      ]);

      return {
        readiness: readiness.data.data[0],
        sleep: sleep.data.data[0],
        activity: activity.data.data[0]
      };
    } catch (error) {
      console.error('Failed to fetch Oura Ring data:', error);
      return null;
    }
  }

  // Data synchronization
  async syncHealthData(): Promise<void> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Get last 7 days of data

    try {
      const [healthKitData, ouraData] = await Promise.all([
        this.healthKitAuthorized ? this.fetchHealthKitData(startDate, endDate) : null,
        this.ouraToken ? this.fetchOuraData(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]) : null
      ]);

      // Merge and process the data
      const mergedData = this.mergeHealthData(healthKitData, ouraData);

      // Notify subscribers
      this.notifySubscribers(mergedData);

      // Store the merged data
      await this.storeHealthData(mergedData);
    } catch (error) {
      console.error('Health data sync failed:', error);
      throw error;
    }
  }

  private mergeHealthData(healthKitData: HealthKitData | null, ouraData: OuraRingData | null): any {
    // Implement data merging logic based on your requirements
    return {
      steps: Math.max(healthKitData?.steps ?? 0, ouraData?.activity?.steps ?? 0),
      heartRate: healthKitData?.heartRate ?? 0,
      sleep: {
        duration: ouraData?.sleep?.duration ?? healthKitData?.sleepAnalysis?.duration ?? 0,
        efficiency: ouraData?.sleep?.efficiency ?? 0,
        deepSleep: ouraData?.sleep?.deepSleep ?? 0
      },
      activity: {
        calories: Math.max(healthKitData?.activeEnergy ?? 0, ouraData?.activity?.calories ?? 0)
      },
      readiness: ouraData?.readiness?.score ?? 100
    };
  }

  private async storeHealthData(data: any): Promise<void> {
    try {
      await axios.post('/api/health/store', data);
    } catch (error) {
      console.error('Failed to store health data:', error);
      throw error;
    }
  }
}

export const healthIntegrationService = HealthIntegrationService.getInstance();
