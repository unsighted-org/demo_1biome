import { Box, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';


  const Home: React.FC = () => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      console.log('Home component useEffect running');
      console.log('Auth state:', { user, loading });

      if (!loading) {
        if (user) {
          console.log('User authenticated, redirecting to /globescreen');
          router.push('/globescreen');
        } else {
          console.log('User not authenticated, redirecting to /signup');
          router.push('/signup');
        }
      }
    }, [user, loading, router]);

    if (loading) {
      console.log('Rendering loading state');
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

    console.log('Rendering redirect state');
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
