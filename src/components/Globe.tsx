import { useFrame, useThree } from '@react-three/fiber';
import { throttle } from 'lodash';
import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';

import {
  createAdvancedGlowMaterial,
  createImprovedEarthMaterial,
  createAnimatedCloudMaterial,
  animateStarField,
  createDataPoints,
  updateDataPoints,
  createAtmosphereMaterial,
  createGeospatialMaterial,
} from '@/lib/globe-helpers';

import type { HealthEnvironmentData, HealthMetric } from '@/types';

interface GlobeProps {
  healthData: HealthEnvironmentData[];
  displayMetric: HealthMetric;
  onLocationHover: (location: { latitude: number; longitude: number; } | null) => void;
  isInteracting: boolean;
  onZoomChange: (zoom: number) => void;
  onCameraChange: (center: { latitude: number; longitude: number }, zoom: number) => void;
  useDynamicTexture: boolean;
  dynamicTexture: THREE.Texture | null | undefined;

}

const POSITION_DELTA_THRESHOLD = 0.001;
const ZOOM_FACTOR = 5.5;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;

const Globe: React.FC<GlobeProps> = ({ 
  healthData, 
  displayMetric, 
  onLocationHover, 
  isInteracting, 
  onZoomChange,
  onCameraChange,
  useDynamicTexture,
  dynamicTexture
}) => {
  const { scene,} = useThree();
  const globeRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const dataPointsRef = useRef<THREE.InstancedMesh | null>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const starFieldRef = useRef<THREE.Points | null>(null);
  const lastCameraPosition = useRef<THREE.Vector3>(new THREE.Vector3());

  const earthTexture = useMemo(() => new THREE.TextureLoader().load('/earth-dark.jpg', undefined, undefined, (error) => {
    console.error('Error loading earth texture:', error);
  }), []);
  const cloudTexture = useMemo(() => new THREE.TextureLoader().load('/clouds.png'), []);
  const nightTexture = useMemo(() => new THREE.TextureLoader().load('/earth-night.jpg'), []);
  const topologyTexture = useMemo(() => new THREE.TextureLoader().load('/earth-topology.png'), []);

  const earthMaterial = useMemo(() => {
  if (useDynamicTexture && dynamicTexture) {
    return new THREE.MeshBasicMaterial({ map: dynamicTexture });
  }
  return createImprovedEarthMaterial(earthTexture, nightTexture);
  }, [useDynamicTexture, dynamicTexture, earthTexture, nightTexture]);
  
  const cloudMaterial = useMemo(() => createAnimatedCloudMaterial(cloudTexture), [cloudTexture]);
  const atmosphereMaterial = useMemo(() => createAtmosphereMaterial(topologyTexture), [topologyTexture]);
  const geospatialMaterial = useMemo(() => createGeospatialMaterial(healthData, displayMetric), [healthData, displayMetric]);

  const throttledCameraChange = useCallback(
    throttle((center: { latitude: number; longitude: number }, zoom: number) => {
      onCameraChange(center, zoom);
    }, 100),
    [onCameraChange]
  );
  const handleGlobeHover = useCallback((intersects: THREE.Intersection[]) => {
    if (!isInteracting || intersects.length === 0) {
      onLocationHover(null);
      return;
    }
    const { point } = intersects[0];
    const latLon = cartesianToLatLon(point);
    onLocationHover(latLon);
  }, [isInteracting, onLocationHover]);

  useFrame((state, delta) => {
    if (!globeRef.current) return;

    // Animate materials
    if (cloudsRef.current?.material instanceof THREE.ShaderMaterial) {
      const cloudUniforms = cloudsRef.current.material.uniforms;
      if (cloudUniforms && cloudUniforms.time) {
        cloudUniforms.time.value += delta;
      }
    }
    if (atmosphereRef.current?.material instanceof THREE.ShaderMaterial) {
      const atmosphereUniforms = atmosphereRef.current.material.uniforms;
      if (atmosphereUniforms && atmosphereUniforms.time) {
        atmosphereUniforms.time.value += delta;
      }
    }
    if (starFieldRef.current) {
      animateStarField(starFieldRef.current, delta);
    }

    // Rotate the globe slowly only when not using dynamic texture
    if (!useDynamicTexture) {
      globeRef.current.rotation.y += 0.001;
    }

    // Check if camera position has changed significantly
    const cameraPosition = state.camera.position;
    if (cameraPosition.distanceTo(lastCameraPosition.current) > POSITION_DELTA_THRESHOLD) {
      lastCameraPosition.current.copy(cameraPosition);

      const distance = cameraPosition.length();
      onZoomChange(distance);

      // Calculate the point on the globe that the camera is looking at
      const cameraDirection = new THREE.Vector3();
      state.camera.getWorldDirection(cameraDirection);
      const raycaster = new THREE.Raycaster(cameraPosition, cameraDirection);
      const intersects = raycaster.intersectObject(globeRef.current);
      
      if (intersects.length > 0) {
        const intersectionPoint = intersects[0].point;
        const latLon = cartesianToLatLon(intersectionPoint);
        const zoom = calculateZoomLevel(distance);
        throttledCameraChange(latLon, zoom);
      }
    }
  });

  useEffect(() => {
    if (dataPointsRef.current) {
      updateDataPoints(dataPointsRef.current, healthData, displayMetric, null, null);
    } else {
      const points = createDataPoints(healthData, 1, displayMetric);
      dataPointsRef.current = points;
      scene.add(points);
    }

    return () => {
      if (dataPointsRef.current) {
        scene.remove(dataPointsRef.current);
        dataPointsRef.current.geometry.dispose();
        if (dataPointsRef.current.material instanceof THREE.Material) {
          dataPointsRef.current.material.dispose();
        }
      }
    };
  }, [healthData, displayMetric, scene]);

  useEffect(() => {
    return () => {
      // Cleanup Three.js objects
      [earthMaterial, cloudMaterial, atmosphereMaterial, geospatialMaterial].forEach(material => {
        if (material instanceof THREE.Material) {
          material.dispose();
        }
      });
      [earthTexture, cloudTexture, nightTexture, topologyTexture].forEach(texture => {
        if (texture instanceof THREE.Texture) {
          texture.dispose();
        }
      });
    };
  }, [earthMaterial, cloudMaterial, atmosphereMaterial, geospatialMaterial, earthTexture, cloudTexture, nightTexture, topologyTexture]);

  return (
    <>
      <mesh 
        ref={globeRef}
        onPointerMove={(event) => handleGlobeHover(event.intersections)}
      >
        <sphereGeometry args={[1, 64, 64]} />
        {earthMaterial && <primitive object={earthMaterial} attach="material" />}
      </mesh>
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[1.02, 64, 64]} />
        <primitive object={cloudMaterial} attach="material" />
      </mesh>
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[1.1, 64, 64]} />
        <primitive object={atmosphereMaterial} attach="material" />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.15, 64, 64]} />
        <primitive object={createAdvancedGlowMaterial()} attach="material" />
      </mesh>
      {starFieldRef.current && <primitive object={starFieldRef.current} />}
    </>
  );
};

function cartesianToLatLon(position: THREE.Vector3): { latitude: number; longitude: number } {
  const latitude = 90 - (Math.acos(position.y) * 180) / Math.PI;
  const longitude = ((270 + (Math.atan2(position.x, position.z) * 180) / Math.PI) % 360) - 180;
  return { 
    latitude: parseFloat(latitude.toFixed(6)), 
    longitude: parseFloat(longitude.toFixed(6))
  };
}

function calculateZoomLevel(distance: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, parseFloat((ZOOM_FACTOR * Math.log2(10 / distance)).toFixed(2))));
}

export default Globe;

// import { useFrame, useThree } from '@react-three/fiber';
// import { debounce } from 'lodash';
// import RBush from 'rbush';
// import React, { useRef, useMemo, useCallback, useEffect, useState } from 'react';
// import * as THREE from 'three';

// import {
//   createAdvancedGlowMaterial,
//   createImprovedEarthMaterial,
//   createAnimatedCloudMaterial,
//   createStarField,
//   animateStarField,
//   createDataPoints,
//   updateDataPoints,
//   optimizeForMobile,
//   isWebGLAvailable,
//   createAtmosphereMaterial,
//   createGeospatialMaterial,
// } from '@/lib/globe-helpers';

// import type { HealthEnvironmentData, HealthMetric } from '@/types';
// import type { Object3DEventMap, Intersection } from 'three';

// interface GlobeProps {
//   onLocationHover: (location: { latitude: number; longitude: number }) => void;
//   isInteracting: boolean;
//   onZoomChange: (zoom: number) => void;
//   healthData: HealthEnvironmentData[];
//   displayMetric: HealthMetric;
// }

// interface DataPoint {
//   minX: number;
//   minY: number;
//   maxX: number;
//   maxY: number;
//   data: HealthEnvironmentData;
// }

// const INTERACTION_DEBOUNCE_TIME = 200; // ms

// const Globe: React.FC<GlobeProps> = ({ onLocationHover, isInteracting, onZoomChange, healthData, displayMetric }) => {
//   const { scene, camera, gl } = useThree();
//   const globeRef = useRef<THREE.Mesh>(null);
//   const cloudsRef = useRef<THREE.Mesh>(null);
//   const atmosphereRef = useRef<THREE.Mesh>(null);
//   const dataPointsRef = useRef<THREE.InstancedMesh | null>(null);
//   const glowRef = useRef<THREE.Mesh>(null);
//   const starFieldRef = useRef<THREE.Points | null>(null);
//   const [spatialIndex, setSpatialIndex] = useState<RBush<DataPoint> | null>(null);
//   const [visiblePoints, setVisiblePoints] = useState<HealthEnvironmentData[]>([]);
//   const [loading, setLoading] = useState<boolean>(true); // Define the 'loading' state and set its initial value to 'true'
//   const lastHoveredLocation = useRef<{ latitude: number; longitude: number } | null>(null);
  
//   const earthTexture = useMemo(() => new THREE.TextureLoader().load('/earth-dark.jpg'), []);
//   const cloudTexture = useMemo(() => new THREE.TextureLoader().load('/clouds.png'), []);
//   const nightTexture = useMemo(() => new THREE.TextureLoader().load('/earth-night.jpg'), []);
//   const topologyTexture = useMemo(() => new THREE.TextureLoader().load('/earth-topology.png'), []);
  
//   const earthMaterial = useMemo(() => createImprovedEarthMaterial(earthTexture, nightTexture), [earthTexture, nightTexture]);
//   const cloudMaterial = useMemo(() => createAnimatedCloudMaterial(cloudTexture), [cloudTexture]);
//   const atmosphereMaterial = useMemo(() => createAtmosphereMaterial(topologyTexture), [topologyTexture]);
//   const geospatialMaterial = useMemo(() => createGeospatialMaterial(healthData, displayMetric), [healthData, displayMetric]);
  
//   useEffect(() => {
//     if (!isWebGLAvailable()) {
//       console.error("WebGL is not available in this browser");
//     }
//   }, []);
  
//   useEffect(() => {
//     if (healthData.length > 0) {
//       const index = new RBush<DataPoint>();
//       const items = healthData.map((data) => ({
//         minX: data.longitude,
//         minY: data.latitude,
//         maxX: data.longitude,
//         maxY: data.latitude,
//         data: data,
//       }));
//       index.load(items);
//       setSpatialIndex(index);
//       setLoading(false);
//     }
//   }, [healthData]);
  
//   const updateVisiblePoints = useCallback(() => {
//     if (!spatialIndex || !globeRef.current) return;
  
//     const frustum = new THREE.Frustum();
//     frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
  
//     const visibleItems = spatialIndex
//       .search({
//         minX: -180,
//         minY: -90,
//         maxX: 180,
//         maxY: 90,
//       })
//       .filter((item) => {
//         const point = new THREE.Vector3().setFromSpherical(
//           new THREE.Spherical(1, (90 - item.data.latitude) * Math.PI / 180, item.data.longitude * Math.PI / 180)
//         );
//         return frustum.containsPoint(point);
//       });
  
//     setVisiblePoints(visibleItems.map((item) => item.data));
//   }, [spatialIndex, camera]);
  
//   const debouncedUpdateVisiblePoints = useMemo(
//     () => debounce(updateVisiblePoints, INTERACTION_DEBOUNCE_TIME),
//     [updateVisiblePoints]
//   );

//   useFrame((_, delta) => {
//     if (isInteracting) {
//       debouncedUpdateVisiblePoints();
//     }
//     if (starFieldRef.current) {
//       animateStarField(starFieldRef.current, delta);
//     }
//     if (cloudsRef.current) {
//       const cloudMaterial = cloudsRef.current.material as THREE.ShaderMaterial;
//       if (cloudMaterial.uniforms.time) {
//         cloudMaterial.uniforms.time.value += delta;
//       }
//     }
//     if (atmosphereRef.current) {
//       const atmosphereMaterial = atmosphereRef.current.material as THREE.ShaderMaterial;
//       if (atmosphereMaterial.uniforms.time) {
//         atmosphereMaterial.uniforms.time.value += delta;
//       }
//     }

//     if (globeRef.current) {
//       globeRef.current.rotation.y += 0.001;
//     }

//     const LOD_LEVELS = [
//       { distance: 5, detail: 64 },
//       { distance: 10, detail: 32 },
//       { distance: 20, detail: 16 },
//     ];

//     const distance = camera.position.length();
//     const level = LOD_LEVELS.find((l) => distance <= l.distance) || LOD_LEVELS[LOD_LEVELS.length - 1];
//     if (globeRef.current && globeRef.current.geometry instanceof THREE.SphereGeometry) {
//       const currentDetail = globeRef.current.geometry.parameters.widthSegments;
//       if (currentDetail !== level.detail) {
//         globeRef.current.geometry.dispose();
//         globeRef.current.geometry = new THREE.SphereGeometry(1, level.detail, level.detail);
//       }
//     }

//     onZoomChange(distance);
//   });

//   useEffect(() => {
//     if (!loading && healthData.length > 0 && spatialIndex) {
//       const points = createDataPoints(healthData, 1, displayMetric);
//       dataPointsRef.current = points;
//       scene.add(points);
//     }
//     return () => {
//       if (dataPointsRef.current) {
//         scene.remove(dataPointsRef.current);
//       }
//     };
//   }, [loading, healthData, displayMetric, scene, spatialIndex]);

//   useEffect(() => {
//     if (dataPointsRef.current && spatialIndex) {
//       updateDataPoints(dataPointsRef.current, visiblePoints, displayMetric, null, null);
//     }
//   }, [visiblePoints, displayMetric, spatialIndex]);

//   useEffect(() => {
//     const stars = createStarField(10000, 64);
//     starFieldRef.current = stars;
//     scene.add(stars);
//     return () => {
//       scene.remove(stars);
//       stars.geometry.dispose();
//       if (stars.material instanceof THREE.Material) {
//         stars.material.dispose();
//       }
//     };
//   }, [scene]);

//   useEffect(() => {
//     optimizeForMobile(gl);
//   }, [gl]);

//   const handleGlobeHover = useCallback(
//     (event: Intersection<THREE.Object3D<Object3DEventMap>>) => {
//       if (!isInteracting) return;

//       const { point } = event;
//       const latLon = pointToLatLon(point);

//       if (!lastHoveredLocation.current ||
//         Math.abs(latLon.latitude - lastHoveredLocation.current.latitude) > 0.1 ||
//         Math.abs(latLon.longitude - lastHoveredLocation.current.longitude) > 0.1) {
//         lastHoveredLocation.current = latLon;
//         onLocationHover(latLon);
//       }
//     },
//     [isInteracting, onLocationHover]
//   );

//   const debouncedHandleGlobeHover = useMemo(
//     () => debounce(handleGlobeHover, INTERACTION_DEBOUNCE_TIME),
//     [handleGlobeHover]
//   );

//   const pointToLatLon = (point: THREE.Vector3): { latitude: number; longitude: number } => {
//     const lat = 90 - (Math.acos(point.y) * 180) / Math.PI;
//     const lon = ((270 + (Math.atan2(point.x, point.z) * 180) / Math.PI) % 360) - 180;
//     return { latitude: lat, longitude: lon };
//   };

//   return (
//     <>
//       <mesh ref={globeRef} onPointerMove={(event) => event.intersections[0] && debouncedHandleGlobeHover(event.intersections[0])}>
//         <sphereGeometry args={[1, 64, 64]} />
//         <primitive object={earthMaterial} attach="material" />
//       </mesh>
//       <mesh>
//         <sphereGeometry args={[1.001, 64, 64]} />
//         <primitive object={geospatialMaterial} attach="material" />
//       </mesh>
//       <mesh ref={cloudsRef}>
//         <sphereGeometry args={[1.02, 64, 64]} />
//         <primitive object={cloudMaterial} attach="material" />
//       </mesh>
//       <mesh ref={atmosphereRef}>
//         <sphereGeometry args={[1.1, 64, 64]} />
//         <primitive object={atmosphereMaterial} attach="material" />
//       </mesh>
//       {!loading && dataPointsRef.current && <primitive object={dataPointsRef.current} />}
//       <mesh ref={glowRef}>
//         <sphereGeometry args={[1.15, 64, 64]} />
//         <primitive object={createAdvancedGlowMaterial()} attach="material" />
//       </mesh>
//       {starFieldRef.current && <primitive object={starFieldRef.current} />}
//     </>
//   );
// };


// export default React.memo(Globe);






// on our previous conversation i need to correct an edge case where whe we hover it keep rerendering the location but i need to correct that error so that i shoud only
// rerender the location when the mouse is moved to another location and also i need to add a debounce to the interaction so that it should not keep rerendering when the mouse is moved to another location 
// and also i need to add a caching mechanism for frequently visited locations so that it should not keep rerendering the location when the mouse is moved to another location 
// and also i need to optimize the rendering of data points so that it should not keep rerendering the location when the mouse is moved to another location and also i need to add a debounce to the interaction so that it should not keep rerendering when the mouse is moved to another location
// and also i need to add a caching mechanism for frequently visited locations so that it should not keep rerendering the location when the mouse is moved to another location 
// and also i need to optimize the rendering of data points so that it should not keep rerendering the location when the mouse is moved to another location and also i need to add a debounce to the interaction so that it should not keep rerendering when the mouse is moved to another location
// and also give the redis caching big data render like the country and state or big regions so we are not rerender city, state, countyr, continent, etc, also we will begin at the user current location 
// and go from there so they know where they are at all times and also i need to add a caching mechanism for frequently visited locations so that it should not keep rerendering the location when the mouse is moved to another location

// I need all edge case that occur in 3d rendering that effect the user experience or causes crashes or bugs in the application / interface.We should never have those if we disretiube correctly 
// and utlize the best practices for the 3d rendering and also i need to add a caching mechanism for frequently visited locations so that it should not keep rerendering the location when the mouse is moved to another location
// and also i need to optimize the rendering of data points so that it should not keep rerendering the location when the mouse is moved to another location and also i need to add a debounce to the interaction so that it should not keep rerendering when the mouse is moved to another location


// So you pretty much staid below: 

// Based on the complete flow you've provided and the requirements you've mentioned, here's an optimized approach for the Globe component that addresses the issues of continuous rendering during rotation and excessive re-rendering of locations:

// Add a debounce mechanism for interaction:
// Implement caching for frequently visited locations:
// Optimize the rendering of data points:

// Here's the updated Globe component incorporating these optimizations:

// But you got cut off below: 


// import { useFrame, useThree } from '@react-three/fiber';
// import RBush from 'rbush';
// import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
// import * as THREE from 'three';
// import { debounce } from 'lodash';

// import {
//   createAdvancedGlowMaterial,
//   createImprovedEarthMaterial,
//   createStarField,
//   animateStarField,
//   createDataPoints,
//   updateDataPoints,
//   optimizeForMobile,
//   isWebGLAvailable,
// } from '@/lib/globe-helpers';

// import type { HealthEnvironmentData } from '@/types';
// import type { Object3DEventMap, Intersection } from 'three';
// import { only } from 'node:test';

// interface GlobeProps {
//   displayMetric: keyof HealthEnvironmentData;
//   onZoomChange: (zoom: number) => void;
//   healthData: HealthEnvironmentData[];
//   isLoading: boolean;
//   onPointSelect: (data: HealthEnvironmentData | null) => void;
//   onLocationHover: (lat: number, lon: number) => void;
//   isInteracting: boolean;
//   onInteractionStart: () => void;
//   onInteractionEnd: () => void;
// }

// interface DataPoint {
//   minX: number;
//   minY: number;
//   maxX: number;
//   maxY: number;
//   data: HealthEnvironmentData;
// }

// const Globe: React.FC<GlobeProps> = ({ 
//   displayMetric, 
//   onZoomChange, 
//   healthData, 
//   isLoading,
//   onPointSelect,
//   onLocationHover,
//   isInteracting,
//   onInteractionStart,
//   onInteractionEnd
// }) => {
//   const { scene, camera, raycaster, mouse, gl } = useThree();
//   const globeRef = useRef<THREE.Mesh>(null);
//   const dataPointsRef = useRef<THREE.InstancedMesh>();
//   const glowRef = useRef<THREE.Mesh | null>(null);
//   const starFieldRef = useRef<THREE.Points | null>(null);
//   const [spatialIndex, setSpatialIndex] = useState<RBush<DataPoint> | null>(null);
//   const [visiblePoints, setVisiblePoints] = useState<HealthEnvironmentData[]>([]);
//   const [hoveredPoint, setHoveredPoint] = useState<HealthEnvironmentData | null>(null);
//   const [selectedPoint, setSelectedPoint] = useState<HealthEnvironmentData | null>(null);
//   const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const locationCache = useRef<Map<string, HealthEnvironmentData>>(new Map());

//   const earthTexture = useMemo(() => new THREE.TextureLoader().load('/earth-dark.jpg'), []);
//   const cloudTexture = useMemo(() => new THREE.TextureLoader().load('/earth-topology.png'), []);
//   const earthMaterial = useMemo(() => createImprovedEarthMaterial(earthTexture, cloudTexture), [earthTexture, cloudTexture]);

//   useEffect(() => {
//     if (healthData.length > 0) {
//       const index = new RBush<DataPoint>();
//       const items = healthData.map(data => ({
//         minX: data.longitude,
//         minY: data.latitude,
//         maxX: data.longitude,
//         maxY: data.latitude,
//         data: data
//       }));
//       index.loa

//       But i wanted to remind you that debaounce is used in helper so if you apply debounce to a function that uses the helper it will have debounce already if not feel free to apply. 


//       her eis globes parent component 'src/components/EnhancedGlobeVisualization.tsx" ': 
//       import { OrbitControls, Stars } from '@react-three/drei';
// import { Canvas } from '@react-three/fiber';
// import dynamic from 'next/dynamic';
// import React, { useEffect, useState, useCallback, useRef } from 'react';

// import { initializeGeoData, getLocationInfo, findNearestHealthDataPoint } from '@/lib/helpers';

// import type { HealthEnvironmentData } from '@/types';
// import type { OrbitControlsChangeEvent } from '@react-three/drei';

// interface EnhancedGlobeVisualizationProps {
//   displayMetric: keyof HealthEnvironmentData;
//   onZoomChange: (zoom: number) => void;
//   healthData: HealthEnvironmentData[];
//   isLoading: boolean;
//   onPointSelect: (data: HealthEnvironmentData | null) => void;
//   onLocationHover: (locationInfo: { name: string; country: string } | null) => void;
// }

// const Globe = dynamic(() => import('./Globe'), { ssr: false });

// const EnhancedGlobeVisualization: React.FC<EnhancedGlobeVisualizationProps> = ({
//   displayMetric,
//   onZoomChange,
//   healthData,
//   isLoading,
//   onPointSelect,
//   onLocationHover
// }) => {
//   const [error, setError] = useState<string | null>(null);
//   const [isGeoDataLoading, setIsGeoDataLoading] = useState(true);
//   const lastHoveredPointRef = useRef<HealthEnvironmentData | null>(null);
//   const [locationInfo, setLocationInfo] = useState<{ name: string; country: string } | null>(null);
//   const [isInteracting, setIsInteracting] = useState(false);

//   useEffect(() => {
//     const loadData = async (): Promise<void> => {
//       try {
//         await initializeGeoData();
//         setIsGeoDataLoading(false);
//       } catch (err) {
//         console.error('Failed to initialize geo data:', err);
//         setError('Failed to load geographical data. Please refresh the page.');
//         setIsGeoDataLoading(false);
//       }
//     };
//     loadData();
//   }, []);

//   const handleZoomChange = useCallback((zoom: number) => {
//     onZoomChange(zoom);
//   }, [onZoomChange]);

//   const handlePointSelect = useCallback((data: HealthEnvironmentData | null) => {
//     onPointSelect(data);
//   }, [onPointSelect]);

//   const getDistance = useCallback((point1: HealthEnvironmentData, point2: HealthEnvironmentData): number => {
//     const lat1 = point1.latitude;
//     const lon1 = point1.longitude;
//     const lat2 = point2.latitude;
//     const lon2 = point2.longitude;
//     const R = 6371; // Radius of the earth in km
//     const dLat = (lat2 - lat1) * (Math.PI / 180);
//     const dLon = (lon2 - lon1) * (Math.PI / 180);
//     const a =
//       0.5 -
//       Math.cos(dLat) / 2 +
//       (Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * (1 - Math.cos(dLon))) / 2;
//     return R * 2 * Math.asin(Math.sqrt(a));
//   }, []);

//   const handleLocationHover = useCallback(async (lat: number, lon: number) => {
//     if (!isInteracting) return;

//     try {
//       const [locationData, nearestPoint] = await Promise.all([
//         getLocationInfo(lat, lon),
//         findNearestHealthDataPoint(lat, lon, healthData)
//       ]);

//       const { country, city, continent } = locationData || {};
//       const name = `${city}, ${country ?? ''}, ${continent}`;
//       setLocationInfo({ name, country: country ?? '' });

//       const threshold = 0.1; // 100 meters, adjust as needed

//       if (nearestPoint && (!lastHoveredPointRef.current || getDistance(lastHoveredPointRef.current, nearestPoint) > threshold)) {
//         lastHoveredPointRef.current = nearestPoint;
//         handlePointSelect(nearestPoint);
//       }
//     } catch (error) {
//       console.error('Error fetching location info:', error);
//       setLocationInfo(null);
//     }
//   }, [healthData, handlePointSelect, getDistance, isInteracting]);

//   useEffect(() => {
//     onLocationHover(locationInfo);
//   }, [locationInfo, onLocationHover]);

//   const handleInteractionStart = useCallback(() => {
//     setIsInteracting(true);
//   }, []);

//   const handleInteractionEnd = useCallback(() => {
//     setIsInteracting(false);
//     setLocationInfo(null);
//     lastHoveredPointRef.current = null;
//     onLocationHover(null);
//     onPointSelect(null);
//   }, [onLocationHover, onPointSelect]);

//   if (error) {
//     return <div>{error}</div>;
//   }

//   if (isGeoDataLoading) {
//     return <div>Initializing geographical data...</div>;
//   }

//   return (
//     <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
//       <OrbitControls
//         enableZoom={true}
//         enablePan={false}
//         enableRotate={true}
//         onChange={(e?: OrbitControlsChangeEvent | undefined) => handleZoomChange(e?.target?.object?.position?.z ?? 0)}
//         onStart={handleInteractionStart}
//         onEnd={handleInteractionEnd}
//       />
//       <Stars />
//       <ambientLight intensity={0.2} />
//       <pointLight position={[10, 10, 10]} intensity={0.7} />
//       <Globe
//         displayMetric={displayMetric}
//         onZoomChange={handleZoomChange}
//         healthData={healthData}
//         isLoading={isLoading}
//         onPointSelect={handlePointSelect}
//         onLocationHover={handleLocationHover}
//         isInteracting={isInteracting}
//         onInteractionStart={handleInteractionStart}
//         onInteractionEnd={handleInteractionEnd}
//       />
//     </Canvas>
//   );
// };

//       export default EnhancedGlobeVisualization;

//       : and here is the glob components grand parent also the enhancment parent src / components / AnimatedGlobe.tsx: 

//       import { Box, CircularProgress, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
// import { motion } from 'framer-motion';
// import dynamic from 'next/dynamic';
// import React, { useState, useCallback } from 'react';

// import GlobeErrorBoundary from './GlobeErrorBoundary';

// import type { HealthEnvironmentData, HealthMetric } from '@/types';
// import type { SelectChangeEvent } from '@mui/material';

// const EnhancedGlobeVisualization = dynamic(() => import('./EnhancedGlobeVisualization'), {
//   ssr: false,
//   loading: () => <CircularProgress />
// });

// interface AnimatedGlobeProps {
//   healthData: HealthEnvironmentData[];
//   selectedMetrics: HealthMetric[];
//   onZoomChange: (zoom: number) => void;
//   isLoading: boolean;
// }

// const AnimatedGlobe: React.FC<AnimatedGlobeProps> = ({
//   healthData,
//   selectedMetrics,
//   onZoomChange,
//   isLoading
// }) => {
//   const [displayMetric, setDisplayMetric] = useState<HealthMetric>('environmentalImpactScore');
//   const [selectedPoint, setSelectedPoint] = useState<HealthEnvironmentData | null>(null);
//   const [hoveredLocation, setHoveredLocation] = useState<{ name: string; country: string } | null>(null);
//   const [isInteracting, setIsInteracting] = useState(false);

//   const handleMetricChange = useCallback((event: SelectChangeEvent<HealthMetric>) => {
//     setDisplayMetric(event.target.value as HealthMetric);
//   }, []);

//   const handlePointSelect = useCallback((data: HealthEnvironmentData | null) => {
//     setSelectedPoint(data);
//   }, []);

//   const handleLocationHover = useCallback((locationInfo: { name: string; country: string } | null) => {
//     setHoveredLocation(locationInfo);
//   }, []);

//   const handleZoomChange = useCallback((zoom: number) => {
//     onZoomChange(zoom);
//   }, [onZoomChange]);

//   const handleInteractionStart = useCallback(() => {
//     setIsInteracting(true);
//   }, []);

//   const handleInteractionEnd = useCallback(() => {
//     setIsInteracting(false);
//     setHoveredLocation(null);
//   }, []);

//   return (
//     <motion.div
//       initial={{ opacity: 0, scale: 0.5 }}
//       animate={{ opacity: 1, scale: 1 }}
//       transition={{ duration: 0.5 }}
//       style={{ height: '100%', width: '100%' }}
//     >
//       <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
//         <InputLabel id="metric-select-label">Select Metric</InputLabel>
//         <Select
//           labelId="metric-select-label"
//           value={displayMetric}
//           onChange={handleMetricChange}
//           label="Select Metric"
//         >
//           {selectedMetrics.map((metric) => (
//             <MenuItem key={metric} value={metric}>
//               {metric.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
//             </MenuItem>
//           ))}
//         </Select>
//       </FormControl>
//       <Box sx={{ height: 'calc(100% - 80px)', width: '100%', position: 'relative' }}>
//         <GlobeErrorBoundary>
//           <EnhancedGlobeVisualization
//             healthData={healthData}
//             displayMetric={displayMetric}
//             onZoomChange={handleZoomChange}
//             isLoading={isLoading}
//             onPointSelect={handlePointSelect}
//             onLocationHover={handleLocationHover}
//             isInteracting={isInteracting}
//             onInteractionStart={handleInteractionStart}
//             onInteractionEnd={handleInteractionEnd}
//           />
//         </GlobeErrorBoundary>
//       </Box>
//       {selectedPoint && (
//         <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
//           <Typography variant="h6">Selected Point</Typography>
//           <Typography>Date: {new Date(selectedPoint.timestamp).toLocaleString()}</Typography>
//           <Typography>Score: {selectedPoint[displayMetric]}</Typography>
//         </Box>
//       )}
//       {hoveredLocation && (
//         <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
//           <Typography variant="h6">Hovered Location</Typography>
//           <Typography>{hoveredLocation.name}</Typography>
//           <Typography>Country: {hoveredLocation.country}</Typography>
//         </Box>
//       )}
//     </motion.div>
//   );
// };

// export default AnimatedGlobe;

// : and ifnally here is the great grand parent of the globe components src / pages / globescreen.tsx:


//       import { Refresh } from '@mui/icons-material';
// import {
//   Box,
//   Typography,
//   Button,
//   Paper,
//   useTheme,
//   useMediaQuery,
//   Grid,
//   CircularProgress,
// } from '@mui/material';
// import dynamic from 'next/dynamic';
// import React, { useState, useCallback, useRef, useEffect } from 'react';

// import HealthDataSummary from '@/components/HealthDataSummary';
// import HealthTrendChart from '@/components/HealthTrendChart';
// import { useAuth } from '@/context/AuthContext';
// import { withAuth } from '@/context/withAuth';
// import { useHealth } from '@/services/HealthContext';

// import type { HealthTrendChartRef } from '@/components/HealthTrendChart';
// import type { HealthEnvironmentData, HealthMetric } from '@/types';
// import type { NextPage } from 'next';

// const AnimatedGlobe = dynamic(() => import('@/components/AnimatedGlobe'), { ssr: false });

// const GlobePage: NextPage = () => {
//   const { healthData, visibleData, loading, error, fetchHealthData, setZoom } = useHealth();
//   const { user } = useAuth();
//   const theme = useTheme();
//   const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
//   const [selectedMetrics, setSelectedMetrics] = useState<HealthMetric[]>(['cardioHealthScore', 'respiratoryHealthScore', 'environmentalImpactScore']);
//   const chartRef = useRef<HealthTrendChartRef>(null);
//   const [isInitialLoad, setIsInitialLoad] = useState(healthData.length === 0);

//   useEffect(() => {
//     if (healthData.length > 0) {
//       setIsInitialLoad(false);
//     }
//   }, [healthData]);

//   const handleZoomChange = useCallback((zoom: number) => {
//     setZoom(zoom);
//   }, [setZoom]);

//   const handleRefresh = useCallback(async () => {
//     await fetchHealthData(1);
//     if (chartRef.current && chartRef.current.refreshData) {
//       chartRef.current.refreshData();
//     }
//   }, [fetchHealthData]);

//   const handleHealthTrendDataUpdate = useCallback((data: HealthEnvironmentData[], metrics: HealthMetric[]) => {
//     setSelectedMetrics(metrics);
//   }, []);

//   if (!user) {
//     return null;
//   }

//   return (
//     <Box component="main" sx={{ 
//       minHeight: '100vh', 
//       height: '100%',
//       overflow: 'auto', 
//       display: 'flex', 
//       flexDirection: 'column', 
//       bgcolor: 'black', 
//       p: 2,
//       '& .MuiPaper-root': { bgcolor: 'rgba(255,255,255,0.1)' },
//       '& .MuiTypography-root': { color: 'white' },
//       '& .MuiTableCell-root': { color: 'white' },
//     }}>
//       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//         <Typography variant="h4">Your Health Globe</Typography>
//         <Button 
//           variant="contained" 
//           onClick={handleRefresh} 
//           startIcon={<Refresh />}
//           disabled={loading}
//         >
//           {loading ? 'Refreshing...' : 'Refresh Data'}
//         </Button>
//       </Box>

//       {error && (
//         <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.main' }}>
//           <Typography color="error">Error: {error}</Typography>
//         </Paper>
//       )}

//       <Grid container spacing={3}>
//         <Grid item xs={12} md={8}>
//           <Box sx={{ height: '60vh', minHeight: '400px' }}>
//             {isInitialLoad ? (
//               <CircularProgress />
//             ) : (
//               <AnimatedGlobe 
//                 healthData={visibleData}
//                 selectedMetrics={selectedMetrics}
//                 onZoomChange={handleZoomChange}
//                 isLoading={loading}
//               />
//             )}
//           </Box>
//         </Grid>
//         <Grid item xs={12} md={4}>
//           <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
//             <HealthTrendChart 
//               ref={chartRef}
//               onDataUpdate={handleHealthTrendDataUpdate} 
//             />
//           </Paper>
//         </Grid>
//       </Grid>

//       <Paper sx={{ p: 2, borderRadius: 2, mt: 3, overflow: 'auto' }}>
//         <Typography variant="h6" gutterBottom>Health Data Summary</Typography>
//         <HealthDataSummary 
//           healthData={healthData}
//           isMobile={isMobile}
//           isInitialLoad={isInitialLoad}
//         />
//       </Paper>
//     </Box>
//   );
// };

// export default withAuth(GlobePage);