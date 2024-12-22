import { Box, CircularProgress, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';

const LoadingContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh'
});

const RedirectContainer = styled(Box)({
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  height: '100vh'
});

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
      <LoadingContainer>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading...</Typography>
      </LoadingContainer>
    );
  }

  return (
    <RedirectContainer>
      <Typography variant="h5">Redirecting...</Typography>
    </RedirectContainer>
  );
};

export default Home;
