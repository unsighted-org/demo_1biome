import { useState, useCallback, useRef, useEffect } from 'react';
import type { GlobeState, GeoCoordinates, Vector3 } from '@/lib/types';
import { throttle } from 'lodash';

interface UseGlobeStateOptions {
  onStateChange?: (state: GlobeState) => void;
  throttleMs?: number;
}

export const useGlobeState = (options: UseGlobeStateOptions = {}) => {
  const { onStateChange, throttleMs = 100 } = options;
  
  const [state, setState] = useState<GlobeState>({
    zoom: 1,
    center: { latitude: 0, longitude: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    isInteracting: false
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const throttledStateChange = useRef(
    throttle((newState: GlobeState) => {
      onStateChange?.(newState);
    }, throttleMs)
  ).current;

  const updateState = useCallback((updates: Partial<GlobeState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      throttledStateChange(newState);
      return newState;
    });
  }, [throttledStateChange]);

  const setCenter = useCallback((coords: GeoCoordinates) => {
    updateState({ center: coords });
  }, [updateState]);

  const setZoom = useCallback((zoom: number) => {
    const clampedZoom = Math.max(1, Math.min(zoom, 5));
    updateState({ zoom: clampedZoom });
  }, [updateState]);

  const setRotation = useCallback((rotation: Vector3) => {
    updateState({ rotation });
  }, [updateState]);

  const setInteracting = useCallback((isInteracting: boolean) => {
    updateState({ isInteracting });
  }, [updateState]);

  const resetState = useCallback(() => {
    setState({
      zoom: 1,
      center: { latitude: 0, longitude: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      isInteracting: false
    });
  }, []);

  useEffect(() => {
    return () => {
      throttledStateChange.cancel();
    };
  }, [throttledStateChange]);

  return {
    state,
    setCenter,
    setZoom,
    setRotation,
    setInteracting,
    resetState,
    updateState
  };
};
