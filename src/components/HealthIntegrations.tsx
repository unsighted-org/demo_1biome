import React, { useCallback, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Apple, Watch } from '@mui/icons-material';
import { healthIntegrationService } from '@/services/healthIntegrations';

interface IntegrationStatus {
  healthKit: boolean;
  ouraRing: boolean;
}

interface IntegrationState {
  loading: boolean;
  error: string | null;
  status: IntegrationStatus;
}

export const HealthIntegrations: React.FC = () => {
  const [state, setState] = useState<IntegrationState>({
    loading: false,
    error: null,
    status: {
      healthKit: false,
      ouraRing: false,
    }
  });

  const handleHealthKitConnect = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const authorized = await healthIntegrationService.authorizeHealthKit();
      setState(prev => ({
        ...prev,
        status: { ...prev.status, healthKit: authorized }
      }));
      if (authorized) {
        await healthIntegrationService.syncHealthData();
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to connect to Apple Health. Please try again.'
      }));
      console.error('HealthKit connection error:', err);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const handleOuraConnect = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await healthIntegrationService.authorizeOuraRing();
      // Note: Status will be updated after OAuth callback
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to connect to Oura Ring. Please try again.'
      }));
      console.error('Oura Ring connection error:', err);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Health Integrations
      </Typography>
      
      {state.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Apple sx={{ mr: 2 }} />
              <div>
                <Typography variant="h6">Apple Health</Typography>
                <Typography variant="body2" color="textSecondary">
                  Connect to sync your health data
                </Typography>
              </div>
            </div>
            {state.loading ? (
              <CircularProgress size={24} />
            ) : (
              <Button
                variant="contained"
                onClick={handleHealthKitConnect}
                disabled={state.status.healthKit}
              >
                {state.status.healthKit ? 'Connected' : 'Connect'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Watch sx={{ mr: 2 }} />
              <div>
                <Typography variant="h6">Oura Ring</Typography>
                <Typography variant="body2" color="textSecondary">
                  Connect to sync your sleep and activity data
                </Typography>
              </div>
            </div>
            {state.loading ? (
              <CircularProgress size={24} />
            ) : (
              <Button
                variant="contained"
                onClick={handleOuraConnect}
                disabled={state.status.ouraRing}
              >
                {state.status.ouraRing ? 'Connected' : 'Connect'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
