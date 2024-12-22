import React from 'react';
import { useRouter } from 'next/router';
import { List, ListItemIcon, ListItemText, Typography, ListItemButton } from '@mui/material';
import { Dashboard, Public, Person, Settings } from '@mui/icons-material';
import type { NextRouter } from 'next/router';
import { routes } from '@/routes';

const navItems = [
  { label: 'Dashboard', route: 'dashboard', icon: <Dashboard /> },
  { label: 'Profile', route: 'profile', icon: <Person /> },
  { label: 'Settings', route: 'settings', icon: <Settings /> },
  { label: 'Globe', route: 'globescreen', icon: <Public /> }
] as const;

interface NavigationProps {
  onClose: () => void;
  router: NextRouter;
  drawerWidth: number;
}

const Navigation = ({ onClose, router }: NavigationProps) => {
  const handleNavClick = (route: string) => {
    if (window.innerWidth < 600) {
      onClose();
    }
    router.push(route);
  };

  return (
    <div className="drawer">
      <div className="drawer-header">
        <Typography variant="h6">
          1Biome
        </Typography>
      </div>

      <List className="drawer-list">
        {navItems.map(({ label, route, icon }) => (
          <ListItemButton
            key={route}
            className={`drawer-item ${router.pathname === routes[route] ? 'drawer-item-active' : ''}`}
            onClick={() => handleNavClick(routes[route])}
          >
            <ListItemIcon>
              {icon}
            </ListItemIcon>
            <ListItemText 
              primary={label}
              className="drawer-item-text"
            />
          </ListItemButton>
        ))}
      </List>
    </div>
  );
};

export default Navigation;