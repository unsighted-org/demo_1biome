import { useState, useEffect } from 'react';

interface LoadingTimeoutOptions {
  isLoading: boolean;
  timeoutMs: number;
}

interface LoadingTimeoutResult {
  loading: boolean;
  timedOut: boolean;
}

export function useLoadingTimeout({ isLoading, timeoutMs }: LoadingTimeoutOptions): LoadingTimeoutResult {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setTimedOut(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setTimedOut(true);
      }
    }, timeoutMs);

    return () => clearTimeout(timeoutId);
  }, [isLoading, timeoutMs]);

  return {
    loading: isLoading,
    timedOut
  };
}

export default useLoadingTimeout;
