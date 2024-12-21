import { Public, Dashboard, Person, Settings, Timeline, Favorite, Notifications } from '@mui/icons-material';
import { Button, Box, useTheme, useMediaQuery, Badge, Tooltip, IconButton } from '@mui/material';
import Link from 'next/link';
import React, { useMemo, useCallback } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useHealth } from '@/contexts/HealthContext';
import { useRoutes } from '@/hooks/useRoutes';
import { useNotifications } from '@/hooks/useNotifications';

import type { NavItem } from '@/types';

export default function Navigation(): React.ReactNode {
  const { routes, currentRoute } = useRoutes();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const { displayMetric, loading, error } = useHealth();
  const { unreadCount, toggleNotifications } = useNotifications();

  const handleNotificationsClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    toggleNotifications();
  }, [toggleNotifications]);

  const navItems: NavItem[] = useMemo(() => [
    { 
      route: 'main',
      label: 'Dashboard',
      icon: <Dashboard />,
      tooltip: 'View your dashboard'
    },
    { 
      route: 'globescreen',
      label: 'Globe',
      icon: <Public />,
      tooltip: 'Interactive health globe'
    },
    { 
      route: 'stats',
      label: 'Health Stats',
      icon: <Timeline />,
      tooltip: 'View health statistics'
    },
    { 
      route: 'profile',
      label: 'Profile',
      icon: <Person />,
      tooltip: 'Your profile'
    },
    { 
      route: 'settings',
      label: 'Settings',
      icon: <Settings />,
      tooltip: 'App settings'
    },
  ], []);

  if (!user) {
    return null;
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        gap: 1,
        flexWrap: 'nowrap',
        overflowX: 'auto',
        alignItems: 'center',
        '&::-webkit-scrollbar': {
          display: 'none'
        },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none'
      }}
    >
      {navItems.map((item) => (
        <Tooltip key={item.route} title={isMobile ? item.tooltip : ''} arrow>
          <Button
            color="inherit"
            component={Link}
            href={routes[item.route]}
            variant={currentRoute === item.route ? 'contained' : 'text'}
            startIcon={
              item.route === 'globescreen' && !loading && !error ? (
                <Badge 
                  color="secondary" 
                  variant="dot"
                  invisible={!displayMetric}
                >
                  {item.icon}
                </Badge>
              ) : item.icon
            }
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              px: isMobile ? 1 : 2,
              py: 1,
              minWidth: isMobile ? '48px' : 'auto',
              whiteSpace: 'nowrap',
              transition: theme.transitions.create(['background-color', 'box-shadow'], {
                duration: theme.transitions.duration.short,
              }),
              '&.MuiButton-contained': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.2)' 
                  : 'rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.3)'
                    : 'rgba(0, 0, 0, 0.2)',
                  boxShadow: theme.shadows[2],
                },
              },
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)',
                boxShadow: theme.shadows[1],
              },
            }}
          >
            {!isMobile && item.label}
          </Button>
        </Tooltip>
      ))}
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={handleNotificationsClick}
          sx={{
            ml: 'auto',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.05)',
            },
          }}
        >
          <Badge 
            badgeContent={unreadCount} 
            color="error"
            max={99}
          >
            <Notifications />
          </Badge>
        </IconButton>
      </Tooltip>
    </Box>
  );
}
