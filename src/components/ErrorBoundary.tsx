// src/components/ErrorBoundary.tsx
import { Typography, Button } from '@mui/material';
import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  errorMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.log('ErrorBoundary caught an error:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="text-center mt-8">
          <Typography variant="h4">
            {this.props.errorMessage || 'Something went wrong'}
          </Typography>
          <Button 
            onClick={() => window.location.reload()} 
            variant="contained" 
            color="primary"
          >
            Reload
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
