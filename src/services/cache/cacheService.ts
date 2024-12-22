type CacheValue = string | null;

class CacheService {
  private static instance: CacheService;
  private cache: Map<string, { value: CacheValue; expiry: number }>;

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async set(key: string, value: CacheValue, expirySeconds: number = 3600): Promise<void> {
    const expiryTime = Date.now() + expirySeconds * 1000;
    this.cache.set(key, { value, expiry: expiryTime });
  }

  async get(key: string): Promise<CacheValue> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

const cacheService = CacheService.getInstance();

export const cacheGet = (key: string) => cacheService.get(key);
export const cacheSet = (key: string, value: CacheValue, expirySeconds?: number) => 
  cacheService.set(key, value, expirySeconds);
export const cacheDelete = (key: string) => cacheService.delete(key);
export const cacheClear = () => cacheService.clear();
