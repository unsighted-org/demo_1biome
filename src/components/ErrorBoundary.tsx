// src/components/ErrorBoundary.tsx
import { Typography, Button } from '@mui/material';
import React from 'react';

interface Props {
  children: React.ReactNode;
  errorMessage?: string;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Error:', error, info);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Typography variant="h5">
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
