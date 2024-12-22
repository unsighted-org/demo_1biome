import { useEffect, useState } from 'react';

export const useGlobeOptimizations = () => {
  const [isOptimized, setIsOptimized] = useState(false);
  const [frameRate, setFrameRate] = useState(60);

  useEffect(() => {
    // Check if device is capable of high performance rendering
    const checkDeviceCapabilities = () => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      
      if (!gl) {
        setIsOptimized(true); // Enable optimizations for devices without WebGL
        setFrameRate(30);
        return;
      }

      // Check if device is low-end based on various factors
      const isLowEndDevice = 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.devicePixelRatio < 2 ||
        navigator.hardwareConcurrency <= 4;

      setIsOptimized(isLowEndDevice);
      setFrameRate(isLowEndDevice ? 30 : 60);
    };

    checkDeviceCapabilities();
  }, []);

  return {
    isOptimized,
    frameRate,
    // Add any other optimization settings here
    pixelRatio: isOptimized ? 1 : window.devicePixelRatio,
    antialias: !isOptimized,
    shadows: !isOptimized,
  };
};
