import axios from 'axios';
import type { HealthEnvironmentData, HealthScores, RegionalComparison, EnterpriseAnalytics, EnterpriseGlobeData, EnterpriseUser } from '../types';
import io from 'socket.io-client';

const BASE_URL = '/api/health-data';

export const healthApi = {
  getHealthData: async (userId: string, page: number = 1, limit: number = 100): Promise<{
    data: HealthEnvironmentData[];
    totalPages: number;
    currentPage: number;
  }> => {
    const response = await axios.get(`${BASE_URL}?userId=${userId}&page=${page}&limit=${limit}`);
    return response.data;
  },

  syncDeviceData: async (deviceId: string): Promise<void> => {
    await axios.post(`${BASE_URL}/sync`, { deviceId });
  },

  getHealthScores: async (userId: string): Promise<HealthScores> => {
    const response = await axios.get(`${BASE_URL}/scores/${userId}`);
    return response.data;
  },

  getRegionalComparison: async (regionId: string): Promise<RegionalComparison> => {
    const response = await axios.get(`${BASE_URL}/regional-comparison/${regionId}`);
    return response.data;
  },

  subscribeToRealTimeUpdates: (callback: (data: HealthEnvironmentData) => void) => {
    const socket = io(BASE_URL, {
      path: '/socket.io',
    });

    socket.on('health-data', (data: HealthEnvironmentData) => {
      callback(data);
    });

    return () => {
      socket.disconnect();
    };
  },

  // Enterprise-specific methods
  getEnterpriseAnalytics: async (enterpriseId: string): Promise<EnterpriseAnalytics> => {
    const response = await axios.get(`${BASE_URL}/enterprise/${enterpriseId}/analytics`);
    return response.data;
  },

  getEnterpriseGlobeData: async (enterpriseId: string): Promise<EnterpriseGlobeData> => {
    const response = await axios.get(`${BASE_URL}/enterprise/${enterpriseId}/globe-data`);
    return response.data;
  },

  updateEnterpriseInfo: async (enterpriseId: string, info: Partial<EnterpriseUser['enterprise']>): Promise<void> => {
    await axios.put(`${BASE_URL}/enterprise/${enterpriseId}`, info);
  },

  addUserToEnterprise: async (enterpriseId: string, userId: string): Promise<void> => {
    await axios.post(`${BASE_URL}/enterprise/${enterpriseId}/users`, { userId });
  },

  removeUserFromEnterprise: async (enterpriseId: string, userId: string): Promise<void> => {
    await axios.delete(`${BASE_URL}/enterprise/${enterpriseId}/users/${userId}`);
  },
};
