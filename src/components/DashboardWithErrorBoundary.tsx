import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import Dashboard from './Dashboard';
import type { DashboardProps } from '@/types';

const DashboardWithErrorBoundary: React.FC<DashboardProps> = (props) => {
  return (
    <ErrorBoundary>
      <Dashboard {...props} />
    </ErrorBoundary>
  );
};

export default DashboardWithErrorBoundary;