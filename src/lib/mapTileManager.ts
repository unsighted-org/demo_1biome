import { TileCache } from './types';

class MapTileManager {
  private cache: Map<string, TileCache>;
  private maxCacheSize: number;
  private loadingTiles: Set<string>;

  constructor(maxCacheSize = 100) {
    this.cache = new Map();
    this.maxCacheSize = maxCacheSize;
    this.loadingTiles = new Set();
  }

  async loadTile(x: number, y: number, z: number): Promise<HTMLImageElement> {
    const key = `${z}/${x}/${y}`;
    
    // Check cache first
    if (this.cache.has(key)) {
      const cached = this.cache.get(key)!;
      if (Date.now() - cached.timestamp < 3600000) { // 1 hour cache
        return cached.image;
      }
      this.cache.delete(key);
    }

    // Check if already loading
    if (this.loadingTiles.has(key)) {
      return new Promise((resolve, reject) => {
        const checkLoading = setInterval(() => {
          if (this.cache.has(key)) {
            clearInterval(checkLoading);
            resolve(this.cache.get(key)!.image);
          }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkLoading);
          reject(new Error('Tile loading timeout'));
        }, 10000);
      });
    }

    // Start loading
    this.loadingTiles.add(key);

    try {
      const image = await this.fetchTile(x, y, z);
      
      // Manage cache size
      if (this.cache.size >= this.maxCacheSize) {
        const oldestKey = Array.from(this.cache.entries())
          .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
        this.cache.delete(oldestKey);
      }

      // Add to cache
      this.cache.set(key, {
        image,
        timestamp: Date.now()
      });

      this.loadingTiles.delete(key);
      return image;
    } catch (error) {
      this.loadingTiles.delete(key);
      throw error;
    }
  }

  private fetchTile(x: number, y: number, z: number): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load tile ${z}/${x}/${y}`));
      
      img.src = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    });
  }

  clearCache() {
    this.cache.clear();
    this.loadingTiles.clear();
  }

  getTileUrl(x: number, y: number, z: number): string {
    return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  }

  isLoading(x: number, y: number, z: number): boolean {
    return this.loadingTiles.has(`${z}/${x}/${y}`);
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

export const mapTileManager = new MapTileManager();
