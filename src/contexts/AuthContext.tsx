import { useRouter } from 'next/router';
import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useApi } from '@/lib/AuthApi';
import type { UserState, UserSettings, UserSignupData } from '@/types';
import notificationService from '@/services/CustomNotificationService';

interface AuthContextData {
  user: UserState | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (signupData: UserSignupData) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<UserSettings>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const api = useApi();

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      setUser(response);
      router.push('/globescreen');
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }, [api, router]);

  const signup = useCallback(async (signupData: UserSignupData) => {
    try {
      const response = await api.signUp(signupData);
      setUser(response);
      router.push('/globescreen');
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }, [api, router]);

  const signOut = useCallback(async () => {
    try {
      await api.signOut();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, [api, router]);

  const deleteAccount = useCallback(async (password: string) => {
    try {
      await api.deleteAccount(password);
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  }, [api, router]);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      await api.forgotPassword(email);
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }, [api]);

  const updateUserSettings = useCallback(async (settings: Partial<UserSettings>) => {
    try {
      const updatedSettings = await api.updateUserSettings(settings);
      setUser(prev => prev ? { ...prev, settings: updatedSettings } : null);
      return updatedSettings;
    } catch (error) {
      console.error('Update settings error:', error);
      throw error;
    }
  }, [api]);

  // Initialize notifications when user changes
  useEffect(() => {
    if (user && api.token) {
      notificationService.initializeNotifications(user, api.token);
    }
  }, [user, api.token]);

  // Handle token persistence and validation
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await api.getSession();
          if (userData) {
            setUser(userData);
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          localStorage.removeItem('token');
        }
      }
    };

    initializeAuth();
  }, [api]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const isValid = await api.validateToken();
        if (isValid && mounted) {
          const userProfile = await api.getUserProfile();
          setUser(userProfile);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [api]);

  // Protected route handling
  useEffect(() => {
    if (!loading) {
      const isPublicRoute = PUBLIC_ROUTES.includes(router.pathname);
      if (!user && !isPublicRoute && router.pathname !== '/') {
        router.push('/login');
      } else if (user && isPublicRoute) {
        router.push('/globescreen');
      }
    }
  }, [user, loading, router]);

  const contextValue = {
    user,
    token: api.token,
    login,
    signup,
    signOut,
    deleteAccount,
    forgotPassword,
    updateUserSettings,
    loading
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextData => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
