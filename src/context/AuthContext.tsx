import { useRouter } from 'next/router';
import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { notificationService, setUser, clearUser, RootState, updateSettings as updateSettingsAction, clearHealthData } from '@/store';
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
  const user = useSelector((state: RootState) => state.user);
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
      verifyTokenAndFetchUserData(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyTokenAndFetchUserData = async (token: string) => {
    try {
      const userData = await verifyToken(token);
      dispatch(setUser(userData));
      notificationService.setAuthContext(userData, token);
      await notificationService.init();
    } catch (error) {
      console.error('Token verification failed:', error);
      Cookies.remove('auth_token');
      dispatch(clearUser());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      const isPublicPage = ['/login', '/signup', '/', '/splashPage'].includes(router.pathname);
      if (user && user.id) {
        if (isPublicPage) {
          router.push('/globescreen');
        }
      } else if (!isPublicPage) {
        router.push('/login');
      }
    }
  }, [user, loading, router.pathname]);

  const handleSignIn = useCallback(async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const userState = await signIn(email, password);
      dispatch(setUser(userState));
      Cookies.set('auth_token', userState.token, { expires: 7 });
      await notificationService.setAuthContext(userState, userState.token);
      await notificationService.init();
      router.push('/globescreen');
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [signIn, dispatch, router]);

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
    setLoading(true);
    try {
      await signOut();
      dispatch(clearUser());
      dispatch(clearHealthData());
      Cookies.remove('auth_token');
      await notificationService.revokeNotificationToken('');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
      window.location.href = '/login';
    }
  }, [signOut, dispatch]);

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
      user,
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
