import { useRouter } from 'next/router';
import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import useApi from '@/lib/api';
import type { UserState, UserSettings, UserSignupData } from '@/types';
import { notificationService } from '@/services/CustomNotificationService';

interface AuthContextData {
  user: UserState | null;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
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
  const {
    signIn: apiSignIn,
    signUp: apiSignUp,
    signOut: apiSignOut,
    deleteAccount: apiDeleteAccount,
    updateUserSettings: apiUpdateUserSettings,
    token,
    setToken,
    forgotPassword: apiForgotPassword,
    validateToken,
    getUserProfile,
  } = useApi();

  // Initialize notifications when user changes
  useEffect(() => {
    let mounted = true;

    const initializeNotifications = async () => {
      if (typeof window !== 'undefined' && user) {
        try {
          await notificationService.initializeNotifications(user, user.token);
        } catch (error) {
          console.error('Failed to initialize notification service:', error);
        }
      }
    };

    if (user) {
      initializeNotifications();
    }

    return () => {
      mounted = false;
    };
  }, [user]);

  // Handle token persistence and validation
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          setToken(storedToken);
          const isValid = await validateToken();
          if (isValid) {
            const userProfile = await getUserProfile();
            setUser(userProfile);
          } else {
            localStorage.removeItem('token');
            setToken(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [setToken, validateToken, getUserProfile]);

  // Protected route handling
  useEffect(() => {
    if (!loading) {
      const isPublicRoute = PUBLIC_ROUTES.includes(router.pathname);
      if (!user && !isPublicRoute) {
        router.push('/login');
      } else if (user && isPublicRoute) {
        router.push('/globescreen');
      }
    }
  }, [user, loading, router]);

  const handleSignIn = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      const userState = await apiSignIn(email, password);
      localStorage.setItem('token', userState.token);
      setUser(userState);
      router.push('/globescreen');
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }, [apiSignIn, router]);

  const handleSignup = useCallback(async (signupData: UserSignupData): Promise<void> => {
    try {
      const userState = await apiSignUp(signupData);
      localStorage.setItem('token', userState.token);
      setUser(userState);
      router.push('/globescreen');
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }, [apiSignUp, router]);

  const handleSignOut = useCallback(async (): Promise<void> => {
    try {
      await apiSignOut();
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
      router.push('/login');
    }
  }, [apiSignOut, router, setToken]);

  const handleDeleteAccount = useCallback(async (password: string): Promise<void> => {
    try {
      await apiDeleteAccount(password);
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
      router.push('/');
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  }, [apiDeleteAccount, router, setToken]);

  const handleUpdateUserSettings = useCallback(async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    try {
      const updatedSettings = await apiUpdateUserSettings(settings);
      setUser(prevUser => prevUser ? { ...prevUser, settings: updatedSettings } : prevUser);
      return updatedSettings;
    } catch (error) {
      console.error('Update user settings error:', error);
      throw error;
    }
  }, [apiUpdateUserSettings]);

  const value = {
    user,
    token,
    signIn: handleSignIn,
    signup: handleSignup,
    signOut: handleSignOut,
    deleteAccount: handleDeleteAccount,
    updateUserSettings: handleUpdateUserSettings,
    forgotPassword: apiForgotPassword,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextData => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
