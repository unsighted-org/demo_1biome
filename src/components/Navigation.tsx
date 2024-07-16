import { Public, Dashboard, Person, Settings } from '@mui/icons-material';
import { Button, Box, useTheme, useMediaQuery } from '@mui/material';
import Link from 'next/link';
import React from 'react';

import { useAuth } from '@/context/AuthContext';
import { useRoutes } from '@/hooks/useRoutes';

import type { NavItem } from '@/types';

export default function Navigation(): React.ReactNode {
  const { routes, currentRoute } = useRoutes();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();

  const navItems: NavItem[] = [
    { route: 'main', label: 'Main', icon: <Dashboard /> },
    { route: 'profile', label: 'Profile', icon: <Person /> },
    { route: 'settings', label: 'Settings', icon: <Settings /> },
    { route: 'globescreen', label: 'Globe', icon: <Public /> },
    { route: 'stats', label: 'Stats', icon: <Settings /> },
  ];

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {navItems.map((item) => (
        <Button
          key={item.route}
          color="inherit"
          component={Link}
          href={routes[item.route]}
          variant={currentRoute === item.route ? 'contained' : 'text'}
          startIcon={item.icon}
          sx={{
            borderRadius: '20px',
            textTransform: 'none',
            px: isMobile ? 1 : 2,
            py: 1,
            '&.MuiButton-contained': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
              },
            },
          }}
        >
          {!isMobile && item.label}
        </Button>
      ))}
    </Box>
  );
}
