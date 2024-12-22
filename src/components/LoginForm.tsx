import { Email, ArrowForward, Lock } from '@mui/icons-material';
import { TextField, Button, Typography, InputAdornment, CircularProgress } from '@mui/material';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import type { UserLoginData } from '@/types';

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
};

const LoginForm: React.FC = () => {
  const router = useRouter();
  const { login, loading: authLoading } = useAuth();
  const { showNotification } = useNotificationContext();
  const [formData, setFormData] = useState<UserLoginData>({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (loading || authLoading) return;
    setLoading(true);

    if (!validateEmail(formData.email)) {
      showNotification({
        message: 'Please enter a valid email address',
        type: 'error',
      });
      setLoading(false);
      return;
    }

    try {
      await login(formData.email, formData.password);
      showNotification({
        message: 'Successfully logged in!',
        type: 'success',
      });
    } catch (err: any) {
      let errorMessage = 'Invalid email or password';
      if (err?.response?.status === 404) {
        errorMessage = 'User not found';
      } else if (err?.response?.status === 401) {
        errorMessage = 'Invalid password';
      }
      showNotification({
        message: errorMessage,
        type: 'error',
      });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <Typography variant="h4" className="login-title">
        Welcome Back
      </Typography>

      <TextField
        fullWidth
        name="email"
        type="email"
        label="Email"
        value={formData.email}
        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        className="login-input"
        required
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Email />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        fullWidth
        name="password"
        type="password"
        label="Password"
        value={formData.password}
        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
        className="login-input"
        required
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Lock />
            </InputAdornment>
          ),
        }}
      />

      <Button
        type="submit"
        variant="contained"
        disabled={loading || authLoading}
        className="login-button"
      >
        {loading || authLoading ? (
          <CircularProgress size={24} />
        ) : (
          <>
            Login
            <ArrowForward sx={{ ml: 1 }} />
          </>
        )}
      </Button>
    </form>
  );
};

export default LoginForm;