import React, { ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class GlobeErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Globe component error:", error, errorInfo);
    // You could send this error to an error reporting service
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          padding: 2,
          textAlign: 'center'
        }}>
          <Typography variant="h5" color="error" gutterBottom>
            Something went wrong with the globe visualization.
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            Error: {this.state.error?.message || 'Unknown error'}
          </Typography>
          <Typography variant="body2" gutterBottom>
            Please try refreshing the page. If the problem persists, check your browser&apos;s WebGL support.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Refresh Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default GlobeErrorBoundary;