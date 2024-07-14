// src/lib/globe-helpers.ts

import { extend } from '@react-three/fiber';
import * as THREE from 'three';

// Advanced Glow Material with pulsating effect
class AdvancedGlowMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        c: { value: 0.1 },
        p: { value: 4.5 },
        glowColor: { value: new THREE.Color(0x00ffff) },
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

  update(time: number) {
    this.uniforms.time.value = time;
  }
}

// Enhanced Light Beam Material with animation
class BeamMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        time: { value: 0 },
        height: { value: 0.3 },
      },
      vertexShader: `
        uniform float time;
        uniform float height;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          pos.y += sin(time * 2.0 + position.y * 10.0) * 0.01;
          pos.y *= height;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        varying vec2 vUv;
        void main() {
          float alpha = smoothstep(0.0, 0.2, 1.0 - vUv.y) * smoothstep(1.0, 0.8, 1.0 - vUv.y);
          alpha *= 0.5 + 0.5 * sin(time * 3.0 + vUv.y * 20.0);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }
}

extend({ BeamMaterial });


// Improved Earth Material with dynamic cloud layer
class ImprovedEarthMaterial extends THREE.ShaderMaterial {
  constructor(earthTexture: THREE.Texture, cloudTexture: THREE.Texture) {
    super({
      uniforms: {
        earthTexture: { value: earthTexture },
        cloudTexture: { value: cloudTexture },
        lightColor: { value: new THREE.Color(0xffffff) },
        darkColor: { value: new THREE.Color(0x000000) },
        atmosphereColor: { value: new THREE.Color(0x004080) },
        time: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D earthTexture;
        uniform sampler2D cloudTexture;
        uniform vec3 lightColor;
        uniform vec3 darkColor;
        uniform vec3 atmosphereColor;
        uniform float time;

        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          vec4 texColor = texture2D(earthTexture, vUv);
          vec4 cloudColor = texture2D(cloudTexture, vUv + vec2(time * 0.0001, 0.0));
          float lighting = dot(vNormal, normalize(vec3(1, 1, 1)));
          vec3 color = mix(darkColor, lightColor, texColor.r);
          color *= 0.5 + 0.5 * lighting;
          
          float atmosphere = pow(1.0 - abs(dot(vNormal, vec3(0, 0, 1))), 2.0);
          color += atmosphereColor * atmosphere * 0.3;
          color = mix(color, vec3(1.0), cloudColor.r * 0.3);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
  }

  update(time: number) {
    this.uniforms.time.value = time;
  }
}

extend({ AdvancedGlowMaterial, BeamMaterial, ImprovedEarthMaterial });

// Existing functions with minor improvements

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

export const createBeamGeometry = (height: number, segments: number) => {
  const geometry = new THREE.CylinderGeometry(0.005, 0.005, 1, segments, 1, true);
  geometry.translate(0, 0.5, 0);
  return geometry;
};

export const createBeamMesh = (color: THREE.Color, height: number) => {
  const material = new BeamMaterial();
  material.uniforms.color.value = color;
  material.uniforms.height.value = height;
  const mesh = new THREE.Mesh(createBeamGeometry(height, 16), material);
  return mesh;
};


export const createImprovedEarthMaterial = (earthTexture: THREE.Texture, cloudTexture: THREE.Texture): ImprovedEarthMaterial => {
  return new ImprovedEarthMaterial(earthTexture, cloudTexture);
};

export const interpolateColor = (color1: THREE.Color, color2: THREE.Color, factor: number): THREE.Color => {
  return new THREE.Color().lerpColors(color1, color2, factor);
};

export const normalizeValue = (value: number, min: number, max: number): number => {
  return THREE.MathUtils.clamp((value - min) / (max - min), 0, 1);
};

// New utility functions

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
        float twinkle = sin(time * 5.0 + gl_VertexID) * 0.5 + 0.5;
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