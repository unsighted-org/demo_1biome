import { store, addNotification } from '@/store';
import type { UserState, HealthEnvironmentData } from '@/types';

class CustomNotificationService {
  private user: UserState | null = null;
  private token: string | null = null;
  private eventSource: EventSource | null = null;
  private registered: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeServiceWorker();
    }
  }

  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('ServiceWorker registration successful:', registration);
      } catch (error) {
        console.error('ServiceWorker registration failed:', error);
      }
    }
  }

  async register(): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token && { Authorization: `Bearer ${this.token}` })
        }
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      this.registered = true;
      return true;
    } catch (error) {
      console.error('Error registering for notifications:', error);
      return false;
    }
  }

  async unregister(): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/unregister', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token && { Authorization: `Bearer ${this.token}` })
        }
      });

      if (!response.ok) {
        throw new Error('Unregistration failed');
      }

      this.registered = false;
      return true;
    } catch (error) {
      console.error('Error unregistering from notifications:', error);
      return false;
    }
  }

  async initializeNotifications(user: UserState, token: string): Promise<void> {
    this.user = user;
    this.token = token;

    // Close existing connection if any
    if (this.eventSource) {
      this.eventSource.close();
    }

    // Initialize Server-Sent Events connection
    this.eventSource = new EventSource(`/api/notifications/stream?token=${token}`);
    
    this.eventSource.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        store.dispatch(addNotification(notification));
      } catch (error) {
        console.error('Error processing notification:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      this.eventSource?.close();
      // Retry connection after a delay
      setTimeout(() => this.initializeNotifications(user, token), 5000);
    };
  }

  async sendNotification(data: HealthEnvironmentData): Promise<void> {
    if (!this.registered) {
      console.warn('Notifications not registered');
      return;
    }

    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  handleHealthDataNotification(data: HealthEnvironmentData): void {
    if (!this.user || !this.registered) return;

    if (this.user.settings.notificationPreferences.heartRate && data.heartRate > 100) {
      this.sendNotification(data);
    }

    if (this.user.settings.notificationPreferences.stepGoal && data.steps > 10000) {
      this.sendNotification(data);
    }

    if (this.user.settings.notificationPreferences.environmentalImpact && data.environmentalImpactScore > 80) {
      this.sendNotification(data);
    }
  }

  cleanup(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.registered = false;
  }
}

// Create a singleton instance
const notificationService = new CustomNotificationService();

// Export the singleton instance instead of the class
export default notificationService;
