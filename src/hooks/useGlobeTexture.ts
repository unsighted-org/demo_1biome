import { useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { RenderingPipeline } from '@/lib/renderingPipeline';
import { notificationService } from '@/services/CustomNotificationService';

export type GlobeTextureType = 'blue-marble' | 'day' | 'night' | 'topology' | 'water' | 'satellite';

interface TextureConfig {
  name: GlobeTextureType;
  label: string;
  path: string;
  description: string;
}

export const TEXTURE_CONFIGS: TextureConfig[] = [
  {
    name: 'blue-marble',
    label: 'Blue Marble',
    path: '/textures/blue-marble.jpg',
    description: 'NASA\'s iconic Blue Marble view of Earth'
  },
  {
    name: 'day',
    label: 'Daytime',
    path: '/textures/day.jpg',
    description: 'Detailed daytime view of Earth\'s surface'
  },
  {
    name: 'night',
    label: 'Night Lights',
    path: '/textures/night.jpg',
    description: 'Earth\'s city lights at night'
  },
  {
    name: 'topology',
    label: 'Topology',
    path: '/textures/topology.jpg',
    description: 'Topographical map showing Earth\'s terrain'
  },
  {
    name: 'water',
    label: 'Ocean Currents',
    path: '/textures/water.jpg',
    description: 'Visualization of ocean currents and temperatures'
  },
  {
    name: 'satellite',
    label: 'Live Satellite',
    path: '/textures/satellite.jpg',
    description: 'Near real-time satellite imagery'
  }
];

export function useGlobeTexture(renderingPipeline?: RenderingPipeline) {
  const [currentTexture, setCurrentTexture] = useState<GlobeTextureType>('blue-marble');
  const [textureLoading, setTextureLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTexture = useCallback(async (textureName: GlobeTextureType) => {
    const config = TEXTURE_CONFIGS.find(t => t.name === textureName);
    if (!config) {
      setError(`Invalid texture type: ${textureName}`);
      return;
    }

    setTextureLoading(true);
    setError(null);

    try {
      const loader = new THREE.TextureLoader();
      const texture = await loader.loadAsync(config.path);
      
      if (renderingPipeline) {
        renderingPipeline.setTextureType(textureName);
      }

      setCurrentTexture(textureName);
      notificationService.success(`Switched to ${config.label} view`);
    } catch (err) {
      const errorMessage = `Failed to load ${config.label} texture`;
      setError(errorMessage);
      notificationService.error(errorMessage);
    } finally {
      setTextureLoading(false);
    }
  }, [renderingPipeline]);

  useEffect(() => {
    loadTexture(currentTexture);
  }, []);

  return {
    currentTexture,
    setTexture: loadTexture,
    loading: textureLoading,
    error,
    availableTextures: TEXTURE_CONFIGS
  };
}
