import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  CircularProgress,
  Alert,
  Divider,
  styled
} from '@mui/material';
import { Apple, Watch, Refresh } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { healthIntegrationService } from '@/services/healthIntegrations';
import healthService from '@/services/HealthService';

// Styled components to avoid complex union types
const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4)
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(3)
}));

const StyledAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(2)
}));

interface IntegrationStatus {
  healthKit: boolean;
  ouraRing: boolean;
}

const HealthIntegrationsPage: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>({
    healthKit: false,
    ouraRing: false
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const checkIntegrationStatus = async () => {
      if (!user) return;
      
      try {
        const healthKitStatus = await healthIntegrationService.authorizeHealthKit();
        const ouraToken = await healthIntegrationService.getOuraToken();
        
        setIntegrationStatus({
          healthKit: healthKitStatus,
          ouraRing: !!ouraToken
        });
      } catch (error) {
        console.error('Failed to check integration status:', error);
      }
    };

    checkIntegrationStatus();
  }, [user]);

  const handleHealthKitToggle = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const authorized = await healthIntegrationService.authorizeHealthKit();
      setIntegrationStatus(prev => ({ ...prev, healthKit: authorized }));
      
      if (authorized) {
        await healthService.refreshHealthData();
        setSuccess('Successfully connected to Apple Health');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect to Apple Health';
      setError(message);
      console.error('HealthKit connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOuraRingConnect = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await healthIntegrationService.authorizeOuraRing();
      // The actual status update will happen after OAuth callback
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect to Oura Ring';
      setError(message);
      console.error('Oura Ring connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await healthService.refreshHealthData();
      setSuccess('Health data successfully synchronized');
    } catch (err) {
      setError('Failed to sync health data. Please try again.');
      console.error('Health sync error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div>
        <CircularProgress />
      </div>
    );
  }

  return (
    <StyledContainer maxWidth="md">
      <Typography variant="h4" gutterBottom>
        Health Integrations
      </Typography>

      {error && (
        <StyledAlert severity="error">
          {error}
        </StyledAlert>
      )}

      {success && (
        <StyledAlert severity="success">
          {success}
        </StyledAlert>
      )}

      <StyledPaper>
        <List>
          <ListItem>
            <ListItemIcon>
              <Apple />
            </ListItemIcon>
            <ListItemText
              primary="Apple Health"
              secondary="Connect to sync your health and activity data"
            />
            <ListItemSecondaryAction>
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                <Button
                  variant="contained"
                  onClick={handleHealthKitToggle}
                  disabled={integrationStatus.healthKit}
                  startIcon={integrationStatus.healthKit ? <Refresh /> : undefined}
                >
                  {integrationStatus.healthKit ? 'Connected' : 'Connect'}
                </Button>
              )}
            </ListItemSecondaryAction>
          </ListItem>

          <Divider />

          <ListItem>
            <ListItemIcon>
              <Watch />
            </ListItemIcon>
            <ListItemText
              primary="Oura Ring"
              secondary="Connect to sync your sleep and recovery data"
            />
            <ListItemSecondaryAction>
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                <Button
                  variant="contained"
                  onClick={handleOuraRingConnect}
                  disabled={integrationStatus.ouraRing}
                  startIcon={integrationStatus.ouraRing ? <Refresh /> : undefined}
                >
                  {integrationStatus.ouraRing ? 'Connected' : 'Connect'}
                </Button>
              )}
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </StyledPaper>

      {(integrationStatus.healthKit || integrationStatus.ouraRing) && (
        <Typography variant="body2" color="text.secondary">
          Your health data will automatically sync every 6 hours. You can also manually sync from your dashboard.
        </Typography>
      )}
    </StyledContainer>
  );
};

export default HealthIntegrationsPage;
