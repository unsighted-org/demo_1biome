import type { Feature, GeoJSON } from 'geojson';

export interface LocationInfo {
  country: string;
  state: string;
  city: string;
  continent: string;
  neighborhood?: string;
  formattedAddress: string;
  coordinates?: [number, number];
}

export interface MapboxFeature extends GeoJSON.Feature {
  place_name?: string;
  place_type?: string[];
  text?: string;
}

export interface MapboxResponse {
  type: string;
  features: MapboxFeature[];
}

export class GeocodingService {
  private static instance: GeocodingService;
  private cache: Map<string, LocationInfo>;
  private pendingRequests: Map<string, Promise<LocationInfo>>;
  private readonly baseUrl: string = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
  private readonly accessToken: string;

  private constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
  }

  public static getInstance(): GeocodingService {
    if (!GeocodingService.instance) {
      GeocodingService.instance = new GeocodingService();
    }
    return GeocodingService.instance;
  }

  private async fetchLocationInfo(lat: number, lon: number): Promise<LocationInfo> {
    const url = `${this.baseUrl}/${lon},${lat}.json?access_token=${this.accessToken}&types=country,region,place,neighborhood&language=en`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Geocoding request failed: ${response.statusText}`);
      }

      const data: MapboxResponse = await response.json();
      if (!data.features || data.features.length === 0) {
        console.warn('No location data found for coordinates:', { lat, lon });
        return {
          country: 'Unknown',
          state: 'Unknown',
          city: 'Unknown',
          continent: 'Unknown',
          formattedAddress: 'Unknown Location',
          coordinates: [lon, lat]
        };
      }

      const locationInfo: LocationInfo = {
        country: '',
        state: '',
        city: '',
        continent: '',
        formattedAddress: data.features[0].place_name || 'Unknown Location',
        coordinates: [lon, lat]
      };

      data.features.forEach(feature => {
        const placeType = feature.place_type?.[0];
        const name = feature.text || '';

        switch (placeType) {
          case 'country':
            locationInfo.country = name;
            break;
          case 'region':
            locationInfo.state = name;
            break;
          case 'place':
            locationInfo.city = name;
            break;
          case 'neighborhood':
            locationInfo.neighborhood = name;
            break;
        }
      });

      return locationInfo;
    } catch (error) {
      console.error('Error fetching location info:', error);
      throw error;
    }
  }

  public async getLocationInfo(lat: number, lon: number): Promise<LocationInfo> {
    const cacheKey = `${lat},${lon}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    const pendingRequest = this.fetchLocationInfo(lat, lon)
      .then(locationInfo => {
        this.cache.set(cacheKey, locationInfo);
        this.pendingRequests.delete(cacheKey);
        return locationInfo;
      })
      .catch(error => {
        this.pendingRequests.delete(cacheKey);
        throw error;
      });

    this.pendingRequests.set(cacheKey, pendingRequest);
    return pendingRequest;
  }

  public async searchLocation(query: string): Promise<LocationInfo[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${encodeURIComponent(query)}.json?access_token=${this.accessToken}`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data: MapboxResponse = await response.json();
      
      return data.features.map(feature => ({
        country: '',
        state: '',
        city: '',
        continent: '',
        neighborhood: undefined,
        formattedAddress: feature.place_name || 'Unknown Location',
        coordinates: feature.geometry.type === 'Point' 
          ? (feature.geometry.coordinates as [number, number])
          : undefined
      }));
    } catch (error) {
      console.error('Error in geocoding service:', error);
      throw error;
    }
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

export default GeocodingService;
