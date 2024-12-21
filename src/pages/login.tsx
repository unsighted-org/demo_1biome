import { Email, ArrowForward, Lock } from '@mui/icons-material';
import { Box, TextField, Button, Typography, Alert, InputAdornment, CircularProgress, useTheme } from '@mui/material';
import { Preload } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { AnimatePresence, motion } from 'framer-motion';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

import { SpaceScene } from '@/components/SpaceScene';
import { useAuth } from '@/context/AuthContext';
import { useNotificationContext } from '@/context/NotificationContext';
import { validateEmail } from '@/lib/validation';

import type { UserLoginData } from '@/types';

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const { signIn } = useAuth();
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
      await signIn(formData.email, formData.password);
      showNotification({
        message: 'Successfully logged in!',
        type: 'success',
      });
      router.push('/main');
    } catch (err) {
      showNotification({
        message: 'Invalid email or password',
        type: 'error',
      });
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Space Background */}
      <Box sx={{ position: 'absolute', width: '100%', height: '100%' }}>
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
            sx={{
              p: 4,
              borderRadius: 2,
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                textAlign: 'center',
                color: 'white',
                fontWeight: 'bold',
                mb: 4,
                textShadow: '0 0 10px rgba(255,255,255,0.5)',
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
                    <Email sx={{ color: 'white' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
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
                    <Lock sx={{ color: 'white' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                height: 48,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
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
                  <ArrowForward sx={{ ml: 1 }} />
                </>
              )}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography
                component={NextLink}
                href="/signup"
                variant="body2"
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
