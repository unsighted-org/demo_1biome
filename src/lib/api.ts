import axios, { AxiosInstance } from 'axios';
import { useState, useCallback } from 'react';
import type { UserSettings, UserState, UserSignupData } from '@/types';

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
  signIn: (email: string, password: string) => Promise<UserState>;
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
}

export const useApi = (): UseApiReturn => {
  const [token, setLocalToken] = useState<string | null>(null);
  const { instance: api, setToken: setApiToken } = createApi(token);

  const setToken = useCallback((newToken: string | null): void => {
    setLocalToken(newToken);
    setApiToken(newToken);
  }, [setApiToken]);

  const signIn = useCallback(async (email: string, password: string): Promise<UserState> => {
    const response = await api.post<UserState>('/auth/signin', { email, password });
    setToken(response.data.token);
    return response.data;
  }, [api, setToken]);

  const signUp = useCallback(async (signupData: UserSignupData): Promise<UserState> => {
    const formData = new FormData();
    formData.append('signupData', JSON.stringify(signupData));
    if (signupData.avatarFile) {
      formData.append('avatar', signupData.avatarFile);
    }

    const response = await api.post<UserState>('/auth/signup', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setToken(response.data.token);
    return response.data;
  }, [api, setToken]);

  const signOut = useCallback(async (): Promise<void> => {
    await api.post('/auth/signout');
    setToken(null);
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

  const verifyToken = useCallback(async (token: string): Promise<UserState> => {
  try {
    const response = await api.post<UserState>('/api/auth/verify-token', { token });
    return response.data;
  } catch (error) {
    console.error('Failed to verify token:', error);
    throw error;
  }
}, [api]);

  return {
    signIn,
    signUp,
    signOut,
    token,
    setToken,
    updateUserSettings,
    updateProfile,
    setUserFCMToken,
    addUserConnectedDevice,
    removeUserConnectedDevice,
    forgotPassword,
    deleteAccount,
    verifyToken,
    instance: api,
  };
};

export default useApi;