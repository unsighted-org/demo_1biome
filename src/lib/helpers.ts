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
  const response = await fetch('/api/redis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'get', key }),
  });
  const data = await response.json();
  return data.value;
}

// Async function to set a value in Redis
async function redisSet(key: string, value: string, expiryTime?: number): Promise<void> {
  await fetch('/api/redis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'set', key, value, expiryTime }),
  });
}

// Initialize geographical data for countries and cities
export async function initializeGeoData(): Promise<void> {
  if (countriesIndex && citiesIndex) return;

  const cachedData = await redisGet('cachedGeoData');

  if (cachedData) {
    const parsedData = JSON.parse(cachedData);
    countriesIndex = new RBush<SpatialItem>();
    citiesIndex = new RBush<SpatialItem>();
    countriesIndex.load(parsedData.countries);
    citiesIndex.load(parsedData.cities);
  } else {
    const response = await fetch('/api/geo/countries');
    const geoData: FeatureCollection = await response.json();

    countriesIndex = new RBush<SpatialItem>();
    citiesIndex = new RBush<SpatialItem>();

    const countryItems: SpatialItem[] = [];
    const cityItems: SpatialItem[] = [];

    geoData.features.forEach(feature => {
      const bbox = getBoundingBox(feature.geometry);
      
      // Add country to countriesIndex
      countryItems.push({
        minX: bbox[0],
        minY: bbox[1],
        maxX: bbox[2],
        maxY: bbox[3],
        feature: feature
      });

      // Use country centroid as a "city" for citiesIndex
      if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
        const centroid = calculateCentroid(feature.geometry);
        cityItems.push({
          minX: centroid[0],
          minY: centroid[1],
          maxX: centroid[0],
          maxY: centroid[1],
          feature: {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: centroid
            },
            properties: {
              name: feature.properties?.name || 'Unknown',
              country: feature.properties?.name || 'Unknown'
            }
          }
        });
      }
    });

    countriesIndex.load(countryItems);
    citiesIndex.load(cityItems);

    // Cache the processed data
    await redisSet('cachedGeoData', JSON.stringify({ countries: countryItems, cities: cityItems }), CACHE_EXPIRY);
  }
}

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
// Function to get region information based on latitude and longitude
export async function getRegionInfo(lat: number, lon: number): Promise<{ country: string; state: string; city: string; continent: string }> {
  if (!countriesIndex || !citiesIndex) {
    await initializeGeoData();
  }

  const gridKey = getGridKey(lat, lon);
  const cachedInfo = await redisGet(gridKey);

  if (cachedInfo) {
    return JSON.parse(cachedInfo);
  }

  let country = 'Unknown';
  let state = 'Unknown';
  let city = 'Unknown';
  let continent = 'Unknown';

  const possibleCountries = countriesIndex!.search({ minX: lon, minY: lat, maxX: lon, maxY: lat });
  for (const item of possibleCountries) {
    if (geoContains(item.feature, [lon, lat])) {
      country = item.feature.properties?.name || 'Unknown';
      continent = item.feature.properties?.continent || 'Unknown';
      state = item.feature.properties?.state || 'Unknown';
      break;
    }
  }

  const nearestCities = citiesIndex!.search({ minX: lon - 1, minY: lat - 1, maxX: lon + 1, maxY: lat + 1 });
  let minDistance = Infinity;
  for (const cityItem of nearestCities) {
    const [cityLon, cityLat] = (cityItem.feature.geometry as GeoJSON.Point).coordinates;
    const distance = geoDistance([lon, lat], [cityLon, cityLat]);
    if (distance < minDistance) {
      minDistance = distance;
      city = cityItem.feature.properties?.name || 'Unknown';
    }
  }

  // Since we're using country centroids as cities, city and country will be the same
  city = country;

  const result = { country, state, city, continent };
  await redisSet(gridKey, JSON.stringify(result), CACHE_EXPIRY);

  return result;
}

// Function to get location information based on latitude and longitude, debounced
export const getLocationInfo = debounce(async (lat: number, lon: number): Promise<{ country: string; city: string; continent: string; state: string }> => {
  const regionInfo = await getRegionInfo(lat, lon);
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

