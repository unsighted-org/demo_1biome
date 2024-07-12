import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import ErrorBoundary from '../components/ErrorBoundary';
import Layout from '../components/Layout';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { store, notificationService } from '../store';
import theme from '../styles/theme';
import type { AppProps } from 'next/app';
import '../styles/globals.css';

function ServiceWorkerRegistration(): JSX.Element {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js').then(
          function(registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
          },
          function(err) {
            console.log('ServiceWorker registration failed: ', err);
          }
        );
      });
    }
  }, []);
  return <></>;
}

function NotificationInitializer(): JSX.Element {
  const { user } = useAuth();
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      console.log('User authenticated, initializing notification service');
      notificationService.setAuthContext(user, user.token);
      console.log('Auth context set in NotificationService');
      notificationService.init()
        .then(() => {
          console.log('Notification service initialized successfully');
        })
        .catch(error => {
          console.error('Failed to initialize notification service:', error);
        });
    }
  }, [user]);
  return <></>;
}

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps): JSX.Element {
  return (
    <SessionProvider session={session}>
      <ReduxProvider store={store}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <ServiceWorkerRegistration />
            <NotificationInitializer />
            <Layout>
              <ErrorBoundary>
                <Component {...pageProps} />
              </ErrorBoundary>
            </Layout>
          </AuthProvider>
        </ThemeProvider>
      </ReduxProvider>
    </SessionProvider>
  );
}

export default MyApp;