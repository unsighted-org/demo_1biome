import { LazyLoadManager } from './lazyLoader';
import RBush from 'rbush';
import { cacheGet, cacheSet } from '@/services/cache/cacheService';
import type { Feature, FeatureCollection, SpatialItem } from '@/types/geo';

class GeoDataLoader {
  private static instance: GeoDataLoader;
  private lazyLoadManager: LazyLoadManager;
  private countriesIndex: RBush<SpatialItem> | null = null;
  private citiesIndex: RBush<SpatialItem> | null = null;
  private loadingPromise: Promise<void> | null = null;
  private chunkSize = 100;
  private cacheExpiry = 86400; // 24 hours

  private constructor() {
    this.lazyLoadManager = LazyLoadManager.getInstance();
    this.lazyLoadManager.initialize({
      threshold: 0.1,
      rootMargin: '100px',
      retryCount: 3,
      retryDelay: 1000,
    });
  }

  static getInstance(): GeoDataLoader {
    if (!GeoDataLoader.instance) {
      GeoDataLoader.instance = new GeoDataLoader();
    }
    return GeoDataLoader.instance;
  }

  async loadGeoData(): Promise<void> {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this.loadGeoDataInternal();
    return this.loadingPromise;
  }

  private async loadGeoDataInternal(): Promise<void> {
    try {
      if (this.countriesIndex && this.citiesIndex) {
        return;
      }

      const cachedData = await cacheGet('cachedGeoData');
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        this.initializeIndices(parsedData);
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;
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
      await this.processGeoData(geoData);
    } catch (error) {
      console.error('Error loading geo data:', error);
      throw error;
    } finally {
      this.loadingPromise = null;
    }
  }

  private async processGeoData(geoData: FeatureCollection): Promise<void> {
    this.countriesIndex = new RBush<SpatialItem>();
    this.citiesIndex = new RBush<SpatialItem>();

    const countryItems: SpatialItem[] = [];
    const cityItems: SpatialItem[] = [];

    for (let i = 0; i < geoData.features.length; i += this.chunkSize) {
      const chunk = geoData.features.slice(i, i + this.chunkSize);
      await this.processChunk(chunk, countryItems, cityItems);
    }

    await this.cacheProcessedData();
  }

  private async processChunk(
    features: Feature[],
    countryItems: SpatialItem[],
    cityItems: SpatialItem[]
  ): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        features.forEach(feature => {
          const bbox = this.getBoundingBox(feature.geometry);
          if (feature.properties?.type === 'country') {
            countryItems.push(this.createSpatialItem(feature, bbox));
          } else if (feature.properties?.type === 'city') {
            cityItems.push(this.createSpatialItem(feature, bbox));
          }
        });

        if (countryItems.length >= this.chunkSize) {
          this.countriesIndex?.load(countryItems);
          countryItems.length = 0;
        }
        if (cityItems.length >= this.chunkSize) {
          this.citiesIndex?.load(cityItems);
          cityItems.length = 0;
        }

        resolve();
      }, 0);
    });
  }

  private createSpatialItem(feature: Feature, bbox: number[]): SpatialItem {
    return {
      minX: bbox[0],
      minY: bbox[1],
      maxX: bbox[2],
      maxY: bbox[3],
      feature
    };
  }

  private async cacheProcessedData(): Promise<void> {
    const cacheData = {
      countries: this.countriesIndex?.toJSON(),
      cities: this.citiesIndex?.toJSON(),
      timestamp: Date.now()
    };
    await cacheSet('cachedGeoData', JSON.stringify(cacheData), this.cacheExpiry);
  }

  private initializeIndices(data: any): void {
    this.countriesIndex = new RBush<SpatialItem>();
    this.citiesIndex = new RBush<SpatialItem>();
    this.countriesIndex.load(data.countries);
    this.citiesIndex.load(data.cities);
  }

  async searchLocation(lat: number, lon: number): Promise<{
    country: string;
    state: string;
    city: string;
    continent: string;
  }> {
    await this.loadGeoData();

    const point = { minX: lon, minY: lat, maxX: lon, maxY: lat };
    const countries = this.countriesIndex?.search(point) || [];
    const cities = this.citiesIndex?.search(point) || [];

    return {
      country: countries[0]?.feature.properties?.name || '',
      city: cities[0]?.feature.properties?.name || '',
      state: cities[0]?.feature.properties?.state || '',
      continent: countries[0]?.feature.properties?.continent || ''
    };
  }

  private getBoundingBox(geometry: any): number[] {
    // Implementation of getBoundingBox from helpers.ts
    // ... (same implementation)
    return [0, 0, 0, 0]; // Placeholder
  }
}

export const geoDataLoader = GeoDataLoader.getInstance();
