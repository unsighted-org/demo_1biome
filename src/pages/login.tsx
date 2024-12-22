import { Email, ArrowForward, Lock } from '@mui/icons-material';
import { Box, TextField, Button, Typography, Alert, InputAdornment, CircularProgress, useTheme } from '@mui/material';
import { Preload } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { AnimatePresence, motion } from 'framer-motion';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

import { SpaceScene } from '@/components/SpaceScene';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationContext } from '@/contexts/NotificationContext';

import type { UserLoginData } from '@/types';
import type { Theme, SxProps } from '@mui/material/styles';

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
};

const LoginPage: React.FC = () => {
  const theme: Theme = useTheme();
  const router = useRouter();
  const {login } = useAuth();
  const { showNotification } = useNotificationContext();
  const [formData, setFormData] = useState<UserLoginData>({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as keyof UserLoginData]: value
    }));
  };

  return (
    <Box className="fullscreen-container" component="div">
      {/* Space Background */}
      <Box className="fullsize-absolute" component="div">
        <Canvas
          camera={{ position: [0, 0, 50], fov: 75 }}
          style={{ background: 'linear-gradient(to bottom, #000000, #0a192f)' }}
        >
          <SpaceScene />
          <Preload all />
        </Canvas>
      </Box>

      {/* Login Form */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: '400px',
            margin: 'auto',
            padding: '2rem',
          }}
        >
          <Box
            component="form"
            onSubmit={handleSubmit}
            className="glass-container"
          >
            <Typography
              variant="h4"
              sx={{
                color: 'white',
                textAlign: 'center',
                fontWeight: 'bold',
                mb: 4,
                textShadow: '0 0 10px rgba(255,255,255,0.5)'
              }}
            >
              Welcome Back
            </Typography>

            <TextField
              fullWidth
              name="email"
              type="email"
              label="Email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: 'white' } as const} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                input: { color: 'white' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
              }}
            />

            <TextField
              fullWidth
              name="password"
              type="password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'white' } as const} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                input: { color: 'white' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                mt: 2,
                width: '100%',
                height: '48px',
                background: 'linear-gradient(45deg, #1976D2 30%, #21CBF3 90%)',
                boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(45deg, #2196F3 60%, #21CBF3 90%)',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <>
                  Login
                  <ArrowForward sx={{ ml: 1 } as const} />
                </>
              )}
            </Button>

            <Box component="div">
              <Typography
                component={NextLink}
                href="/signup"
                sx={{
                  color: 'white',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Don&apos;t have an account? Sign up
              </Typography>
            </Box>
          </Box>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};

export default LoginPage;
