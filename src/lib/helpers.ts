// need to use the Dijkstra Algorithm on Maps
// need to use the A* Algorithm on Maps
// need to use the Breadth First Search Algorithm on Maps
// need to use the Depth First Search Algorithm on Maps
// need to use the Greedy Best First Search Algorithm on Maps
// need to use the Hill Climbing Algorithm on Maps
// need to use the Simulated Annealing Algorithm on Maps
// need to use the Genetic Algorithm on Maps

// Import necessary modules and types

import { geoContains, geoDistance, geoInterpolate, geoPath } from 'd3-geo';
import { debounce } from 'lodash';
import RBush from 'rbush';

import type { HealthEnvironmentData } from '@/types';
import type { GeoJSON } from 'geojson';

import GeocodingService from '@/services/GeocodingService';

// Define types for GeoJSON features and spatial items
type Feature = GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>;
type FeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>;

interface SpatialItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  feature: Feature;
}

// Declare indexes for countries and cities
let countriesIndex: RBush<SpatialItem> | null = null;
let citiesIndex: RBush<SpatialItem> | null = null;

// Constants for grid size and cache expiry
const GRID_SIZE = 1; // 1 degree grid
const CACHE_EXPIRY = 3600; // 1 hour

// Utility function to get the grid key for a given latitude and longitude
function getGridKey(lat: number, lon: number): string {
  const gridLat = Math.floor(lat / GRID_SIZE) * GRID_SIZE;
  const gridLon = Math.floor(lon / GRID_SIZE) * GRID_SIZE;
  return `grid:${gridLat},${gridLon}`;
}

// Async function to get a value from Redis
async function redisGet(key: string): Promise<string | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;
    const response = await fetch(`${baseUrl}/api/redis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get', key }),
    });
    
    if (!response.ok) {
      console.error('Redis get error:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    return data.value;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

// Async function to set a value in Redis
async function redisSet(key: string, value: string, expiryTime?: number): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;
    const response = await fetch(`${baseUrl}/api/redis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set', key, value, expiryTime }),
    });
    
    if (!response.ok) {
      console.error('Redis set error:', response.statusText);
    }
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

// Initialize geographical data for countries and cities
export async function initializeGeoData(): Promise<void> {
  if (countriesIndex && citiesIndex) return;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;
    const cachedData = await redisGet('cachedGeoData');

    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      countriesIndex = new RBush<SpatialItem>();
      citiesIndex = new RBush<SpatialItem>();
      countriesIndex.load(parsedData.countries);
      citiesIndex.load(parsedData.cities);
    } else {
      const response = await fetch(`${baseUrl}/api/geo/countries`, {
        headers: {
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch geo data: ${response.statusText}`);
      }

      const geoData: FeatureCollection = await response.json();

      countriesIndex = new RBush<SpatialItem>();
      citiesIndex = new RBush<SpatialItem>();

      const countryItems: SpatialItem[] = [];
      const cityItems: SpatialItem[] = [];

      // Process data in chunks to avoid memory issues
      const CHUNK_SIZE = 100;
      for (let i = 0; i < geoData.features.length; i += CHUNK_SIZE) {
        const chunk = geoData.features.slice(i, i + CHUNK_SIZE);
        
        chunk.forEach(feature => {
          const bbox = getBoundingBox(feature.geometry);
          if (feature.properties?.type === 'country') {
            countryItems.push({
              minX: bbox[0],
              minY: bbox[1],
              maxX: bbox[2],
              maxY: bbox[3],
              feature
            });
          } else if (feature.properties?.type === 'city') {
            cityItems.push({
              minX: bbox[0],
              minY: bbox[1],
              maxX: bbox[2],
              maxY: bbox[3],
              feature
            });
          }
        });

        // Bulk insert chunks
        if (countryItems.length > 0) {
          countriesIndex.load(countryItems);
          countryItems.length = 0;
        }
        if (cityItems.length > 0) {
          citiesIndex.load(cityItems);
          cityItems.length = 0;
        }
      }

      // Cache the processed data
      const cacheData = {
        countries: countriesIndex.toJSON(),
        cities: citiesIndex.toJSON(),
        timestamp: Date.now()
      };
      await redisSet('cachedGeoData', JSON.stringify(cacheData), 86400); // Cache for 24 hours
    }
  } catch (error) {
    console.error('Error initializing geo data:', error);
    throw error;
  }
}

// Function to get region information based on latitude and longitude
export async function getLocationInfo(lat: number, lon: number): Promise<{ 
  country: string; 
  state: string; 
  city: string; 
  continent: string;
  neighborhood?: string;
  formattedAddress?: string;
}> {
  try {
    return await GeocodingService.getInstance().getLocationInfo(lat, lon);
  } catch (error) {
    console.error('Error getting location info:', error);
    throw error;
  }
}

// Function to get location information based on latitude and longitude, debounced
export const getLocationInfoDebounced = debounce(async (lat: number, lon: number): Promise<{ country: string; city: string; continent: string; state: string }> => {
  const regionInfo = await getLocationInfo(lat, lon);
  return regionInfo; // This now includes the state information as well
}, 200);

// Function to find the nearest health data point, debounced
export const findNearestHealthDataPoint = debounce(async (lat: number, lon: number, healthData: HealthEnvironmentData[]): Promise<HealthEnvironmentData | null> => {
  const gridKey = getGridKey(lat, lon);
  const cachedPoint = await redisGet(gridKey);

  if (cachedPoint) {
    return JSON.parse(cachedPoint);
  }

  let nearest: HealthEnvironmentData | null = null;
  let minDistance = Infinity;

  for (const point of healthData) {
    const distance = geoDistance([lon, lat], [point.longitude, point.latitude]);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = point;
    }
  }

  if (nearest) {
    await redisSet(gridKey, JSON.stringify(nearest), CACHE_EXPIRY);
  }

  return nearest;
}, 200);

// Function to calculate a route between two points
export function calculateRoute(start: [number, number], end: [number, number]): [number, number][] {
  const interpolate = geoInterpolate(start, end);
  const numPoints = 100;
  return Array.from({ length: numPoints }, (_, i) => interpolate(i / (numPoints - 1)));
}

// Function to get country borders based on country name
export async function getCountryBorders(countryName: string): Promise<GeoJSON.MultiPolygon | null> {
  if (!countriesIndex) await initializeGeoData();

  const cacheKey = `countryBorders:${countryName}`;
  const cachedBorders = await redisGet(cacheKey);

  if (cachedBorders) {
    return JSON.parse(cachedBorders);
  }

  const country = countriesIndex!.all().find(item => item.feature.properties?.name === countryName);
  if (country && country.feature.geometry.type === 'MultiPolygon') {
    await redisSet(cacheKey, JSON.stringify(country.feature.geometry), Number(CACHE_EXPIRY));
    return country.feature.geometry;
  }
  return null;
}

// Function to calculate the area of a given geometry
export function calculateArea(geometry: GeoJSON.MultiPolygon): number {
  const path = geoPath();
  return path.area(geometry);
}

// Utility function to get the bounding box of a given geometry
function getBoundingBox(geometry: GeoJSON.Geometry): [number, number, number, number] {
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;

  function updateBounds(lon: number, lat: number): void {
    minLon = Math.min(minLon, lon);
    minLat = Math.min(minLat, lat);
    maxLon = Math.max(maxLon, lon);
    maxLat = Math.max(maxLat, lat);
  }

  if (geometry.type === 'Point') {
    const [lon, lat] = geometry.coordinates;
    updateBounds(lon, lat);
  } else if (geometry.type === 'Polygon') {
    geometry.coordinates[0].forEach(([lon, lat]) => updateBounds(lon, lat));
  } else if (geometry.type === 'MultiPolygon') {
    (geometry.coordinates as GeoJSON.Position[][][]).forEach(polygon => {
      polygon[0].forEach(([lon, lat]) => updateBounds(lon, lat));
    });
  } else if (geometry.type === 'MultiPoint') {
    (geometry.coordinates as GeoJSON.Position[]).forEach(([lon, lat]) => updateBounds(lon, lat));
  }

  return [minLon, minLat, maxLon, maxLat];
}

// Utility functions for formatting dates, calculating BMI, determining activity levels, and other health/environmental metrics
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const calculateBMI = (weight: number, height: number): number => {
  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
};

export function getActivityLevel(steps: number): "sedentary" | "light" | "moderate" | "vigorous" {
  if (steps < 5000) return "sedentary";
  if (steps < 7500) return "light";
  if (steps < 10000) return "moderate";
  return "vigorous";
}

export const getEnvironmentalImpact = (data: HealthEnvironmentData): string => {
  const score = data.environmentalImpactScore;
  if (score < 20) return 'Severe';
  if (score < 40) return 'High';
  if (score < 60) return 'Moderate';
  if (score < 80) return 'Low';
  return 'Minimal';
};

export const getAirQualityDescription = (aqi: number): string => {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

export const getUVIndexDescription = (uvIndex: number): string => {
  if (uvIndex <= 2) return 'Low';
  if (uvIndex <= 5) return 'Moderate';
  if (uvIndex <= 7) return 'High';
  if (uvIndex <= 10) return 'Very High';
  return 'Extreme';
};

export const getNoiseLevelDescription = (noiseLevel: number): string => {
  if (noiseLevel <= 40) return 'Quiet';
  if (noiseLevel <= 70) return 'Moderate';
  if (noiseLevel <= 90) return 'Loud';
  return 'Very Loud';
};

export const getHealthScoreDescription = (score: number): string => {
  if (score < 20) return 'Poor';
  if (score < 40) return 'Fair';
  if (score < 60) return 'Good';
  if (score < 80) return 'Very Good';
  return 'Excellent';
};
export { geoDistance };

// Helper function to calculate centroid of a polygon or multipolygon
function calculateCentroid(geometry: GeoJSON.Geometry): [number, number] {
  let totalArea = 0;
  let centerX = 0;
  let centerY = 0;

  function processPolygon(coordinates: number[][][]): void {
    coordinates[0].forEach((coord, index) => {
      if (index === coordinates[0].length - 1) return;
      const nextCoord = coordinates[0][index + 1];
      const area = (coord[0] * nextCoord[1] - nextCoord[0] * coord[1]) / 2;
      totalArea += area;
      centerX += (coord[0] + nextCoord[0]) * area / 3;
      centerY += (coord[1] + nextCoord[1]) * area / 3;
    });
  }

  if (geometry.type === 'Polygon') {
    processPolygon(geometry.coordinates);
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach(polygon => processPolygon(polygon));
  }

  return [centerX / totalArea, centerY / totalArea];
}
