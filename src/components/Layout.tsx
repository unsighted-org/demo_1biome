
import { Menu as MenuIcon, Close as CloseIcon, Dashboard, Person, Settings, Public } from '@mui/icons-material';
import { AppBar, Box, Container, Toolbar, Typography, useTheme, useMediaQuery, Drawer, IconButton, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useRoutes } from '@/hooks/useRoutes';

import Navigation from './Navigation';

import type { NavItem, AppRoutes } from '@/types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { loading, user } = useAuth();
  const { routes } = useRoutes();

  const isLoginPage = router.pathname === '/login';
  const isSplashPage = router.pathname === '/splashPage';
  const isHomePage = router.pathname === '/';

  const handleDrawerToggle = useCallback(() => {
    setMobileOpen((prevMobileOpen) => !prevMobileOpen);
  }, [setMobileOpen]);

  const drawer = useMemo(() => {
    const navItems: NavItem[] = [
      { route: 'main', label: 'Main', icon: <Dashboard /> },
      { route: 'profile', label: 'Profile', icon: <Person /> },
      { route: 'settings', label: 'Settings', icon: <Settings /> },
      { route: 'globescreen', label: 'Globe', icon: <Public /> },
      { route: 'stats', label: 'Stats', icon: <Settings /> },
    ];

    if (!user) {
      navItems.push({ route: 'splashPage', label: 'Join Waitlist', icon: <Person /> });
    } else if (isLoginPage) {
      navItems.push({ route: 'login', label: 'Login', icon: <Person /> });
    }

    return (
      <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
        <Typography variant="h6" sx={{ my: 2, fontWeight: 'bold', color: theme.palette.primary.main }}>
          1Biome
        </Typography>
        <List>
          {navItems.map((item) => (
            <ListItem
              button
              key={item.route}
              component={Link}
              href={routes[item.route as keyof AppRoutes]}
              onClick={handleDrawerToggle}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  }, [theme.palette.primary.main, handleDrawerToggle, routes, user, isLoginPage]);

  useEffect(() => {
    // Add any side effects or subscriptions here
    // For example, you can fetch data or subscribe to events
    // Remember to clean up any resources in the cleanup function
    return () => {
      // Cleanup function
    };
  }, []);

  const showNavigation = !isLoginPage && !isSplashPage && !isHomePage && user;

   return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        ...(isLoginPage || isSplashPage ? {
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url("/night-sky.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: -1,
          }
        } : {})
      }}
    >
      {showNavigation && (
        <AppBar position="static" elevation={0} sx={{ backgroundColor: 'rgba(250, 243, 224, 0)' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
              1Biome
            </Typography>
            {isMobile ? (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { sm: 'none' } }}
              >
                {mobileOpen ? <CloseIcon /> : <MenuIcon />}
              </IconButton>
            ) : (
              <Navigation />
            )}
          </Toolbar>
        </AppBar>
      )}
      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Container
        component="main"
        maxWidth={false}
        disableGutters
        sx={{
          flex: 1,
          py: 4,
          px: 2,
          ...(isLoginPage || isSplashPage ? {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            width: '100%',
            margin: 0,
            padding: 0,
            overflow: 'hidden',
          } : {}),
        }}
      >
        {children}
      </Container>
    </Box>
  );
};

export default Layout;
