// src/lib/globe-helpers.ts

import { extend } from '@react-three/fiber';
import * as THREE from 'three';

class GlowMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        c: { value: 0.1 },
        p: { value: 4.5 },
        glowColor: { value: new THREE.Color(0x00ffff) },
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
        varying vec3 vNormal;
        void main() {
          float intensity = pow(c - dot(vNormal, vec3(0.0, 0.0, 1.0)), p);
          gl_FragColor = vec4(glowColor, intensity);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
  }
}

class LightBeamMaterial extends THREE.ShaderMaterial {
  constructor(color: THREE.Color) {
    super({
      uniforms: {
        color: { value: color },
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
        uniform vec3 color;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(color, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
  }
}

class CustomEarthMaterial extends THREE.ShaderMaterial {
  constructor(texture: THREE.Texture) {
    super({
      uniforms: {
        earthTexture: { value: texture },
        lightColor: { value: new THREE.Color(0xffffff) },
        darkColor: { value: new THREE.Color(0x000000) },
        atmosphereColor: { value: new THREE.Color(0x004080) },
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
        uniform vec3 lightColor;
        uniform vec3 darkColor;
        uniform vec3 atmosphereColor;

        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          vec4 texColor = texture2D(earthTexture, vUv);
          float lighting = dot(vNormal, normalize(vec3(1, 1, 1)));
          vec3 color = mix(darkColor, lightColor, texColor.r);
          color *= 0.5 + 0.5 * lighting;
          
          // Add atmosphere effect
          float atmosphere = pow(1.0 - abs(dot(vNormal, vec3(0, 0, 1))), 2.0);
          color += atmosphereColor * atmosphere * 0.3;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
  }
}

extend({ GlowMaterial, LightBeamMaterial, CustomEarthMaterial });

export const latLongToVector3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
};

export const getColorFromScore = (score: number): THREE.Color => {
  const normalizedScore = (score - 0) / (100 - 0); // Inline normalization
  const lowColor = new THREE.Color(0xff0000);
  const midColor = new THREE.Color(0xffff00);
  const highColor = new THREE.Color(0x00ff00);

  if (normalizedScore < 0.5) {
    return lowColor.lerp(midColor, normalizedScore * 2);
  } else {
    return midColor.lerp(highColor, (normalizedScore - 0.5) * 2);
  }
};

export const createGlowMaterial = (): THREE.ShaderMaterial => {
  return new THREE.ShaderMaterial({
    uniforms: {
      c: { value: 0.1 },
      p: { value: 4.5 },
      glowColor: { value: new THREE.Color(0x00ffff) },
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
      varying vec3 vNormal;
      void main() {
        float intensity = pow(c - dot(vNormal, vec3(0.0, 0.0, 1.0)), p);
        gl_FragColor = vec4(glowColor, intensity);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
  });
};

export const createLightBeam = (position: THREE.Vector3, color: THREE.Color): THREE.Mesh => {
  const geometry = new THREE.CylinderGeometry(0.005, 0.005, 0.3, 16, 1, true);
  geometry.translate(0, 0.15, 0);
  geometry.rotateX(Math.PI / 2);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: color },
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
        gl_FragColor = vec4(color, 1.0) * intensity;
      }
    `,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });

  const beam = new THREE.Mesh(geometry, material);
  beam.position.copy(position);

  const direction = position.clone().normalize();
  beam.lookAt(position.clone().add(direction));

  return beam;
};

export const createCustomEarthMaterial = (texture: THREE.Texture): THREE.ShaderMaterial => {
  return new THREE.ShaderMaterial({
    uniforms: {
      earthTexture: { value: texture },
      lightColor: { value: new THREE.Color(0xffffff) },
      darkColor: { value: new THREE.Color(0x000000) },
      atmosphereColor: { value: new THREE.Color(0x004080) },
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
      uniform vec3 lightColor;
      uniform vec3 darkColor;
      uniform vec3 atmosphereColor;

      varying vec2 vUv;
      varying vec3 vNormal;

      void main() {
        vec4 texColor = texture2D(earthTexture, vUv);
        float lighting = dot(vNormal, normalize(vec3(1, 1, 1)));
        vec3 color = mix(darkColor, lightColor, texColor.r);
        color *= 0.5 + 0.5 * lighting;

        float atmosphere = pow(1.0 - abs(dot(vNormal, vec3(0, 0, 1))), 2.0);
        color += atmosphereColor * atmosphere * 0.3;

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
};

export const interpolateColor = (color1: THREE.Color, color2: THREE.Color, factor: number): THREE.Color => {
  const result = new THREE.Color();
  result.r = color1.r + factor * (color2.r - color1.r);
  result.g = color1.g + factor * (color2.g - color1.g);
  result.b = color1.b + factor * (color2.b - color1.b);
  return result;
};

export const normalizeValue = (value: number, min: number, max: number): number => {
  return (value - min) / (max - min);
};
