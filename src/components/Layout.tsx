import React, { useState, useEffect } from 'react';
import { Menu as MenuIcon, Close as CloseIcon, Dashboard, Person, Settings, Public } from '@mui/icons-material';
import { AppBar, Container, Toolbar, Typography, useTheme, useMediaQuery, Drawer, IconButton, List, ListItem, ListItemText, ListItemIcon, Box, CircularProgress } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { routes } from '@/routes';
import type { NavItem } from '@/types';
import ErrorBoundary from '@/components/ErrorBoundary';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { user, loading } = useAuth();

  // Memoize route checks to prevent unnecessary re-renders
  const routeChecks = React.useMemo(() => {
    const isLoginPage = router.pathname === routes.login;
    const isSplashPage = router.pathname === routes.splashPage;
    const isHomePage = router.pathname === routes.home;
    const isPublicPage = isLoginPage || isSplashPage || isHomePage;
    return { isLoginPage, isSplashPage, isHomePage, isPublicPage };
  }, [router.pathname]);

  const handleDrawerToggle = React.useCallback(() => {
    setMobileOpen(!mobileOpen);
  }, [mobileOpen]);

  const navItems = React.useMemo(() => [
    { label: 'Dashboard', route: 'main' as const, icon: <Dashboard /> },
    { label: 'Profile', route: 'profile' as const, icon: <Person /> },
    { label: 'Settings', route: 'settings' as const, icon: <Settings /> },
    { label: 'Globe', route: 'globescreen' as const, icon: <Public /> },
  ], []);

  const drawer = React.useMemo(() => {
    const handleItemClick = (e: React.MouseEvent<HTMLDivElement>) => {
      handleDrawerToggle();
      e.stopPropagation();
    };

    return (
      <div className="drawer" onClick={handleItemClick}>
        <Typography variant="h6" className="drawer-title">
          1Biome
        </Typography>
        <List>
          {navItems.map((item) => (
            <Link href={routes[item.route]} passHref key={item.route}>
              <ListItem
                component="a"
                className="drawer-item"
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            </Link>
          ))}
        </List>
      </div>
    );
  }, [navItems, handleDrawerToggle]);

  // Show navigation if:
  // 1. User is authenticated AND
  // 2. Not on a public page AND
  // 3. Not in initial loading state
  const showNavigation = Boolean(user) && !routeChecks.isPublicPage && !loading;

  const [isOnline, setIsOnline] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleResize = () => {
      setIsResizing(true);
      setViewportHeight(window.innerHeight);
      // Debounce resizing state
      const timeout = setTimeout(() => setIsResizing(false), 150);
      return () => clearTimeout(timeout);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Show offline warning
  if (!isOnline) {
    return (
      <div className="offline-banner">
        <Typography variant="body2">
          You are currently offline. Some features may be unavailable.
        </Typography>
      </div>
    );
  }

  // Show a minimal layout while loading auth state
  if (loading && !user && !routeChecks.isPublicPage) {
    return (
      <div className="layout-container">
        <div className="loading-container">
          <CircularProgress size={40} />
          <Typography variant="body1" color="textSecondary">
            Loading your experience...
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div 
        className={routeChecks.isLoginPage || routeChecks.isSplashPage ? 'layout-with-background' : 'layout-container'}
      >
        {showNavigation && (
          <AppBar 
            position="fixed" 
            elevation={0} 
            className={`app-bar ${isResizing ? 'resizing' : ''}`}
          >
            <Toolbar className="toolbar">
              <Typography variant="h6" component="div" className="app-bar-title">
                1Biome
              </Typography>
              {isMobile && (
                <IconButton
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                >
                  {mobileOpen ? <CloseIcon /> : <MenuIcon />}
                </IconButton>
              )}
            </Toolbar>
          </AppBar>
        )}

        {showNavigation && isMobile && (
          <Drawer
            variant="temporary"
            anchor="left"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            className="drawer"
            classes={{
              paper: 'drawer-paper',
            }}
          >
            {drawer}
          </Drawer>
        )}

        <Container 
          className={`main-content ${isResizing ? 'resizing' : ''}`}
        >
          {children}
        </Container>
      </div>
    </ErrorBoundary>
  );
};

export default Layout;
