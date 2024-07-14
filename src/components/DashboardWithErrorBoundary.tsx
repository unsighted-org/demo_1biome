import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import Dashboard from './Dashboard';  // Import the actual Dashboard component, not the MUI icon
import type { DashboardProps } from '../types';
import { Box, Typography, Button } from '@mui/material';

const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ error, resetErrorBoundary }) => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <Typography variant="h5" gutterBottom>Oops! Something went wrong.</Typography>
    <Typography variant="body1" paragraph>{error.message}</Typography>
    <Button variant="contained" onClick={resetErrorBoundary}>Try again</Button>
  </Box>
);

const DashboardWithErrorBoundary: React.FC<DashboardProps> = (props) => (
  <ErrorBoundary
    FallbackComponent={ErrorFallback}
    onReset={() => {
      // Perform any reset actions here, e.g., refetch data
      props.onPageChange(1);
    }}
  >
    <Dashboard {...props} />
  </ErrorBoundary>
);

export default DashboardWithErrorBoundary;