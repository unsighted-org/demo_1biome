
// need to use the Dijkstra Algorithm on Maps
// need to use the A* Algorithm on Maps
// need to use the Breadth First Search Algorithm on Maps
// need to use the Depth First Search Algorithm on Maps
// need to use the Greedy Best First Search Algorithm on Maps
// need to use the Hill Climbing Algorithm on Maps
// need to use the Simulated Annealing Algorithm on Maps
// need to use the Genetic Algorithm on Maps

import { geoContains, geoDistance } from 'd3-geo';
import RBush from 'rbush';
import type { IncomingMessage } from 'http';

import type { HealthEnvironmentData } from '@/types';
import { GeoJSON } from 'geojson';

type Feature = GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>;
type FeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>;

let countriesIndex: RBush<SpatialItem> | null = null;
let citiesIndex: RBush<SpatialItem> | null = null;
let isDataLoaded = false;
let lastLoadTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface GeocodingResult {
  country: string;
  continent: string;
  nearestCity?: string;
  onBorder?: string[];
}

interface SpatialItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  feature: Feature;
}

function isIncomingMessage(req: any): req is IncomingMessage {
  return req && typeof req === 'object' && 'headers' in req;
}

function getBaseUrl(req?: IncomingMessage): string {
  if (isIncomingMessage(req)) {
    const host = req.headers.host || 'demo-1biome.vercel.app';
    return `https://${host}`;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://demo-1biome.vercel.app';
}

export async function loadGeoData(req?: IncomingMessage): Promise<void> {
  const currentTime = Date.now();
  if (isDataLoaded && currentTime - lastLoadTime < CACHE_DURATION) {
    console.log('Using cached geo data');
    return;
  }

  try {
    const baseUrl = getBaseUrl(req);
    console.log('Fetching geo data from:', baseUrl);

    const fetchWithTimeout = async (url: string, timeout = 10000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (error) {
        clearTimeout(id);
        throw error;
      }
    };

    const [countriesResponse, citiesResponse] = await Promise.all([
      fetchWithTimeout(`${baseUrl}/api/geo/countries`),
      fetchWithTimeout(`${baseUrl}/api/geo/cities`)
    ]);

    if (!countriesResponse.ok || !citiesResponse.ok) {
      console.error('Countries response:', countriesResponse.status, countriesResponse.statusText);
      console.error('Cities response:', citiesResponse.status, citiesResponse.statusText);
      throw new Error('Failed to fetch geographical data');
    }

    const countriesData: FeatureCollection = await countriesResponse.json();
    const citiesData: FeatureCollection = await citiesResponse.json();

    console.log('Countries data:', countriesData.features.length, 'features');
    console.log('Cities data:', citiesData.features.length, 'features');

    initializeSpatialIndexes(countriesData, citiesData);
    console.log('Spatial indexes initialized');
    
    isDataLoaded = true;
    lastLoadTime = currentTime;
  } catch (error) {
    console.error('Failed to load geographical data', error);
    throw new Error('Failed to load geographical data. Please try again later.');
  }
}

function initializeSpatialIndexes(countriesData: FeatureCollection, citiesData: FeatureCollection): void {
  countriesIndex = new RBush<SpatialItem>();
  citiesIndex = new RBush<SpatialItem>();

  countriesData.features.forEach(country => {
    const bbox = getBoundingBox(country.geometry);
    countriesIndex?.insert({
      minX: bbox[0],
      minY: bbox[1],
      maxX: bbox[2],
      maxY: bbox[3],
      feature: country
    });
  });

  citiesData.features.forEach(city => {
    if (city.geometry.type === 'Point') {
      const [lon, lat] = city.geometry.coordinates;
      citiesIndex?.insert({
        minX: lon,
        minY: lat,
        maxX: lon,
        maxY: lat,
        feature: city
      });
    }
  });
}

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

async function ensureIndexesAreInitialized(req?: IncomingMessage): Promise<void> {
  if (!countriesIndex || !citiesIndex) {
    console.log('Indexes not initialized, loading geo data...');
    await loadGeoData(req);
  }
}

export async function getDetailedLocation(lat: number, lon: number, _req?: IncomingMessage): Promise<GeocodingResult> {
  try {
    await ensureIndexesAreInitialized(_req);

    const result: GeocodingResult = { country: 'Unknown', continent: 'Unknown' };

    const possibleCountries = countriesIndex?.search({
      minX: lon,
      minY: lat,
      maxX: lon,
      maxY: lat
    });

    for (const item of possibleCountries || []) {
      if (geoContains(item.feature, [lon, lat])) {
        result.country = item.feature.properties?.name || '';
        result.continent = item.feature.properties?.continent || '';
        break;
      }
    }

    const nearestCities = citiesIndex?.search({
      minX: lon - 1,
      minY: lat - 1,
      maxX: lon + 1,
      maxY: lat + 1
    });

    let minDistance = Infinity;
    for (const cityItem of nearestCities || []) {
      const [cityLon, cityLat] = (cityItem.feature.geometry as GeoJSON.Point).coordinates;
      const distance = geoDistance([lon, lat], [cityLon, cityLat]);
      if (distance < minDistance) {
        minDistance = distance;
        result.nearestCity = cityItem.feature.properties?.name || '';
      }
    }

    const bordersWithCountries = (possibleCountries || [])
      .filter(item => 
        item.feature.properties?.name !== result.country &&
        geoContains(item.feature, [lon, lat])
      )
      .map(item => item.feature.properties?.name);

    if (bordersWithCountries.length > 0) {
      result.onBorder = bordersWithCountries;
    }

    return result;
  } catch (error) {
    console.error('Error getting detailed location:', error);
    return { country: 'Error', continent: 'Error' };
  }
}

// Utility functions
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
