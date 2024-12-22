import { 
  useState, 
  ReactNode, 
  useEffect, 
  useMemo, 
  Suspense, 
  lazy 
} from 'react';

import {
  useTheme,
  useMediaQuery,
  CircularProgress,
  Typography,
  Stack,
  Container,
  Fade,
  Backdrop,
  useScrollTrigger
} from '@mui/material';

import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { routes } from '@/routes';

import Header from '../components/Header';
import OfflineNotice, { useOnlineStatus } from '../components/OfflineNotice';

const Footer = lazy(() => import('../components/Footer'));

const HEADER_HEIGHT = {
  mobile: 56,
  tablet: 64,
  desktop: 72
};

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [mobileOpen, setMobileOpen] = useState(false);

  const { user, loading } = useAuth();
  const isOnline = useOnlineStatus();
  const scrollTrigger = useScrollTrigger();

  const publicRoutes = [routes.login] as const;
  const isPublicPage = publicRoutes.includes(
    router.pathname as typeof routes.login
  );

  const showNavigation = Boolean(user) && !isPublicPage && !loading;

  const layoutValues = useMemo(
    () => ({
      headerHeight: isDesktop
        ? HEADER_HEIGHT.desktop
        : isTablet
        ? HEADER_HEIGHT.tablet
        : HEADER_HEIGHT.mobile,
    }),
    [isDesktop, isTablet]
  );

  useEffect(() => {
    if (!isDesktop) {
      setMobileOpen(false);
    }
  }, [router.pathname, isDesktop]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  if (!isOnline) return <OfflineNotice />;

  if (loading && !user && !isPublicPage) {
    return (
      <Backdrop open={true}>
        <Stack direction="column" alignItems="center" spacing={2}>
          <CircularProgress size={40} />
          <Typography variant="h6">
            Loading your environment...
          </Typography>
        </Stack>
      </Backdrop>
    );
  }

  return (
    <Container disableGutters maxWidth={false}>
      {showNavigation && (
        <Header
          isMobile={!isDesktop}
          onDrawerToggle={handleDrawerToggle}
          mobileOpen={mobileOpen}
          headerHeight={layoutValues.headerHeight}
          elevated={scrollTrigger}
          drawerWidth={240}
        />
      )}
      <Container component="main">
        <Fade in={true} timeout={1000}>
          <div>{children}</div>
        </Fade>
        <Suspense fallback={<div>Loading footer...</div>}>
          <Footer />
        </Suspense>
      </Container>
    </Container>
  );
}

export default Layout;
