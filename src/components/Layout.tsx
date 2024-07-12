import React, { useMemo } from 'react';
import { AppBar, Box, Container, Toolbar, Typography, useTheme, useMediaQuery, Drawer, IconButton, List, ListItem, ListItemText } from '@mui/material';
import { Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';
import Navigation from './Navigation';
import { useAuth } from '@/context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { loading, user } = useAuth();

  const isLoginPage = router.pathname === '/login' || router.pathname === '/signup';
  const isHomePage = router.pathname === '/';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = useMemo(() => (
  <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
    <Typography variant="h6" sx={{ my: 2, fontWeight: 'bold', color: theme.palette.primary.main }}>
      1Biome
    </Typography>
    <List>
      {['Home', 'Profile', 'Settings'].map((item) => (
        <ListItem button key={item} onClick={() => router.push(`/${item.toLowerCase()}`)}>
          <ListItemText primary={item} />
        </ListItem>
      ))}
    </List>
  </Box>
), [theme.palette.primary.main, handleDrawerToggle, router]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isLoginPage && !isHomePage && user && (
        <AppBar position="static" elevation={0} sx={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
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
          ...(isLoginPage && {
            backgroundImage: 'url("/night-sky.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }),
        }}
      >
        {children}
      </Container>
    </Box>
  );
};

export default Layout;