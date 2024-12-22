import { useState, useEffect, useCallback, useRef } from 'react';
import { optimizationManager } from '@/utils/optimizationManager';

interface UseOptimizedLoadingOptions<T> {
  chunkSize?: number;
  priority?: number;
  retryAttempts?: number;
  streamInterval?: number;
  onProgress?: (progress: number) => void;
  dependencies?: any[];
}

export function useOptimizedLoading<T>(
  loader: () => Promise<T[]> | AsyncGenerator<T[], void, unknown>,
  options: UseOptimizedLoadingOptions<T> = {}
) {
  const {
    chunkSize = 100,
    priority = 1,
    retryAttempts = 3,
    streamInterval = 1000,
    onProgress,
    dependencies = []
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const streamIdRef = useRef<string>(`stream_${Math.random()}`);
  const mountedRef = useRef(true);

  const updateProgress = useCallback((newProgress: number) => {
    setProgress(newProgress);
    onProgress?.(newProgress);
  }, [onProgress]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    let accumulated: T[] = [];

    try {
      if (loader.constructor.name === 'AsyncGeneratorFunction') {
        await optimizationManager.streamData(
          loader as () => AsyncGenerator<T[], void, unknown>,
          {
            batchSize: chunkSize,
            interval: streamInterval,
            maxRetries: retryAttempts
          },
          (chunk) => {
            if (!mountedRef.current) return;
            accumulated = [...accumulated, ...chunk];
            setData(accumulated);
            updateProgress(accumulated.length / (chunkSize * 10)); // Estimate total size
          },
          streamIdRef.current
        );
      } else {
        const result = await optimizationManager.loadChunk(
          loader as () => Promise<T[]>,
          `chunk_${streamIdRef.current}`,
          {
            size: chunkSize,
            priority,
            retryAttempts,
            interval: 100 // Default interval of 100ms
          }
        );
        if (mountedRef.current) {
          setData(result);
          updateProgress(1);
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [loader, chunkSize, priority, retryAttempts, streamInterval, updateProgress]);

  useEffect(() => {
    mountedRef.current = true;
    loadData();

    return () => {
      mountedRef.current = false;
      optimizationManager.cancelStream(streamIdRef.current);
    };
  }, [loadData, ...dependencies]);

  const retry = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    progress,
    retry
  };
}

// Example usage:
/*
function DataList() {
  const { data, loading, error, progress } = useOptimizedLoading(
    async function* () {
      for (let i = 0; i < 1000; i += 100) {
        yield await fetchDataChunk(i, 100);
      }
    },
    {
      chunkSize: 100,
      priority: 1,
      onProgress: (p) => console.log(`Loading: ${p * 100}%`)
    }
  );

  if (loading) return <ProgressBar progress={progress} />;
  if (error) return <ErrorDisplay error={error} />;

  return <VirtualizedList data={data} />;
}
*/
