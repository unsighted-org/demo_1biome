import { Warning, CheckCircle } from '@mui/icons-material';
import { Box, TextField, Button, Typography, Alert, Container, Paper, CircularProgress, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

import { useAuth } from '@/context/AuthContext';

const DeleteAccountPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const { deleteAccount, signOut } = useAuth();
  const router = useRouter();

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

  if (isDeleted) {
    return (
      <Container component="main" maxWidth="xs">
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Account Deleted
          </Typography>
          <Alert severity="success" sx={{ mb: 2 }}>
            Your account has been marked for deletion. You will be logged out and redirected to the home page in 5 seconds.
          </Alert>
        </Paper>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Delete Account
        </Typography>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Warning: Your account will be marked for deletion. You can recover it within 7 days by logging in.
        </Alert>
        <Typography variant="subtitle1" gutterBottom>
          Consequences of account deletion:
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <Warning color="error" />
            </ListItemIcon>
            <ListItemText primary="All your personal data will be removed" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Warning color="error" />
            </ListItemIcon>
            <ListItemText primary="You will lose access to all your health records" />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircle color="primary" />
            </ListItemIcon>
            <ListItemText primary="You can recover your account within 7 days by logging in" />
          </ListItem>
        </List>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleDeleteAccount} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Confirm Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="error"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Delete Account'}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleCancel}
            sx={{ mt: 1, mb: 2 }}
          >
            Cancel
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default DeleteAccountPage;