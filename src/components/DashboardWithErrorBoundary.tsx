import { Box, Typography, Button } from '@mui/material';
import React from 'react';

import { useHealth } from '@/services/HealthContext';

import Dashboard from './Dashboard';
import ErrorBoundary from './ErrorBoundary';

const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ error, resetErrorBoundary }) => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <Typography variant="h5" gutterBottom>Oops! Something went wrong.</Typography>
    <Typography variant="body1" paragraph>{error.message}</Typography>
    <Button variant="contained" onClick={resetErrorBoundary}>Try again</Button>
  </Box>
);

const DashboardWithErrorBoundary: React.FC = () => {
  const { fetchHealthData } = useHealth();

  const handleReset = (): void => {
    // Perform any reset actions here, e.g., refetch data
    fetchHealthData(1);
  };

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={handleReset}
    >
      <Dashboard />
    </ErrorBoundary>
  );
};

export default DashboardWithErrorBoundary;