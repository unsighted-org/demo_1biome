import { OrbitControls, Stars } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect, useState, useCallback, useRef } from 'react';


import { initializeGeoData, getRegionInfo, findNearestHealthDataPoint, geoDistance } from '@/lib/helpers';
import { useHealth } from '@/services/HealthContext';

import DynamicEarthTexture from './DynamicEarthTexture';
import Globe from './Globe';

import type { HealthEnvironmentData, HealthMetric } from '@/types';
import type { OrbitControlsChangeEvent } from '@react-three/drei';
import type * as THREE from 'three'; // Add this line

interface EnhancedGlobeVisualizationProps {
  onPointSelect: (point: HealthEnvironmentData | null) => void;
  onLocationHover: (location: { name: string; country: string; state: string; continent: string } | null) => void;
}

const ZOOM_THRESHOLD = 2;

const EnhancedGlobeVisualization: React.FC<EnhancedGlobeVisualizationProps> = ({ onPointSelect, onLocationHover }) => {
  const { onZoomChange, healthData, displayMetric } = useHealth();
  const [error, setError] = useState<string | null>(null);
  const [isGeoDataLoading, setIsGeoDataLoading] = useState(true);
  const lastHoveredPointRef = useRef<HealthEnvironmentData | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [mapZoom, setMapZoom] = useState(2);
  const [mapCenter, setMapCenter] = useState({ latitude: 0, longitude: 0 });
  const [dynamicTexture, setDynamicTexture] = useState<THREE.Texture | null>(null);
  const typedHealthData: HealthEnvironmentData[] = healthData;
  const typedDisplayMetric: HealthMetric = displayMetric;


  const handleTextureReady = useCallback((texture: THREE.Texture) => {
    setDynamicTexture(texture);
  }, []);

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        await initializeGeoData();
        setIsGeoDataLoading(false);
      } catch (err) {
        console.error('Failed to initialize geo data:', err);
        setError('Failed to load geographical data. Please refresh the page.');
        setIsGeoDataLoading(false);
      }
    };
    loadData();
  }, []);

  const handleZoomChange = useCallback((zoom: number) => {
    onZoomChange(zoom);
    setIsZoomedIn(zoom > ZOOM_THRESHOLD); // Note the change from < to >
  }, [onZoomChange]);

  const handleCameraChange = useCallback((center: { latitude: number; longitude: number }, zoom: number) => {
    const { latitude, longitude } = center;
    setMapCenter({ latitude, longitude });
    setMapZoom(zoom);
  }, []);

  const handleLocationHover = useCallback((location: { latitude: number; longitude: number; } | null) => {
  if (!isInteracting || !location) {
    onLocationHover(null);
    return;
  }
  
  const { latitude, longitude } = location;
  getRegionInfo(latitude, longitude)
    .then(regionInfo => {
      const { country, city, state, continent } = regionInfo;
      const name = `${city}, ${state}, ${country}, ${continent}`;
      onLocationHover({ name, country, state, continent });
      return findNearestHealthDataPoint(latitude, longitude, healthData);
    })
    .then(nearestPoint => {
      if (nearestPoint && (!lastHoveredPointRef.current || geoDistance([lastHoveredPointRef.current.latitude, lastHoveredPointRef.current.longitude], [nearestPoint.latitude, nearestPoint.longitude]) > 0.1)) {
        lastHoveredPointRef.current = nearestPoint;
        onPointSelect(nearestPoint);
      }
    }) 
    .catch(error => {
      console.error('Error fetching location info:', error);
      onLocationHover(null);
    });
}, [healthData, onPointSelect, isInteracting, onLocationHover]);

  const handleInteractionStart = useCallback(() => {
    setIsInteracting(true);
  }, []);

  const handleInteractionEnd = useCallback(() => {
    setIsInteracting(false);
    onLocationHover(null);
    lastHoveredPointRef.current = null;
    onPointSelect(null);
  }, [onLocationHover, onPointSelect]);

  if (error) {
    return <div>{error}</div>;
  }

  if (isGeoDataLoading) {
    return <div>Initializing geographical data...</div>;
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          enableRotate={true}
          onChange={(e?: OrbitControlsChangeEvent | undefined) => handleZoomChange(e?.target?.object?.position?.z ?? 0)}
          onStart={handleInteractionStart}
          onEnd={handleInteractionEnd}
        />
        <Stars />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.7} />
        <Globe
          onLocationHover={handleLocationHover}
          isInteracting={isInteracting}
          healthData={healthData}
          onZoomChange={handleZoomChange}
          onCameraChange={handleCameraChange}
          displayMetric={displayMetric}
          useDynamicTexture={isZoomedIn}
          dynamicTexture={dynamicTexture}
        />
      </Canvas>
      <AnimatePresence>
      {isZoomedIn && (
        <motion.div
          className="geospatial-chart-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="map-container">
            <DynamicEarthTexture
              data={typedHealthData}
              metric={typedDisplayMetric}
              center={mapCenter}
              zoom={mapZoom}
              onTextureReady={handleTextureReady}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
};

export default EnhancedGlobeVisualization;



// import { OrbitControls, Stars } from '@react-three/drei';
// import { Canvas } from '@react-three/fiber';
// import dynamic from 'next/dynamic';
// import React, { useEffect, useState, useCallback, useRef } from 'react';


// import { initializeGeoData, getRegionInfo, findNearestHealthDataPoint, geoDistance } from '@/lib/helpers';
// import { useHealth } from '@/services/HealthContext';

// import GeospatialChart from './GeospatialChart';

// import type { HealthEnvironmentData } from '@/types';
// import type { OrbitControlsChangeEvent } from '@react-three/drei';


// const Globe = dynamic(() => import('./Globe'), { ssr: false });

// interface EnhancedGlobeVisualizationProps {
//   onPointSelect: (point: HealthEnvironmentData | null) => void;
//   onLocationHover: (location: { name: string; country: string; state: string; continent: string } | null) => void;
// }

// const EnhancedGlobeVisualization: React.FC<EnhancedGlobeVisualizationProps> = ({ onPointSelect, onLocationHover }) => {
//   const { onZoomChange, healthData, displayMetric } = useHealth();
//   const [error, setError] = useState<string | null>(null);
//   const [isGeoDataLoading, setIsGeoDataLoading] = useState(true);
//   const lastHoveredPointRef = useRef<HealthEnvironmentData | null>(null);
//   const [isInteracting, setIsInteracting] = useState(false);
//   const [isZoomedIn, setIsZoomedIn] = useState(false);

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
//     setIsZoomedIn(zoom < 2); // Adjust threshold as needed
//   }, [onZoomChange]);

//   const handleLocationHover = useCallback(async (location: { latitude: number; longitude: number }) => {
//     if (!isInteracting) return;
//     const { latitude, longitude } = location;
//     try {
//       const [regionInfo, nearestPoint] = await Promise.all([
//         getRegionInfo(latitude, longitude),
//         findNearestHealthDataPoint(latitude, longitude, healthData)
//       ]);
//       const { country, city, state, continent } = regionInfo;
//       const name = `${city}, ${state}, ${country}, ${continent}`;
//       onLocationHover({ name, country, state, continent });
//       if (nearestPoint && (!lastHoveredPointRef.current || geoDistance([lastHoveredPointRef.current.latitude, lastHoveredPointRef.current.longitude], [nearestPoint.latitude, nearestPoint.longitude]) > 0.1)) {
//         lastHoveredPointRef.current = nearestPoint;
//         onPointSelect(nearestPoint);
//       }
//     } catch (error) {
//       console.error('Error fetching location info:', error);
//       onLocationHover(null);
//     }
//   }, [healthData, onPointSelect, isInteracting, onLocationHover]);

//   const handleInteractionStart = useCallback(() => {
//     setIsInteracting(true);
//   }, []);

//   const handleInteractionEnd = useCallback(() => {
//     setIsInteracting(false);
//     onLocationHover(null);
//     lastHoveredPointRef.current = null;
//     onPointSelect(null);
//   }, [onLocationHover, onPointSelect]);

//   if (error) {
//     return <div>{error}</div>;
//   }

//   if (isGeoDataLoading) {
//     return <div>Initializing geographical data...</div>;
//   }

//   return (
//     <div style={{ position: 'relative', width: '100%', height: '100%' }}>
//       <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
//         <OrbitControls
//           enableZoom={true}
//           enablePan={false}
//           enableRotate={true}
//           onChange={(e?: OrbitControlsChangeEvent | undefined) => handleZoomChange(e?.target?.object?.position?.z ?? 0)}
//           onStart={handleInteractionStart}
//           onEnd={handleInteractionEnd}
//         />
//         <Stars />
//         <ambientLight intensity={0.2} />
//         <pointLight position={[10, 10, 10]} intensity={0.7} />
//         <Globe
//           onLocationHover={handleLocationHover}
//           isInteracting={isInteracting}
//           healthData={healthData}
//           onZoomChange={handleZoomChange}
//           displayMetric={displayMetric}
//         />
//       </Canvas>
//       <div className={`geospatial-chart-overlay ${isZoomedIn ? 'visible' : ''}`}>
//         <div className="map-container">
//           <GeospatialChart
//             data={healthData}
//             metric={displayMetric}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EnhancedGlobeVisualization;






// import { OrbitControls, Stars } from '@react-three/drei';
// import { Canvas } from '@react-three/fiber';
// import dynamic from 'next/dynamic';
// import React, { useEffect, useState, useCallback, useRef } from 'react';

// import { initializeGeoData, getRegionInfo, findNearestHealthDataPoint } from '@/lib/helpers';
// import { useHealth } from '@/services/HealthContext';

// import type { HealthEnvironmentData } from '@/types';
// import type { OrbitControlsChangeEvent } from '@react-three/drei';

// const Globe = dynamic(() => import('./Globe'), { ssr: false });

// interface EnhancedGlobeVisualizationProps {
//   onPointSelect: (point: HealthEnvironmentData | null) => void;
//   onLocationHover: (location: { name: string; country: string; state: string; continent: string } | null) => void;
// }

// const EnhancedGlobeVisualization: React.FC<EnhancedGlobeVisualizationProps> = ({ onPointSelect, onLocationHover }) => {
//   const { onZoomChange, healthData} = useHealth();
//   const [error, setError] = useState<string | null>(null);
//   const [isGeoDataLoading, setIsGeoDataLoading] = useState(true);
//   const lastHoveredPointRef = useRef<HealthEnvironmentData | null>(null);
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

//   const handleLocationHover = useCallback(async (location: { latitude: number; longitude: number }) => {
//     if (!isInteracting) return;
//     const { latitude, longitude } = location;
//     try {
//       const [regionInfo, nearestPoint] = await Promise.all([
//         getRegionInfo(latitude, longitude),
//         findNearestHealthDataPoint(latitude, longitude, healthData)
//       ]);
//       const { country, city, state, continent } = regionInfo;
//       const name = `${city}, ${state}, ${country}, ${continent}`;
//       onLocationHover({ name, country, state, continent });
//       const threshold = 0.1; // 100 meters, adjust as needed
//       if (nearestPoint && (!lastHoveredPointRef.current || getDistance(lastHoveredPointRef.current, nearestPoint) > threshold)) {
//         lastHoveredPointRef.current = nearestPoint;
//         onPointSelect(nearestPoint);
//       }
//     } catch (error) {
//       console.error('Error fetching location info:', error);
//       onLocationHover(null);
//     }
//   }, [healthData, onPointSelect, getDistance, isInteracting, onLocationHover]);

//   const handleInteractionStart = useCallback(() => {
//     setIsInteracting(true);
//   }, []);

//   const handleInteractionEnd = useCallback(() => {
//     setIsInteracting(false);
//     onLocationHover(null);
//     lastHoveredPointRef.current = null;
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
//         onLocationHover={handleLocationHover}
//         isInteracting={isInteracting}
//         healthData={healthData}
//         onZoomChange={handleZoomChange} displayMetric={'cardioHealthScore'}      />
//     </Canvas>
//   );
// };

// export default EnhancedGlobeVisualization;
