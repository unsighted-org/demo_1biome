import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import { Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';

interface HeaderProps {
  isMobile: boolean;
  drawerWidth: number;
  mobileOpen: boolean;
  onDrawerToggle: () => void;
}

const Header = ({ isMobile, mobileOpen, onDrawerToggle }: HeaderProps) => {
  return (
    <AppBar 
      position="fixed" 
      className={`app-header ${!isMobile ? 'with-drawer' : ''}`}
    >
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={onDrawerToggle}
            className="menu-button"
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        )}
        <Typography variant="h6" component="h1" noWrap>
          1Biome
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header;