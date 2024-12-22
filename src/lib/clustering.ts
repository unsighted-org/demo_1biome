import RBush from 'rbush';
import { geoDistance } from 'd3-geo';
import type { HealthEnvironmentData } from '@/types';

interface ClusterItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  data: HealthEnvironmentData;
}

interface ClusterManagerConfig {
  minZoom?: number;
  maxZoom?: number;
  radius?: number;
  minPoints?: number;
}

class ClusterManager {
  private tree: RBush<ClusterItem>;
  private clusterCache: Map<number, HealthEnvironmentData[]>;
  private config: Required<ClusterManagerConfig>;

  constructor(config?: ClusterManagerConfig) {
    this.tree = new RBush<ClusterItem>();
    this.clusterCache = new Map();
    this.config = {
      minZoom: config?.minZoom ?? 1,
      maxZoom: config?.maxZoom ?? 20,
      radius: config?.radius ?? 40,
      minPoints: config?.minPoints ?? 2
    };
  }

  addData(data: HealthEnvironmentData[]) {
    const items = data.map(point => ({
      minX: point.longitude!,
      minY: point.latitude!,
      maxX: point.longitude!,
      maxY: point.latitude!,
      data: point
    }));
    this.tree.load(items);
    this.clusterCache.clear(); // Clear cache when new data is added
  }

  getClusters(zoom: number): HealthEnvironmentData[] {
    const cachedClusters = this.clusterCache.get(zoom);
    if (cachedClusters) return cachedClusters;

    const clusters = this.clusterData(zoom);
    this.clusterCache.set(zoom, clusters);
    return clusters;
  }

  private clusterData(zoom: number): HealthEnvironmentData[] {
    const clustered: HealthEnvironmentData[] = [];
    const clusterRadius = this.config.radius / Math.pow(2, zoom); // Adjusted radius calculation

    const allItems = this.tree.all();
    const data = allItems.map(item => item.data);

    data.forEach(point => {
      if (clustered.some(c => c.originalPoint === point)) return; // Skip points already in clusters

      const searchBbox = {
        minX: point.longitude! - clusterRadius,
        minY: point.latitude! - clusterRadius,
        maxX: point.longitude! + clusterRadius,
        maxY: point.latitude! + clusterRadius
      };

      const neighbors = this.tree.search(searchBbox);
      
      if (neighbors.length > this.config.minPoints) {
        const cluster = neighbors.filter(neighbor => 
          geoDistance([point.longitude!, point.latitude!], [neighbor.data.longitude!, neighbor.data.latitude!]) <= clusterRadius
        ).map(neighbor => neighbor.data);

        const avgLat = cluster.reduce((sum, p) => sum + p.latitude!, 0) / cluster.length;
        const avgLon = cluster.reduce((sum, p) => sum + p.longitude!, 0) / cluster.length;

        const clusterPoint: HealthEnvironmentData = {
          ...point,
          latitude: avgLat,
          longitude: avgLon,
          cardioHealthScore: cluster.reduce((sum, p) => sum + p.cardioHealthScore, 0) / cluster.length,
          respiratoryHealthScore: cluster.reduce((sum, p) => sum + p.respiratoryHealthScore, 0) / cluster.length,
          physicalActivityScore: cluster.reduce((sum, p) => sum + p.physicalActivityScore, 0) / cluster.length,
          environmentalImpactScore: cluster.reduce((sum, p) => sum + p.environmentalImpactScore, 0) / cluster.length,
          clusterSize: cluster.length,
          originalPoint: point,
        };

        clustered.push(clusterPoint);
      } else {
        clustered.push({ ...point, clusterSize: 1, originalPoint: point });
      }
    });

    return clustered;
  }
}

// Export a function that creates and returns a ClusterManager instance
export function createClusterManager(config?: ClusterManagerConfig): ClusterManager {
  return new ClusterManager(config);
}

// Export the clusterData function for backwards compatibility or standalone use
export function clusterData(data: HealthEnvironmentData[], zoom: number, config?: ClusterManagerConfig): HealthEnvironmentData[] {
  const manager = createClusterManager(config);
  manager.addData(data);
  return manager.getClusters(zoom);
}