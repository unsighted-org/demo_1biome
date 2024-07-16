import { TrendingUp } from '@mui/icons-material';
import {
  Box, Typography, CircularProgress, Paper, Grid, Divider, Tabs, Tab
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useState, useEffect, lazy, Suspense } from 'react';

import CustomButton from '@/components/CustomButton';
import { useAuth } from '@/context/AuthContext';
import { withAuth } from '@/context/withAuth';
import { useHealth } from '@/services/HealthContext';



// Lazy loaded components
const ProfileSection = lazy(() => import('@/components/lazyloading/ProfileSection'));
const BasicInfoSection = lazy(() => import('@/components/lazyloading/BasicInfoSection'));
const HealthSummarySection = lazy(() => import('@/components/lazyloading/HealthSummarySection'));
const ActivityLogSection = lazy(() => import('@/components/lazyloading/ActivityLogSection'));

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const {visibleData, loading: healthLoading, error, fetchHealthData } = useHealth();
  const [tabValue, setTabValue] = useState(0);
  const [isDataFetched, setIsDataFetched] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && !isDataFetched) {
      fetchHealthData(1).then(() => setIsDataFetched(true));
    }
  }, [user, authLoading, router, fetchHealthData, isDataFetched]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number): void => {
    setTabValue(newValue);
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (authLoading || (healthLoading && !isDataFetched)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography variant="h6" color="error">Error: {error}</Typography>
        <Typography variant="body1">Please try refreshing the page or contact support if the problem persists.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Suspense fallback={<CircularProgress />}>
              <ProfileSection user={user} />
              <Divider sx={{ my: 2 }} />
              <BasicInfoSection user={user} />
            </Suspense>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 2 }}>
              <Tab label="Health Summary" />
              <Tab label="Recent Activity" />
            </Tabs>
            <Suspense fallback={<CircularProgress />}>
              {tabValue === 0 && <HealthSummarySection healthData={visibleData} healthScores={null} />}
              {tabValue === 1 && <ActivityLogSection healthData={visibleData} />}
            </Suspense>
          </Paper>
        </Grid>
      </Grid>
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <CustomButton
          title="Edit Profile"
          onClick={() => router.push('/profile/edit')}
          fullWidth={false}
          startIcon={<TrendingUp />}
        />
        <CustomButton
          title="Sign Out"
          onClick={handleSignOut}
          fullWidth={false}
          color="secondary"
        />
      </Box>
    </Box>
  );
};


export default withAuth(ProfilePage);