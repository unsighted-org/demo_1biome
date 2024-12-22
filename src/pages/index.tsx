import { CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';


const Home: React.FC = () => {
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
  const HealthTrendChart = dynamic(
    () => import('@/components/HealthTrendChart').then(mod => mod.HealthTrendChart),
    { 
      ssr: false,
      loading: () => (
        <div className="globe-loading-container">
          <CircularProgress size={30} />
          <Typography className="loading-text">
            Loading Health Data...
          </Typography>
        </div>
      )
    }
  );

  
  if (loading) {
    return (
      <div className="loading-container">
        <CircularProgress size={60} />
        <Typography variant="h6" className="p-2">
          Loading...
        </Typography>
      </div>
    );
  }

  return (
    <div className="flex-center full-height">
      <Typography variant="h5">
        Redirecting...
      </Typography>
    </div>
  );
};

export default Home;