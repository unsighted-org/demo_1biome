import { extend } from '@react-three/fiber';
import * as THREE from 'three';

import type { HealthEnvironmentData, HealthMetric } from '@/types';

// Advanced Glow Material with pulsating effect
class AdvancedGlowMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
      c: { value: 0.1 },
      p: { value: 4.5 },
      glowColor: { value: new THREE.Color(0x000000) }, // Set glowColor to black
      time: { value: 0 },
      },
      vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
      `,
      fragmentShader: `
      uniform float c;
      uniform float p;
      uniform vec3 glowColor;
      uniform float time;
      varying vec3 vNormal;
      void main() {
        float intensity = pow(c - dot(vNormal, vec3(0.0, 0.0, 1.0)), p);
        float pulsate = sin(time * 2.0) * 0.1 + 0.9;
        gl_FragColor = vec4(glowColor, intensity * pulsate);
      }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
  }

  update(time: number): void {
    this.uniforms.time.value = time;
  }
}

// Improved Earth Material with dynamic cloud layer
class ImprovedEarthMaterial extends THREE.MeshStandardMaterial {
  constructor() {
    super({
      metalness: 0.1,
      roughness: 0.8,
      normalScale: new THREE.Vector2(0.05, 0.05)
    });
  }
}

// OpenStreetMap tile material with dynamic LOD and hover effect
class OpenStreetMapMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        tileTextures: { value: [] },
        zoomLevel: { value: 0 },
        tileCoords: { value: new THREE.Vector4() }, // x, y coordinates and zoom level
        transitionProgress: { value: 0.0 },
        previousTileTextures: { value: [] },
        hoverPosition: { value: new THREE.Vector2() },
        isHovering: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tileTextures[4];
        uniform sampler2D previousTileTextures[4];
        uniform float zoomLevel;
        uniform vec4 tileCoords;
        uniform float transitionProgress;
        uniform vec2 hoverPosition;
        uniform float isHovering;
        varying vec2 vUv;
        varying vec3 vPosition;

        const float PI = 3.1415926535897932384626433832795;

        // Convert 3D position to lat/lon
        vec2 getLatLon(vec3 position) {
          float lat = asin(position.y);
          float lon = atan(position.x, position.z);
          return vec2(lat * 180.0 / PI, lon * 180.0 / PI);
        }

        // Calculate distance between two lat/lon points
        float getDistance(vec2 p1, vec2 p2) {
          vec2 diff = p1 - p2;
          return length(diff);
        }

        void main() {
          // Calculate tile coordinates
          vec2 tileUv = fract(vUv * tileCoords.xy + tileCoords.zw);
          
          // Sample current and previous textures
          vec4 currentColor = texture2D(tileTextures[0], tileUv);
          vec4 previousColor = texture2D(previousTileTextures[0], tileUv);
          
          // Blend between previous and current zoom level
          vec4 baseColor = mix(previousColor, currentColor, transitionProgress);

          // Calculate hover effect
          vec2 latLon = getLatLon(normalize(vPosition));
          float dist = getDistance(latLon, hoverPosition);
          float hoverEffect = isHovering * (1.0 - smoothstep(0.0, 10.0, dist));
          
          // Apply hover highlight
          vec3 highlightColor = vec3(1.0, 1.0, 1.0);
          vec3 finalColor = mix(baseColor.rgb, highlightColor, hoverEffect * 0.2);
          
          gl_FragColor = vec4(finalColor, baseColor.a);
        }
      `,
      transparent: true,
    });
  }

  update(zoomLevel: number, tileCoords: THREE.Vector4, progress: number): void {
    this.uniforms.zoomLevel.value = zoomLevel;
    this.uniforms.tileCoords.value = tileCoords;
    this.uniforms.transitionProgress.value = progress;
  }

  setHoverPosition(hoverPosition: THREE.Vector2, isHovering: boolean): void {
    this.uniforms.hoverPosition.value = hoverPosition;
    this.uniforms.isHovering.value = isHovering ? 1.0 : 0.0;
  }
}

extend({ AdvancedGlowMaterial, ImprovedEarthMaterial, OpenStreetMapMaterial });

export const latLongToVector3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

export const getColorFromScore = (score: number): THREE.Color => {
  const normalizedScore = THREE.MathUtils.clamp((score - 0) / (100 - 0), 0, 1);
  const lowColor = new THREE.Color(0xff0000);
  const midColor = new THREE.Color(0xffff00);
  const highColor = new THREE.Color(0x00ff00);

  return normalizedScore < 0.5
    ? lowColor.lerp(midColor, normalizedScore * 2)
    : midColor.lerp(highColor, (normalizedScore - 0.5) * 2);
};

export const createAdvancedGlowMaterial = (): AdvancedGlowMaterial => {
  return new AdvancedGlowMaterial();
};

export const createImprovedEarthMaterial = (): ImprovedEarthMaterial => {
  return new ImprovedEarthMaterial();
};

export const createOpenStreetMapMaterial = (): OpenStreetMapMaterial => {
  return new OpenStreetMapMaterial();
};

export const createStarField = (count: number, radius: number): THREE.Points => {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = 2 * Math.PI * Math.random();
    const phi = Math.acos(2 * Math.random() - 1);
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    sizes[i] = Math.random() * 0.02 + 0.01;

    colors[i * 3] = 1;
    colors[i * 3 + 1] = 1;
    colors[i * 3 + 2] = 1;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
    },
    vertexShader: `
      attribute float size;
      varying vec3 vColor;
      uniform float time;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float twinkle = sin(time * 5.0 + float(gl_VertexID)) * 0.5 + 0.5;
        gl_PointSize = size * (300.0 / -mvPosition.z) * twinkle;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        if (length(gl_PointCoord - vec2(0.5, 0.5)) > 0.5) discard;
        gl_FragColor = vec4(vColor, 1.0);
      }
    `,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
  });

  return new THREE.Points(geometry, material);
};

export const animateStarField = (starField: THREE.Points, time: number): void => {
  if (starField.material instanceof THREE.ShaderMaterial) {
    starField.material.uniforms.time.value = time;
  }
};

export const createDataPoints = (
  healthData: HealthEnvironmentData[],
  radius: number,
  displayMetric: keyof HealthEnvironmentData
): THREE.InstancedMesh => {
  const geometry = new THREE.SphereGeometry(0.005, 16, 16);
  const material = new THREE.MeshBasicMaterial();

  const instancedMesh = new THREE.InstancedMesh(geometry, material, healthData.length);

  const tempObject = new THREE.Object3D();
  const colorArray = new Float32Array(healthData.length * 3);

  healthData.forEach((data, index) => {
    const position = latLongToVector3(data.latitude, data.longitude, radius);
    tempObject.position.copy(position);
    tempObject.updateMatrix();
    instancedMesh.setMatrixAt(index, tempObject.matrix);

    const score = data[displayMetric] as number;
    const color = getColorFromScore(score);
    colorArray[index * 3] = color.r;
    colorArray[index * 3 + 1] = color.g;
    colorArray[index * 3 + 2] = color.b;
  });

  instancedMesh.instanceMatrix.needsUpdate = true;
  instancedMesh.geometry.setAttribute('color', new THREE.InstancedBufferAttribute(colorArray, 3));

  return instancedMesh;
};

export const updateDataPoints = (
  instancedMesh: THREE.InstancedMesh,
  healthData: HealthEnvironmentData[],
  displayMetric: keyof HealthEnvironmentData,
  hoveredIndex: number | null,
  selectedIndex: number | null
): void => {
  const colorAttribute = instancedMesh.geometry.getAttribute('color') as THREE.InstancedBufferAttribute;
  const colorArray = colorAttribute.array as Float32Array;

  healthData.forEach((data, index) => {
    const score = data[displayMetric] as number;
    const color = getColorFromScore(score);

    if (index === hoveredIndex) {
      color.multiplyScalar(1.5); // Brighten hovered point
    }
    if (index === selectedIndex) {
      color.setRGB(1, 1, 1); // Make selected point white
    }

    colorArray[index * 3] = color.r;
    colorArray[index * 3 + 1] = color.g;
    colorArray[index * 3 + 2] = color.b;
  });

  colorAttribute.needsUpdate = true;
};

export const optimizeForMobile = (renderer: THREE.WebGLRenderer): void => {
  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false;
};

// Helper function to check if WebGL is available
export const isWebGLAvailable = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
};

export const createAnimatedCloudMaterial = (cloudTexture: THREE.Texture): THREE.ShaderMaterial => {
  return new THREE.ShaderMaterial({
    uniforms: {
      cloudTexture: { value: cloudTexture },
      time: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D cloudTexture;
      uniform float time;
      varying vec2 vUv;
      void main() {
        vec2 uv = vUv + vec2(time * 0.0001, 0.0);
        vec4 color = texture2D(cloudTexture, uv);
        gl_FragColor = color;
      }
    `,
    transparent: true,
  });
};

export const createAtmosphereMaterial = (earthTexture: THREE.Texture): THREE.ShaderMaterial => {
  return new THREE.ShaderMaterial({
    uniforms: {
      earthTexture: { value: earthTexture },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D earthTexture;
      varying vec2 vUv;
      void main() {
        vec4 texColor = texture2D(earthTexture, vUv);
        gl_FragColor = texColor;
      }
    `,
  });
};

// Tile loading and management
class TileManager {
  private cache: Map<string, THREE.Texture>;
  private loader: THREE.TextureLoader;
  
  constructor() {
    this.cache = new Map();
    this.loader = new THREE.TextureLoader();
  }

  async loadTile(x: number, y: number, zoom: number): Promise<THREE.Texture> {
    const key = `${zoom}/${x}/${y}`;
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const url = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (texture) => {
          this.cache.set(key, texture);
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }

  clearOldTiles(currentZoom: number): void {
    for (const [key] of this.cache) {
      const [zoom] = key.split('/').map(Number);
      if (Math.abs(zoom - currentZoom) > 2) {
        this.cache.delete(key);
      }
    }
  }
}

export const tileManager = new TileManager();

export const calculateTileCoords = (lat: number, lon: number, zoom: number) => {
  const n = Math.pow(2, zoom);
  const latRad = lat * Math.PI / 180;
  
  const xtile = Math.floor((lon + 180) / 360 * n);
  const ytile = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  
  return {
    x: xtile,
    y: ytile,
    offsetX: ((lon + 180) / 360 * n) % 1,
    offsetY: ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n) % 1
  };
};

export const getTileUrl = (x: number, y: number, zoom: number): string => {
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
};

export function createGeospatialMaterial(healthData: HealthEnvironmentData[], displayMetric: HealthMetric): THREE.ShaderMaterial {
  const width = 360;
  const height = 180;
  const size = width * height;
  const data = new Uint8Array(width * height * 4);

  // Use more efficient data mapping
  const dataMap = new Map<string, number>();
  healthData.forEach(datum => {
    const x = Math.floor((datum.longitude + 180) * (width / 360));
    const y = Math.floor((90 - datum.latitude) * (height / 180));
    const key = `${x},${y}`;
    
    // Keep the highest value for each location
    const currentValue = dataMap.get(key) || 0;
    const metricValue = datum[displayMetric];
    const newValue = typeof metricValue === 'number' ? metricValue / 100 : 0;
    if (newValue > currentValue) {
      dataMap.set(key, newValue);
    }
  });

  // Apply the mapped data to the texture
  dataMap.forEach((value, key) => {
    const [x, y] = key.split(',').map(Number);
    const index = (y * width + x) * 4;
    data[index] = value * 255;
    data[index + 1] = 0;
    data[index + 2] = 255 - value * 255;
    data[index + 3] = 128;
  });

  const dataTexture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.UnsignedByteType);
  dataTexture.needsUpdate = true;

  return new THREE.ShaderMaterial({
    uniforms: {
      dataTexture: { value: dataTexture },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D dataTexture;
      varying vec2 vUv;
      void main() {
        vec4 data = texture2D(dataTexture, vUv);
        gl_FragColor = vec4(data.r, 0.0, 1.0 - data.r, 0.5);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });
}