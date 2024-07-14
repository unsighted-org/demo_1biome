import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useHealth } from '@/services/HealthContext';
import { useAppSelector } from '@/store';
import {
  Box, Typography, CircularProgress, Paper, Grid, Divider, Tabs, Tab, 
  List, ListItem, ListItemIcon, ListItemText, Avatar
} from '@mui/material';
import { TrendingUp, FavoriteOutlined, DirectionsRunOutlined, Co2Outlined, AccessTime } from '@mui/icons-material';
import type { HealthEnvironmentData, UserState } from '@/types';
import CustomButton from '@/components/CustomButton';

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { loading: healthLoading, error } = useHealth();
  const [tabValue, setTabValue] = useState(0);
  
  const healthData = useAppSelector(state => state.health.data);
  const healthScores = useAppSelector(state => state.health.scores);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

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

  const HealthSummarySection: React.FC = () => {
    const latestHealthData = healthData[healthData.length - 1] || {} as HealthEnvironmentData;
    return (
      <List>
        <ListItem>
          <ListItemIcon><AccessTime /></ListItemIcon>
          <ListItemText primary="Last Sync" secondary={new Date(latestHealthData.timestamp).toLocaleString()} />
        </ListItem>
        <ListItem>
          <ListItemIcon><FavoriteOutlined /></ListItemIcon>
          <ListItemText primary="Average Heart Rate" secondary={`${healthScores?.cardioHealthScore.toFixed(2) || 'N/A'} bpm`} />
        </ListItem>
        <ListItem>
          <ListItemIcon><DirectionsRunOutlined /></ListItemIcon>
          <ListItemText primary="Average Daily Steps" secondary={healthScores?.physicalActivityScore.toFixed(0) || 'N/A'} />
        </ListItem>
        <ListItem>
          <ListItemIcon><Co2Outlined /></ListItemIcon>
          <ListItemText primary="Environmental Impact Score" secondary={healthScores?.environmentalImpactScore.toFixed(2) || 'N/A'} />
        </ListItem>
      </List>
    );
  };

  const ActivityLogSection: React.FC = () => (
    <List>
      {healthData.slice(-5).reverse().map((data, index) => (
        <ListItem key={index}>
          <ListItemText 
            primary={new Date(data.timestamp).toLocaleDateString()} 
            secondary={`Steps: ${data.steps}, Heart Rate: ${data.heartRate} bpm`} 
          />
        </ListItem>
      ))}
    </List>
  );

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
              <Tab label="Health Summary" />
              <Tab label="Recent Activity" />
            </Tabs>
            {tabValue === 0 && <HealthSummarySection />}
            {tabValue === 1 && <ActivityLogSection />}
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
