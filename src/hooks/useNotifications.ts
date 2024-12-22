import { useState, useCallback } from 'react';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  read?: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    setNotifications((prev) => [...prev, { ...notification, id, read: false }]);
    return id;
  }, []);

  const hideNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const toggleNotifications = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      // Mark all as read when opening
      setNotifications((prev) => 
        prev.map((notification) => ({ ...notification, read: true }))
      );
    }
  }, [isOpen]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return {
    notifications,
    showNotification,
    hideNotification,
    clearNotifications,
    toggleNotifications,
    unreadCount,
    isOpen,
  };
}
