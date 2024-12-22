// src/components/ErrorBoundary.tsx
import React from 'react';
import { Box, Button, Typography, Container } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
    // Attempt to reload the page
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm">
          <div className="error-container">
            <ErrorIcon color="error" sx={{ fontSize: 64 }} />
            <Typography variant="h4" gutterBottom>
              Oops! Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We apologize for the inconvenience. The application encountered an unexpected error.
            </Typography>
            {this.state.error && (
              <div className="error-message">
                <Typography variant="body2" component="pre" sx={{ m: 0 }}>
                  {this.state.error.message}
                </Typography>
              </div>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={this.handleReset}
            >
              Reload Application
            </Button>
          </div>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
