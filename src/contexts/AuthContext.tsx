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
      setLoading(true);
      const response = await api.login(email, password);
      if (response) {
        setUser(response);
        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        // Use replace instead of push to prevent back button issues
        await router.replace('/globescreen');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [api, router]);

  const signup = useCallback(async (signupData: UserSignupData) => {
    try {
      setLoading(true);
      const response = await api.signUp(signupData);
      setUser(response);
      // Wait for state to update before redirecting
      await new Promise(resolve => setTimeout(resolve, 0));
      router.push('/globescreen');
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
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

  // Auth initialization
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token && mounted) {
          const userProfile = await api.getUserProfile();
          if (userProfile && mounted) {
            setUser(userProfile);
            // Redirect if on a public route
            const isPublicRoute = PUBLIC_ROUTES.includes(router.pathname);
            if (isPublicRoute) {
              await router.replace('/globescreen');
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('token');
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
  }, [api, router]);

  // Protected route handling
  useEffect(() => {
    const handleRouting = async () => {
      if (!loading) {
        const isPublicRoute = PUBLIC_ROUTES.includes(router.pathname);
        const token = localStorage.getItem('token');
        
        if (!user && !isPublicRoute && router.pathname !== '/') {
          // Redirect to login if not authenticated and not on a public route
          await router.replace('/login');
        } else if (user && isPublicRoute) {
          // Redirect to globescreen if authenticated and on a public route
          await router.replace('/globescreen');
        } else if (token && !user) {
          // Try to restore session if token exists but no user
          try {
            const userData = await api.getSession();
            if (userData) {
              setUser(userData);
              if (isPublicRoute) {
                await router.replace('/globescreen');
              }
            } else {
              // Invalid token, clean up and redirect
              localStorage.removeItem('token');
              if (!isPublicRoute) {
                await router.replace('/login');
              }
            }
          } catch (error) {
            console.error('Session restoration failed:', error);
            localStorage.removeItem('token');
            if (!isPublicRoute) {
              await router.replace('/login');
            }
          }
        }
      }
    };

    handleRouting();
  }, [user, loading, router, api]);

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
