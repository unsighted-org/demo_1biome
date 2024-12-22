import { Error, Refresh } from '@mui/icons-material';
import { Button, Typography } from '@mui/material';
import React from 'react';

interface LoadingTimeoutErrorProps {
  message?: string;
  onRetry?: () => void;
}

export const LoadingTimeoutError: React.FC<LoadingTimeoutErrorProps> = ({ 
  message = 'Loading is taking longer than expected.',
  onRetry = () => window.location.reload()
}) => {
  return (
    <div className="error-container">
      <Error color="error" className="m-4" style={{ fontSize: 60 }} />
      <Typography variant="h6" color="error" gutterBottom>
        {message}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<Refresh />}
        onClick={onRetry}
        className="m-4"
      >
        Retry
      </Button>
    </div>
  );
};
