import React from 'react';
import { Menu as MenuIcon, Close as CloseIcon, Dashboard, Person, Settings, Public } from '@mui/icons-material';
import { AppBar, Container, Toolbar, Typography, useTheme, useMediaQuery, Drawer, IconButton, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { routes } from '@/routes';
import type { NavItem } from '@/types';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { user } = useAuth();
  const isLoginPage = router.pathname === routes.login;
  const isSplashPage = router.pathname === routes.splashPage;
  const isHomePage = router.pathname === routes.home;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navItems: NavItem[] = [
    { label: 'Dashboard', route: 'main', icon: <Dashboard /> },
    { label: 'Profile', route: 'profile', icon: <Person /> },
    { label: 'Settings', route: 'settings', icon: <Settings /> },
    { label: 'Globe', route: 'globescreen', icon: <Public /> },
  ];

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
                component="button"
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
  }, [navItems]);

  const showNavigation = !isLoginPage && !isSplashPage && !isHomePage && user;

  return (
    <div className={isLoginPage || isSplashPage ? 'layout-with-background' : 'layout-container'}>
      {showNavigation && (
        <AppBar position="static" elevation={0} className="app-bar">
          <Toolbar className="toolbar">
            <Typography variant="h6" component="div" className="app-bar-title">
              1Biome
            </Typography>
            {isMobile && (
              <IconButton
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                className="menu-button"
              >
                {mobileOpen ? <CloseIcon /> : <MenuIcon />}
              </IconButton>
            )}
          </Toolbar>
        </AppBar>
      )}
      <nav className="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          className="drawer-mobile"
        >
          {drawer}
        </Drawer>
      </nav>
      <Container
        component="main"
        maxWidth={false}
        disableGutters
        className={`main-container ${isLoginPage ? 'login-page' : ''} ${isSplashPage ? 'splash-page' : ''}`}
      >
        {children}
      </Container>
    </div>
  );
};

export default Layout;
