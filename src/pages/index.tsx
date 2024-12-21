import { Box, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';

const Home: React.FC = (): JSX.Element => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/globescreen');
      } else {
        router.push('/signup');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh'
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh' 
      }}
    >
      <Typography variant="h5">Redirecting...</Typography>
    </Box>
  );
};

export default Home;
