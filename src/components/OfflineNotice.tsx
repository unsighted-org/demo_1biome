import { Container, Typography, Alert } from '@mui/material';
import { useState, useEffect } from 'react';
import { WifiOff } from '@mui/icons-material';

const offlineStyles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    textAlign: 'center',
    p: 3,
    bgcolor: 'background.paper',
  } as const,
  text: {
    color: 'warning.main',
  } as const,
};

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function OfflineNotice() {
  return (
    <Container
      maxWidth={false}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.paper'
      }}
    >
      <Alert
        severity="warning"
        variant="outlined"
        icon={<WifiOff />}
        sx={{ maxWidth: 'sm' }}
      >
        <Typography>
          You are currently offline. Some features may be unavailable.
        </Typography>
      </Alert>
    </Container>
  );
}

export default OfflineNotice;
