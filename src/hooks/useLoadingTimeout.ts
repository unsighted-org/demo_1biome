import { useState, useEffect } from 'react';

interface UseLoadingTimeoutProps {
  isLoading: boolean;
  timeoutMs?: number;
}

export const useLoadingTimeout = ({ 
  isLoading, 
  timeoutMs = 10000 // default 10 seconds
}: UseLoadingTimeoutProps) => {
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isLoading && !hasTimedOut) {
      timeoutId = setTimeout(() => {
        setHasTimedOut(true);
      }, timeoutMs);
    }

    // Reset timeout when loading stops
    if (!isLoading && hasTimedOut) {
      setHasTimedOut(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading, timeoutMs, hasTimedOut]);

  return hasTimedOut;
};
