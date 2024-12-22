import { useState, ReactNode, useEffect } from 'react';
import { useTheme, useMediaQuery, Drawer, CircularProgress, Typography, Stack } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { routes } from '@/routes';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Navigation from '../components/Navigation';
import OfflineNotice, { useOnlineStatus } from '../components/OfflineNotice';

const drawerWidth = 240;

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading } = useAuth();
  const isOnline = useOnlineStatus();

  const publicRoutes = [routes.login] as const;
  const isPublicPage = publicRoutes.includes(router.pathname as typeof routes.login);
  const showNavigation = Boolean(user) && !isPublicPage && !loading;

  // Close drawer on route change in mobile view
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [router.pathname, isMobile]);

  if (!isOnline) return <OfflineNotice />;

  if (loading && !user && !isPublicPage) {
    return (
      <div className="loading-container">
        <Stack direction="column" alignItems="center" spacing={2}>
          <CircularProgress size={40} />
          <Typography>Loading...</Typography>
        </Stack>
      </div>
    );
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <div className="layout-root">
      {showNavigation && (
        <>
          <Header
            isMobile={isMobile}
            drawerWidth={drawerWidth}
            onDrawerToggle={handleDrawerToggle}
            mobileOpen={mobileOpen}
          />
          <Drawer
            variant={isMobile ? "temporary" : "permanent"}
            open={isMobile ? mobileOpen : true}
            onClose={handleDrawerToggle}
            ModalProps={{ 
              keepMounted: true,
              disablePortal: true
            }}
            className="layout-drawer"
            classes={{
              paper: 'drawer-paper'
            }}
          >
            <Navigation
              router={router}
              onClose={handleDrawerToggle}
              drawerWidth={drawerWidth}
            />
          </Drawer>
        </>
      )}
      <main className={`layout-main ${showNavigation ? 'with-navigation' : ''}`}>
        <div className="layout-content">
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}

export default Layout;