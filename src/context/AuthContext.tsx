import { useRouter } from 'next/router';
import { createContext, useState, useContext, useEffect, useCallback } from 'react';

import useApi from '@/lib/AuthApi';

import type { UserState, UserSettings, UserSignupData } from '@/types';

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
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
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
  } = useApi();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      // TODO: Verify token and fetch user data
      // This could be an API call to get user data using the token
    }
    setLoading(false);
  }, [setToken]);

  const handleSignIn = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      const userState = await signIn(email, password);
      setUser(userState);
      router.push('/globescreen');
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }, [signIn, router]);

  const handleSignup = useCallback(async (signupData: UserSignupData): Promise<void> => {
    try {
      const userState = await signUp(signupData);
      setUser(userState);
      router.push('/globescreen');
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }, [signUp, router]);

  const handleSignOut = useCallback(async (): Promise<void> => {
    try {
      await signOut();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, [signOut, router]);

  const handleDeleteAccount = useCallback(async (password: string): Promise<void> => {
    try {
      await deleteAccount(password);
      setUser(null);
      localStorage.removeItem('token'); // Clear the token from local storage
      router.push('/');
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  }, [deleteAccount, router]);

  const handleUpdateUserSettings = useCallback(async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    try {
      const updatedSettings = await updateUserSettings(settings);
      setUser(prevUser => prevUser ? { ...prevUser, settings: updatedSettings } : prevUser);
      return updatedSettings;
    } catch (error) {
      console.error('Update user settings error:', error);
      throw error;
    }
  }, [updateUserSettings]);

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
