// src/types/notification.ts
export interface Notification {
  id: string;                                      // For tracking
  message: string;                                 // Main notification content
  type: 'success' | 'error' | 'info' | 'warning'; // For styling/categorization
  title?: string;                                 // Optional title
  read: boolean;                                  // Track read status
  duration?: number;                              // For auto-dismiss
  timestamp?: string;                             // For sorting/display
}

// Additional type for creating new notifications
export type NotificationCreate = Omit<Notification, 'id' | 'read'>;

// Context type
export interface NotificationContextType {
  showNotification: (notification: NotificationCreate) => string;
  hideNotification: (id: string) => void;
  clearNotifications: () => void;
}