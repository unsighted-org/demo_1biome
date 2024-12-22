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
