import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useHealth } from '@/services/HealthContext';
import { MAX_PAGES } from '@/constants';
import {
  Box, Typography, CircularProgress, Paper, Grid, Divider, Tabs, Tab, 
  List, ListItem, ListItemIcon, ListItemText, Avatar
} from '@mui/material';
import { TrendingUp, FavoriteOutlined, DirectionsRunOutlined, Co2Outlined } from '@mui/icons-material';
import type { HealthEnvironmentData, HealthScores, RegionalComparison, UserState } from '@/types';
import HealthTrendChart from '@/components/HealthTrendChart';
import CustomButton from '@/components/CustomButton';
import { getDetailedLocation } from '@/lib/helpers';

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [pageNumber, setPageNumber] = useState(1);
  const { 
    fetchHealthData, 
    loading: healthLoading, 
    error,
    getHealthScores,
    getRegionalComparison,
    healthData
  } = useHealth();
  const [tabValue, setTabValue] = useState(0);
  const [healthScores, setHealthScores] = useState<HealthScores | null>(null);
  const [regionalComparison, setRegionalComparison] = useState<RegionalComparison | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && healthData.length === 0) {
      const fetchData = async () => {
        try {
          await fetchHealthData(pageNumber);
          
          if (healthData.length > 0) {
            const latestData = healthData[healthData.length - 1];
            
            const locationInfo = await getDetailedLocation(latestData.latitude, latestData.longitude);
            
            if (user.id) {
              const scores = await getHealthScores(user.id);
              if (scores) {
                setHealthScores(scores);
              }
            }

            if (locationInfo.country) {
              const comparison = await getRegionalComparison(locationInfo.country);
              if (comparison) {
                setRegionalComparison(comparison);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching health data:', error);
        }
      };
      fetchData();
    }
  }, [user, pageNumber, fetchHealthData, getHealthScores, getRegionalComparison, healthData]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= MAX_PAGES) {
      setPageNumber(newPage);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (authLoading || healthLoading) {
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

  const ProfileSection: React.FC = () => (
    <Box display="flex" flexDirection="column" alignItems="center">
      <Avatar src={user?.avatarUrl || ''} sx={{ width: 100, height: 100, mb: 2 }} />
      <Typography variant="h5">{user?.name}</Typography>
      <Typography variant="body2" color="textSecondary">{user?.email}</Typography>
    </Box>
  );

  const BasicInfoSection: React.FC = () => (
    <List>
      <ListItem>
        <ListItemText primary="Height" secondary={`${user?.height} cm`} />
      </ListItem>
      <ListItem>
        <ListItemText primary="Weight" secondary={`${user?.weight} kg`} />
      </ListItem>
      <ListItem>
        <ListItemText primary="Date of Birth" secondary={user?.dateOfBirth} />
      </ListItem>
    </List>
  );

  const HealthStatsSection: React.FC = () => {
    const latestHealthData = healthData[healthData.length - 1] || {} as HealthEnvironmentData;
    return (
      <>
        <List>
          <ListItem>
            <ListItemIcon><DirectionsRunOutlined /></ListItemIcon>
            <ListItemText primary="Steps" secondary={latestHealthData.steps} />
          </ListItem>
          <ListItem>
            <ListItemIcon><FavoriteOutlined /></ListItemIcon>
            <ListItemText primary="Heart Rate" secondary={`${latestHealthData.heartRate} bpm`} />
          </ListItem>
          <ListItem>
            <ListItemIcon><Co2Outlined /></ListItemIcon>
            <ListItemText primary="Environmental Impact Score" secondary={latestHealthData.environmentalImpactScore} />
          </ListItem>
        </List>
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>Health Trends</Typography>
          <HealthTrendChart onDataUpdate={function (data: HealthEnvironmentData[]): void {
            throw new Error('Function not implemented.');
          } } />
        </Box>
      </>
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <ProfileSection />
            <Divider sx={{ my: 2 }} />
            <BasicInfoSection />
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 2 }}>
              <Tab label="Health Stats" />
              <Tab label="Activity Log" />
            </Tabs>
            {tabValue === 0 && <HealthStatsSection />}
            {tabValue === 1 && (
              <Typography variant="body1">Activity log coming soon...</Typography>
            )}
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

export default ProfilePage;