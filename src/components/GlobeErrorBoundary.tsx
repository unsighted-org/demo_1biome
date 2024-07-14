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

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong with the globe visualization.</h2>
          <p>Error: {this.state.error?.message || 'Unknown error'}</p>
          <p>Please try refreshing the page. If the problem persists, check your browser&apos;s WebGL support.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobeErrorBoundary;