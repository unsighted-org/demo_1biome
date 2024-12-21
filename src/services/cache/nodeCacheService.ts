// src/services/cache/nodeCacheService.ts

import NodeCache from 'node-cache';

class NodeCacheService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache();
  }

  async getValue(key: string): Promise<string | null> {
    try {
      const value = this.cache.get<string>(key);
      return value || null;
    } catch (error) {
      console.error('Error getting value from NodeCache:', error);
      throw error;
    }
  }

  async setValue(key: string, value: string, expiryTime?: number): Promise<void> {
    try {
      if (expiryTime) {
        this.cache.set(key, value, expiryTime);
      } else {
        this.cache.set(key, value);
      }
    } catch (error) {
      console.error('Error setting value in NodeCache:', error);
      throw error;
    }
  }

  async getKeys(pattern: string): Promise<string[]> {
    try {
      const keys = this.cache.keys();
      return keys.filter((key) => key.match(pattern));
    } catch (error) {
      console.error('Error getting keys from NodeCache:', error);
      throw error;
    }
  }

  async deleteValue(key: string): Promise<void> {
    try {
      this.cache.del(key);
    } catch (error) {
      console.error('Error deleting value from NodeCache:', error);
      throw error;
    }
  }
}

export const nodeCacheService = new NodeCacheService();
