import axios from 'axios';
import { useState, useCallback } from 'react';

import type { UserSettings, UserState, UserSignupData, UserLoginData, UserResponse } from '@/types';
import type { AxiosInstance } from 'axios';

const createApi = (initialToken: string | null): {
  instance: AxiosInstance;
  setToken: (newToken: string | null) => void;
} => {
  const instance = axios.create({
    baseURL: '/api',
    headers: { Authorization: `Bearer ${initialToken}` },
  });

  const setToken = (newToken: string | null): void => {
    instance.defaults.headers.common['Authorization'] = newToken ? `Bearer ${newToken}` : '';
  };

  return { instance, setToken };
};

interface UseApiReturn {
  instance: AxiosInstance;
  login: (email: string, password: string) => Promise<UserState>;
  signUp: (signupData: UserSignupData) => Promise<UserState>;
  signOut: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  token: string | null;
  setToken: (token: string | null) => void;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<UserSettings>;
  updateProfile: (profileData: Partial<UserState>) => Promise<UserState>;
  setUserFCMToken: (fcmToken: string) => Promise<void>;
  addUserConnectedDevice: (deviceId: string) => Promise<void>;
  removeUserConnectedDevice: (deviceId: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  verifyToken: (token: string) => Promise<UserState>;
  validateToken: () => Promise<boolean>;
  getUserProfile: () => Promise<UserState>;
  getSession: () => Promise<UserState | null>;
}

export const useApi = (): UseApiReturn => {
  const [token, setLocalToken] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('token') : null
  );
  const { instance: api, setToken: setApiToken } = createApi(token);

  const setToken = useCallback((newToken: string | null): void => {
    setLocalToken(newToken);
    setApiToken(newToken);
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
  }, [setApiToken]);

  const validateToken = useCallback(async (): Promise<boolean> => {
    try {
      if (!token) return false;
      await api.get('/auth/session');
      return true;
    } catch (error) {
      return false;
    }
  }, [api, token]);

  const getUserProfile = useCallback(async (): Promise<UserState> => {
    try {
      const response = await api.get('/auth/session');
      return response.data.user;
    } catch (error) {
      throw new Error('Failed to get user profile');
    }
  }, [api]);

  const getSession = useCallback(async (): Promise<UserState | null> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return null;
      }

      const response = await axios.get('/api/auth/session', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<UserState> => {
    try {
      const response = await api.post<UserResponse>('/auth/login', { email, password });
      
      if (!response.data || !response.data.token) {
        throw new Error('Invalid response from server');
      }

      setToken(response.data.token);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('User not found');
        }
        if (error.response?.status === 401) {
          throw new Error('Invalid password');
        }
        throw new Error(error.response?.data?.error || 'Failed to sign in');
      }
      throw error;
    }
  }, [api, setToken]);

  const signUp = useCallback(async (signupData: UserSignupData): Promise<UserState> => {
    try {
      const formData = new FormData();
      formData.append('signupData', JSON.stringify(signupData));

      const response = await api.post<UserResponse>('/auth/signup', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data || !response.data.token) {
        throw new Error('Invalid response from server');
      }

      setToken(response.data.token);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          throw new Error('Email already exists');
        }
        if (error.response?.status === 404) {
          throw new Error('Signup endpoint not found');
        }
        throw new Error(error.response?.data?.error || 'Failed to sign up');
      }
      throw error;
    }
  }, [api, setToken]);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await api.post('/auth/signout');
    } finally {
      setToken(null);
    }
  }, [api, setToken]);

  const updateUserSettings = useCallback(async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await api.post<UserSettings>('/user/updateSettings', settings);
    return response.data;
  }, [api]);

  const updateProfile = useCallback(async (profileData: Partial<UserState>): Promise<UserState> => {
    const response = await api.post<UserState>('/user/updateUserProfile', profileData);
    return response.data;
  }, [api]);

  const deleteAccount = useCallback(async (password: string): Promise<void> => {
    await api.post('/user/deleteAccount', { action: 'deleteAccount', password });
    setToken(null);
  }, [api, setToken]);

  const setUserFCMToken = useCallback(async (fcmToken: string): Promise<void> => {
    await api.post('/user/setFCMToken', { fcmToken });
  }, [api]);

  const addUserConnectedDevice = useCallback(async (deviceId: string): Promise<void> => {
    await api.post('/user/addConnectedDevice', { deviceId });
  }, [api]);

  const removeUserConnectedDevice = useCallback(async (deviceId: string): Promise<void> => {
    await api.post('/user/removeConnectedDevice', { deviceId });
  }, [api]);

  const forgotPassword = useCallback(async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  }, [api]);

  const verifyToken = useCallback(async (token: string): Promise<UserResponse> => {
    const response = await api.post<UserResponse>('/api/auth/verify-token', { token });
    return response.data;
  }, [api]);

  return {
    instance: api,
    token,
    setToken,
    validateToken,
    getUserProfile,
    getSession,
    login,
    signUp,
    signOut,
    updateUserSettings,
    updateProfile,
    setUserFCMToken,
    addUserConnectedDevice,
    removeUserConnectedDevice,
    forgotPassword,
    deleteAccount,
    verifyToken,
  };
};

export default useApi;