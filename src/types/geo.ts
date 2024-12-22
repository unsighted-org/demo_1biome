import type { GeoJSON } from 'geojson';

export type Feature = GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>;
export type FeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>;

export interface SpatialItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  feature: Feature;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface GeoLocation extends GeoPoint {
  accuracy: number;
  timestamp: string;
}

export interface GeoRegion {
  id: string;
  name: string;
  type: 'city' | 'state' | 'country' | 'continent';
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: GeoPoint;
  properties?: Record<string, any>;
}

export interface GeoData {
  features: Feature[];
  regions: GeoRegion[];
  timestamp: number;
}

export interface LocationInfo {
  country: string;
  state: string;
  city: string;
  continent: string;
  neighborhood?: string;
  formattedAddress: string;
  coordinates?: [number, number];
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface GlobeState {
  zoom: number;
  center: GeoCoordinates;
  rotation: Vector3;
  isInteracting: boolean;
}

export interface TileCoordinates {
  x: number;
  y: number;
  z: number;
}

export interface MapTileOptions {
  maxZoom?: number;
  minZoom?: number;
  tileSize?: number;
  attribution?: string;
}

export interface TileCache {
  image: HTMLImageElement;
  timestamp: number;
}
