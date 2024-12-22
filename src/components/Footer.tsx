import React, { useState, Suspense, lazy } from 'react';
import { 
  Container, 
  Typography, 
  BottomNavigation, 
  BottomNavigationAction 
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { routes } from '@/routes';

// Lazy-import icons for better performance
const DashboardIcon = lazy(() => import('@mui/icons-material/Dashboard'));
const PublicIcon = lazy(() => import('@mui/icons-material/Public'));
const PersonIcon = lazy(() => import('@mui/icons-material/Person'));
const SettingsIcon = lazy(() => import('@mui/icons-material/Settings'));

const navItems = [
  { label: 'Dashboard', route: 'dashboard', icon: <DashboardIcon /> },
  { label: 'Profile',   route: 'profile',   icon: <PersonIcon /> },
  { label: 'Settings',  route: 'settings',  icon: <SettingsIcon /> },
  { label: 'Globe',     route: 'globescreen', icon: <PublicIcon /> },
] as const;

const Footer = () => {
  const [value, setValue] = useState(0);
  const router = useRouter();

  type RouteKeys = keyof typeof routes;

  const handleNavClick = (route: RouteKeys) => {
    router.push(routes[route]);
  };

  return (
    <Container component="footer" maxWidth={false} className="footer-container">
      <Typography variant="body2" className="footer-text">
        {new Date().getFullYear()} 1Biome. All rights reserved.
      </Typography>

      <BottomNavigation
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
          handleNavClick(navItems[newValue].route);
        }}
        showLabels
        className="bottom-navigation"
      >
        {navItems.map(({ label, icon }, index) => (
          // Suspense boundary for each icon
          <Suspense fallback={<div>Loading icon...</div>} key={index}>
            <BottomNavigationAction label={label} icon={icon} />
          </Suspense>
        ))}
      </BottomNavigation>
    </Container>
  );
};

export default Footer;
