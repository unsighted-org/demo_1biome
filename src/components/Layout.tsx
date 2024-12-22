import { useState, ReactNode, useEffect, useMemo } from 'react';
import {
  useTheme,
  useMediaQuery,
  Drawer,
  CircularProgress,
  Typography,
  Stack,
  Box,
  Fade,
  SwipeableDrawer,
  Backdrop,
  useScrollTrigger
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { routes } from '@/routes';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Navigation from '../components/Navigation';
import OfflineNotice, { useOnlineStatus } from '../components/OfflineNotice';

// Responsive drawer widths
const DRAWER_WIDTH = {
  mobile: 280,
  tablet: 320,
  desktop: 340
};

// Header heights
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
  const isPublicPage = publicRoutes.includes(router.pathname as typeof routes.login);
  const showNavigation = Boolean(user) && !isPublicPage && !loading;

  // Get responsive values based on screen size
  const layoutValues = useMemo(() => ({
    drawerWidth: isDesktop ? DRAWER_WIDTH.desktop : 
                 isTablet ? DRAWER_WIDTH.tablet : 
                 DRAWER_WIDTH.mobile,
    headerHeight: isDesktop ? HEADER_HEIGHT.desktop :
                 isTablet ? HEADER_HEIGHT.tablet :
                 HEADER_HEIGHT.mobile,
    contentPadding: isDesktop ? theme.spacing(4) :
                   isTablet ? theme.spacing(3) :
                   theme.spacing(2)
  }), [isDesktop, isTablet, theme]);

  // Close drawer on route change in mobile/tablet view
  useEffect(() => {
    if (!isDesktop) {
      setMobileOpen(false);
    }
  }, [router.pathname, isDesktop]);

  if (!isOnline) return <OfflineNotice />;

  if (loading && !user && !isPublicPage) {
    return (
      <Backdrop open={true} sx={{ color: '#fff', zIndex: theme.zIndex.drawer + 1 }}>
        <Stack direction="column" alignItems="center" spacing={2}>
          <CircularProgress size={40} color="inherit" />
          <Typography variant="h6" color="inherit">
            Loading your environment...
          </Typography>
        </Stack>
      </Backdrop>
    );
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Navigation
      router={router}
      onClose={handleDrawerToggle}
      drawerWidth={layoutValues.drawerWidth}
    />
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      bgcolor: theme.palette.background.default
    }}>
      {showNavigation && (
        <>
          <Header
            isMobile={!isDesktop}
            drawerWidth={layoutValues.drawerWidth}
            onDrawerToggle={handleDrawerToggle}
            mobileOpen={mobileOpen}
            headerHeight={layoutValues.headerHeight}
            elevated={scrollTrigger}
          />
          {isDesktop ? (
            <Drawer
              variant="permanent"
              sx={{
                width: layoutValues.drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                  width: layoutValues.drawerWidth,
                  boxSizing: 'border-box',
                  borderRight: `1px solid ${theme.palette.divider}`,
                  bgcolor: theme.palette.background.paper,
                  backgroundImage: 'none'
                },
              }}
              open
            >
              {drawer}
            </Drawer>
          ) : (
            <SwipeableDrawer
              variant="temporary"
              anchor={theme.direction === 'rtl' ? 'right' : 'left'}
              open={mobileOpen}
              onClose={handleDrawerToggle}
              onOpen={() => setMobileOpen(true)}
              ModalProps={{ keepMounted: true }}
              sx={{
                '& .MuiDrawer-paper': {
                  width: layoutValues.drawerWidth,
                  boxSizing: 'border-box',
                  bgcolor: theme.palette.background.paper,
                  backgroundImage: 'none'
                },
              }}
            >
              {drawer}
            </SwipeableDrawer>
          )}
        </>
      )}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: layoutValues.contentPadding,
          width: { sm: `calc(100% - ${layoutValues.drawerWidth}px)` },
          ml: { sm: `${layoutValues.drawerWidth}px` },
          mt: showNavigation ? `${layoutValues.headerHeight}px` : 0,
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Fade in={true} timeout={1000}>
          <div>
            {children}
          </div>
        </Fade>
        <Footer />
      </Box>
    </Box>
  );
}

export default Layout;