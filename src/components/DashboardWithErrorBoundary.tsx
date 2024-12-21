import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import { Dashboard } from '@mui/icons-material';
import type { DashboardProps } from '../types';

const DashboardWithErrorBoundary: React.FC<DashboardProps> = (props) => (
  <ErrorBoundary errorMessage="There was an error loading the dashboard. Please try again later.">
    <Dashboard {...props} />
  </ErrorBoundary>
);

export default DashboardWithErrorBoundary;