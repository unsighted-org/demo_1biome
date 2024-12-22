import React from 'react';
import { useRouter } from 'next/router';
import { AppBar, Box, Button, Container, IconButton, Toolbar, Typography } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { signOut, useSession } from 'next-auth/react';

type NavItem = {
  label: string;
  path: string;
  requiresAuth: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/', requiresAuth: false },
  { label: 'Dashboard', path: '/dashboard', requiresAuth: true },
  { label: 'Profile', path: '/profile', requiresAuth: true },
  { label: 'Settings', path: '/settings', requiresAuth: true },
];

const NavButton: React.FC<{
  label: string;
  path: string;
  onClick: (path: string) => void;
}> = ({ label, path, onClick }) => (
  <Button
    color="inherit"
    onClick={() => onClick(path)}
    sx={{ mx: 1 }}
  >
    {label}
  </Button>
);

export default function Navigation() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  const isAuthenticated = status === 'authenticated' && session;

  const handleNavigation = React.useCallback((path: string) => {
    router.push(path);
  }, [router]);

  return (
    <AppBar position="static" color="primary">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'flex' } }}
          >
            1Biome
          </Typography>

          <Box display="flex" alignItems="center" component="div">
            {NAV_ITEMS
              .filter(item => !item.requiresAuth || isAuthenticated)
              .map(item => (
                <NavButton
                  key={item.path}
                  label={item.label}
                  path={item.path}
                  onClick={handleNavigation}
                />
              ))}
            {isAuthenticated ? (
              <Button color="inherit" onClick={handleSignOut}>
                Sign Out
              </Button>
            ) : (
              <Button color="inherit" onClick={() => handleNavigation('/login')}>
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
