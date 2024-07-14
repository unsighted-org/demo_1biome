import { azureConfig } from '@/config/azureConfig';
import type { HealthEnvironmentData, UserState } from '@/types';

type SetFCMTokenFunction = (token: string) => void;
type AddNotificationFunction = (notification: { title: string; message: string }) => void;

export class NotificationService {
  private token: string | null = null;
  private user: UserState | null = null;
  private retryAttempts: number = 3;
  private static BASE_URL = process.env.NODE_ENV === 'test' ? 'https://localhost:3000' : '';
  private setFCMToken: SetFCMTokenFunction;
  private addNotification: AddNotificationFunction;

  constructor(setFCMToken: SetFCMTokenFunction, addNotification: AddNotificationFunction) {
    this.setFCMToken = setFCMToken;
    this.addNotification = addNotification;
  }

  setAuthContext(user: UserState, token: string): void {
    this.user = user;
    this.token = token;
  }

  async init(): Promise<void> {
    try {
      console.log('Initializing notification service...');
      if (!this.user) {
        console.warn('User not authenticated. Skipping notification initialization.');
        return;
      }
      console.log('Getting token with retry...');
      const token = await this.getTokenWithRetry();
      console.log('Notification token received:', token);
      this.updateToken(token);
      console.log('Token updated');
      console.log('Registering for push notifications...');
      await this.registerForPushNotifications();
      console.log('Push notifications registered');
      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  private async getToken(): Promise<string> {
    const response = await fetch(`${NotificationService.BASE_URL}/api/notifications/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ 
        hubName: azureConfig.notificationHubName,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch token: ${errorText}`);
    }

    const data = await response.json();
    return data.token;
  }

  public async getTokenWithRetry(): Promise<string> {
    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        return await this.getToken();
      } catch (error) {
        console.error(`Attempt ${attempt + 1} to get token failed:`, error);
        if (attempt === this.retryAttempts - 1) throw new Error('Failed to get token after multiple attempts');
      }
    }
    throw new Error('Failed to get token after multiple attempts');
  }

  private updateToken(token: string): void {
    this.token = token;
    this.setFCMToken(token);
  }

  private async registerForPushNotifications(): Promise<void> {
    if (!this.token || !this.user) {
      console.error('Notification token or user not available');
      return;
    }

    try {
      console.log('Registering for push notifications');
      const registration = await navigator.serviceWorker.ready;
      console.log('Service worker is ready');

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });

      console.log('Push subscription created', subscription);

      const response = await fetch('/api/notifications/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error('Failed to send push subscription to server');
      }

      console.log('Push subscription sent to server successfully');
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async revokeNotificationToken(userId: string): Promise<void> {
    try {
      console.log(`Revoking notification token for user: ${userId}`);
      this.token = null;
      this.setFCMToken('');
    } catch (error) {
      console.error('Failed to revoke notification token:', error);
    }
  }

  updateUserPreferences(newPreferences: UserState['settings']['notificationPreferences']): void {
    if (this.user && this.user.settings) {
      this.user.settings.notificationPreferences = { ...this.user.settings.notificationPreferences, ...newPreferences };
    }
  }

  handleNotification(payload: { title: string; message: string }): void {
    console.log('Received notification:', payload);
    this.showNotification(payload.title, payload.message);
    this.addNotification({ title: payload.title, message: payload.message });
  }

  showNotification(title: string, message: string): void {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body: message });
        } else {
          console.warn('Notification permission denied');
          this.showInAppNotification(title, message);
        }
      });
    } else {
      console.warn('Notifications not supported in this browser');
      this.showInAppNotification(title, message);
    }
  }

  private showInAppNotification(title: string, message: string): void {
    this.addNotification({ title, message });
  }

  handleHealthDataNotification(data: HealthEnvironmentData): void {
    if (this.user?.settings.notificationPreferences.heartRate && data.heartRate > 100) {
      this.showNotification('High Heart Rate', 'Your heart rate is above normal levels. Consider taking a rest.');
    }
    if (this.user?.settings.notificationPreferences.stepGoal && data.steps > 10000) {
      this.showNotification('Daily Goal Achieved', 'Congratulations! You\'ve reached your daily step goal.');
    }
    if (this.user?.settings.notificationPreferences.environmentalImpact && data.environmentalImpactScore > 80) {
      this.showNotification('High Environmental Impact', 'Your recent activity has a high environmental impact. Check your globe for details.');
    }
  }

  async refreshFCMToken(): Promise<void> {
    if (!this.user) {
      console.warn('User not authenticated. Skipping token refresh.');
      return;
    }
    try {
      const newToken = await this.getTokenWithRetry();
      this.updateToken(newToken);
      await this.registerForPushNotifications();
      console.log('FCM token refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh FCM token:', error);
    }
  }

  async batchNotifications(notifications: { title: string; message: string }[]): Promise<void> {
    for (const notification of notifications) {
      this.handleNotification(notification);
    }
  }
}

// Note: We're not exporting a singleton instance here anymore