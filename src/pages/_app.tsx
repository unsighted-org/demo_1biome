import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { SessionProvider } from 'next-auth/react';
import { Provider as ReduxProvider } from 'react-redux';
import ErrorBoundary from '../components/ErrorBoundary';
import Layout from '../components/Layout';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { HealthProvider } from '../contexts/HealthContext';
import { store } from '../store';
import theme from '../styles/theme';
import type { AppProps } from 'next/app';
import '../styles/globals.css';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps): JSX.Element {
  return (
    <SessionProvider session={session}>
      <ReduxProvider store={store}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <NotificationProvider>
              <HealthProvider>
                <ErrorBoundary>
                  <Layout>
                    <Component {...pageProps} />
                  </Layout>
                </ErrorBoundary>
              </HealthProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </ReduxProvider>
    </SessionProvider>
  );
}

export default MyApp;