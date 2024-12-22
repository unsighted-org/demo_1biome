import { Warning, CheckCircle } from '@mui/icons-material';
import { Box, TextField, Button, Typography, Alert, Container, Paper, CircularProgress, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout';
import { LoadingTimeoutError } from '@/components/LoadingTimeoutError';

const DeleteAccountPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const { deleteAccount, signOut } = useAuth();
  const router = useRouter();

  const hasTimedOut = useLoadingTimeout({ 
    isLoading: isLoading || false,
    timeoutMs: 10000 // 10 seconds for account deletion
  });

  const handleDeleteAccount = async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();
      if (window.confirm('Are you sure you want to delete your account? This action can be undone within 7 days.')) {
        setIsLoading(true);
        setError('');
        try {
          await deleteAccount(password);
          setIsDeleted(true);
          setTimeout(async () => {
            await signOut(); // This will clear the user state and token
            router.push('/');
          }, 5000);
        } catch (error) {
          setError((error as Error).message || 'Failed to delete account. Please check your password and try again.');
        } finally {
          setIsLoading(false);
        }
      }
    };

  const handleCancel = (): void => {
    router.push('/settings');
  };

  useEffect(() => {
    if (hasTimedOut) {
      setError('Account deletion is taking longer than expected.');
    }
  }, [hasTimedOut]);

  if (isDeleted) {
    return (
      <Container component="main" maxWidth="xs">
        <Paper elevation={3} className="card-container m-4">
          <div className="flex-column gap-2">
            <Typography component="h1" variant="h5">
              Account Deleted
            </Typography>
            <Alert severity="success" className="m-2">
              Your account has been successfully deleted.
            </Alert>
            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push('/')}
              className="m-2"
            >
              Return to Home
            </Button>
          </div>
        </Paper>
      </Container>
    );
  }

  if (hasTimedOut) {
    return <LoadingTimeoutError 
      message="Account deletion is taking longer than expected." 
      onRetry={() => setIsLoading(false)}
    />;
  }

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} className="card-container m-4">
        <div className="flex-column gap-2">
          <Typography component="h1" variant="h5">
            Delete Account
          </Typography>
          <Alert severity="warning" className="m-2">
            Warning: This action cannot be undone. Please be certain.
          </Alert>
          <List>
            <ListItem>
              <ListItemIcon>
                <Warning color="warning" />
              </ListItemIcon>
              <ListItemText primary="All your data will be permanently deleted" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Warning color="warning" />
              </ListItemIcon>
              <ListItemText primary="You will lose access to all your health insights" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Warning color="warning" />
              </ListItemIcon>
              <ListItemText primary="Your account cannot be recovered after deletion" />
            </ListItem>
          </List>
          {error && <Alert severity="error" className="m-2">{error}</Alert>}
          <form onSubmit={handleDeleteAccount} className="flex-column gap-3">
            <TextField
              required
              fullWidth
              name="password"
              label="Confirm Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="m-2"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="error"
              disabled={isLoading}
              className="m-3"
            >
              {isLoading ? <CircularProgress size={24} /> : 'Delete My Account'}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => router.push('/settings')}
              className="m-2"
            >
              Cancel
            </Button>
          </form>
        </div>
      </Paper>
    </Container>
  );
};

export default DeleteAccountPage;
