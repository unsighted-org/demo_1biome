import { useRouter } from 'next/router';
import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { notificationService, setUser, clearUser, RootState, updateSettings as updateSettingsAction } from '@/store';
import useApi from '@/lib/api';
import type { UserState, UserSettings, UserSignupData } from '@/types';
import { useDispatch, useSelector } from 'react-redux';
import Cookies from 'js-cookie';


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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const router = useRouter();
  const {
    signIn,
    signUp,
    signOut,
    deleteAccount,
    updateUserSettings,
    token,
    setToken,
    forgotPassword: apiForgotPassword,
    verifyToken,
  } = useApi();

  useEffect(() => {
    const storedToken = Cookies.get('auth_token');
    if (storedToken) {
      const verifyTokenAndFetchUserData = async () => {
        try {
          console.log('Verifying token and fetching user data');
          const userData = await verifyToken(storedToken);
          console.log('User data fetched:', userData);
          dispatch(setUser(userData));
          notificationService.setAuthContext(userData, storedToken);
          await notificationService.init();
        } catch (error) {
          console.error('Token verification failed:', error);
          Cookies.remove('auth_token');
          dispatch(clearUser());
        } finally {
          setLoading(false);
        }
      };
      verifyTokenAndFetchUserData();
    } else {
      console.log('No stored token found');
      setLoading(false);
    }
  }, [dispatch, verifyToken]);

  const handleSignIn = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      console.log('Signing in...');
      const userState = await signIn(email, password);
      console.log('Sign in successful, user state:', userState);
      dispatch(setUser(userState));
      Cookies.set('auth_token', userState.token, { expires: 7 });
      console.log('Token set in cookie');
      console.log('Initializing notification service after sign in');
      notificationService.setAuthContext(userState, userState.token);
      console.log('Auth context set in notification service');
      await notificationService.init();
      console.log('Notification service initialized');
      console.log('Redirecting to /globescreen');
      router.push('/globescreen');
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }, [signIn, router, dispatch]);

  const handleSignup = useCallback(async (signupData: UserSignupData): Promise<void> => {
    try {
      console.log('Signing up...');
      const userState = await signUp(signupData);
      console.log('Sign up successful, user state:', userState);
      dispatch(setUser(userState));
      Cookies.set('auth_token', userState.token, { expires: 7 });
      console.log('Initializing notification service after sign up');
      await notificationService.setAuthContext(userState, userState.token);
      await notificationService.init();
      router.push('/globescreen');
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }, [signUp, router, dispatch]);

  const handleSignOut = useCallback(async (): Promise<void> => {
    try {
      await signOut();
      dispatch(clearUser());
      Cookies.remove('auth_token');
      await notificationService.revokeNotificationToken('');
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, [signOut, router, dispatch]);

  const handleDeleteAccount = useCallback(async (password: string): Promise<void> => {
    try {
      await deleteAccount(password);
      dispatch(clearUser());
      Cookies.remove('auth_token');
      localStorage.removeItem('token');
      router.push('/');
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  }, [deleteAccount, router, dispatch]);

  const handleUpdateUserSettings = useCallback(async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    try {
      const updatedSettings = await updateUserSettings(settings);
      dispatch(updateSettingsAction(updatedSettings));
      
      // Handle notification preferences update
      if (settings.notificationPreferences) {
        notificationService.updateUserPreferences(settings.notificationPreferences);
      }
      
      return updatedSettings;
    } catch (error) {
      console.error('Update user settings error:', error);
      throw error;
    }
  }, [updateUserSettings, dispatch]);

  const handleForgotPassword = useCallback(async (email: string): Promise<void> => {
    try {
      await apiForgotPassword(email);
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }, [apiForgotPassword]);

  return (
    <AuthContext.Provider value={{
      user: useSelector((state: RootState) => state.user),
      token,
      signIn: handleSignIn,
      signup: handleSignup,
      signOut: handleSignOut,
      deleteAccount: handleDeleteAccount,
      updateUserSettings: handleUpdateUserSettings,
      forgotPassword: handleForgotPassword,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextData => useContext(AuthContext);

export default AuthContext;
