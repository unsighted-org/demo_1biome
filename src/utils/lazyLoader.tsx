import React, { useEffect, useState, useCallback } from 'react';

export interface LazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  retryCount?: number;
  retryDelay?: number;
}

export class LazyLoadManager {
  private static instance: LazyLoadManager;
  private loadQueue: Map<string, () => Promise<any>>;
  private observer: IntersectionObserver | null;
  private processing: boolean;

  private constructor() {
    this.loadQueue = new Map();
    this.observer = null;
    this.processing = false;
  }

  static getInstance(): LazyLoadManager {
    if (!LazyLoadManager.instance) {
      LazyLoadManager.instance = new LazyLoadManager();
    }
    return LazyLoadManager.instance;
  }

  initialize(options: LazyLoadOptions = {}) {
    const {
      threshold = 0.1,
      rootMargin = '50px',
    } = options;

    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const key = entry.target.getAttribute('data-lazy-key');
              if (key && this.loadQueue.has(key)) {
                this.processItem(key);
              }
            }
          });
        },
        { threshold, rootMargin }
      );
    }
  }

  private async processItem(key: string) {
    if (!this.loadQueue.has(key)) return;

    const loader = this.loadQueue.get(key)!;
    this.loadQueue.delete(key);

    try {
      await loader();
    } catch (error) {
      console.error(`Error loading item ${key}:`, error);
    }
  }

  addToQueue(key: string, loader: () => Promise<any>) {
    this.loadQueue.set(key, loader);
  }

  observe(element: Element, key: string) {
    if (this.observer) {
      element.setAttribute('data-lazy-key', key);
      this.observer.observe(element);
    }
  }

  unobserve(element: Element) {
    if (this.observer) {
      this.observer.unobserve(element);
    }
  }
}

export function useLazyLoad<T>(
  loader: () => Promise<T>,
  options: LazyLoadOptions = {}
): [boolean, T | null, Error | null] {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await loader();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
      if (retryCount < (options.retryCount || 3)) {
        setTimeout(() => {
          setRetryCount(count => count + 1);
        }, (options.retryDelay || 1000) * Math.pow(2, retryCount));
      }
    } finally {
      setLoading(false);
    }
  }, [loader, retryCount, options.retryCount, options.retryDelay]);

  useEffect(() => {
    load();
  }, [load]);

  return [loading, data, error];
}

interface LazyLoadedComponentProps {
  children?: React.ReactNode;
}

export function withLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  options: LazyLoadOptions = {}
): React.FC<P & LazyLoadedComponentProps> {
  return function LazyLoadedComponent(props: P & LazyLoadedComponentProps) {
    const [ref, setRef] = useState<HTMLDivElement | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      if (!ref) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsVisible(entry.isIntersecting);
        },
        {
          threshold: options.threshold || 0.1,
          rootMargin: options.rootMargin || '50px',
        }
      );

      observer.observe(ref);

      return () => {
        observer.disconnect();
      };
    }, [ref, options.threshold, options.rootMargin]);

    return (
      <div ref={setRef}>
        {isVisible && <Component {...props} />}
      </div>
    );
  };
}
