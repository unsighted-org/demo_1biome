import { Typography, Button } from '@mui/material';
import React from 'react';

import type { ErrorInfo, ReactNode } from 'react';

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
  }

  handleRefresh = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-container p-4">
          <Typography variant="h5" className="m-3">
            Oops! Something went wrong with the globe visualization.
          </Typography>
          <Typography variant="body1" className="m-3">
            Error: {this.state.error?.message || 'Unknown error'}
          </Typography>
          <Typography variant="body2" className="m-3">
            Please try refreshing the page. If the problem persists, check your browser&rsquo;s WebGL support or contact support.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={this.handleRefresh}
            className="m-3"
          >
            Refresh Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobeErrorBoundary;