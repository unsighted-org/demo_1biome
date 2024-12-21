import { Email, Lock, Visibility, VisibilityOff, Person, CalendarToday, ArrowForward } from '@mui/icons-material';
import { Box, TextField, Button, Typography, Alert, InputAdornment, IconButton, CircularProgress, useTheme } from '@mui/material';
import { Preload } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { AnimatePresence, motion } from 'framer-motion';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

import { SpaceScene } from '@/components/SpaceScene';
import { useAuth } from '@/context/AuthContext';
import { validateEmail, validatePassword } from '@/lib/validation';

const SignupPage: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    dateOfBirth: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear error when user types
  };

  const validateForm = (): boolean => {
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!validatePassword(formData.password)) {
      setError('Password must be at least 8 characters long and contain at least one number and one special character');
      return false;
    }
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!formData.dateOfBirth) {
      setError('Please enter your date of birth');
      return false;
    }
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 13) {
      setError('You must be at least 13 years old to sign up');
      return false;
    }
    return true;
  };

  const handleSignup = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signup(formData);
      router.push('/globescreen');
    } catch (error) {
      console.error('Signup error:', error);
      setError('Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
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

      {/* Signup Form */}
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
            maxWidth: '500px',
            margin: 'auto',
            padding: '2rem',
          }}
        >
          <Box
            component="form"
            onSubmit={handleSignup}
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
              Join 1Biome
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2, backgroundColor: 'rgba(211, 47, 47, 0.1)', color: 'white' }}>
                {error}
              </Alert>
            )}

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
              type={showPassword ? 'text' : 'password'}
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
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: 'white' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
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
              name="name"
              label="Full Name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: 'white' }} />
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
              name="dateOfBirth"
              type="date"
              label="Date of Birth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              margin="normal"
              required
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarToday sx={{ color: 'white' }} />
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
                  Sign Up
                  <ArrowForward sx={{ ml: 1 }} />
                </>
              )}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography
                component={NextLink}
                href="/login"
                variant="body2"
                sx={{
                  color: 'white',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Already have an account? Log in
              </Typography>
            </Box>
          </Box>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};

export default SignupPage;
