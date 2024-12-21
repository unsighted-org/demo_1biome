import React, { createContext, useContext } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationContextType {
  showNotification: (notification: {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
  }) => string;
  hideNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    notifications,
    showNotification,
    hideNotification,
    clearNotifications,
  } = useNotifications();

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        hideNotification,
        clearNotifications,
      }}
    >
      {children}
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.duration || 5000}
          onClose={() => hideNotification(notification.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={() => hideNotification(notification.id)}
            severity={notification.type}
            sx={{
              width: '100%',
              backgroundColor: notification.type === 'error' ? 'rgba(211, 47, 47, 0.1)' : undefined,
              color: 'white',
              '& .MuiAlert-icon': {
                color: 'white',
              },
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};
