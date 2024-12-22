import { Email, Lock, Visibility, VisibilityOff, Person, CalendarToday, ArrowForward } from '@mui/icons-material';
import { Box, TextField, Button, Typography, Alert, InputAdornment, IconButton, CircularProgress, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import type { Theme, SxProps } from '@mui/material/styles';
import { Preload } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { AnimatePresence, motion } from 'framer-motion';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useCallback, useEffect } from 'react';
import styled from '@emotion/styled';

import { SpaceScene } from '@/components/SpaceScene';
import { useAuth } from '@/contexts/AuthContext';
import { validateSignupData, type SignupData } from '@/lib/validation';
import { inchesToCm, cmToInches, lbsToKg, kgToLbs } from '@/lib/units';

const SignupContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  position: 'relative'
});

const BackgroundContainer = styled(Box)({
  position: 'absolute',
  width: '100%',
  height: '100%'
});

const SignupFormContainer = styled(Box)({
  p: 4,
  borderRadius: 2,
  backdropFilter: 'blur(10px)',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
});

const LinkContainer = styled(Box)({
  textAlign: 'center',
  marginTop: '16px'
});

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    color: 'white',
    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
  },
  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
}));

const FormBox = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  marginTop: '16px'
});

const SignupPage: React.FC = () => {
  const router = useRouter();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    dateOfBirth: '',
    height: '',
    weight: ''
  });
  const [units, setUnits] = useState({
    height: 'cm',
    weight: 'kg'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      // Cleanup on unmount
      setLoading(false);
      setError('');
      setFieldErrors({});
    };
  }, []);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(value)) {
          return 'Please enter a valid email address';
        }
        break;
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(value)) return 'Password must contain an uppercase letter';
        if (!/[a-z]/.test(value)) return 'Password must contain a lowercase letter';
        if (!/[0-9]/.test(value)) return 'Password must contain a number';
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Password must contain a special character';
        break;
      case 'name':
        if (!value) return 'Name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        if (!/^[a-zA-Z\s-']+$/.test(value)) return 'Name can only contain letters, spaces, hyphens, and apostrophes';
        break;
      case 'dateOfBirth':
        if (!value) return 'Date of birth is required';
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
        if (age < 13) return 'You must be at least 13 years old to sign up';
        if (birthDate > today) return 'Date of birth cannot be in the future';
        break;
      case 'height':
        if (!value) return 'Height is required';
        const heightNum = parseFloat(value);
        if (isNaN(heightNum) || heightNum <= 0) return 'Please enter a valid height';
        const heightInCm = units.height === 'in' ? inchesToCm(heightNum) : heightNum;
        if (heightInCm < 50 || heightInCm > 300) return 'Height must be between 50cm and 300cm';
        break;
      case 'weight':
        if (!value) return 'Weight is required';
        const weightNum = parseFloat(value);
        if (isNaN(weightNum) || weightNum <= 0) return 'Please enter a valid weight';
        const weightInKg = units.weight === 'lbs' ? lbsToKg(weightNum) : weightNum;
        if (weightInKg < 20 || weightInKg > 500) return 'Weight must be between 20kg and 500kg';
        break;
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear general error when user starts typing
    setError('');
    
    // Validate field and update field-specific error
    const fieldError = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      [name]: fieldError
    }));
  };

  const handleUnitChange = (type: 'height' | 'weight', newUnit: string) => {
    try {
      const oldUnit = units[type];
      const value = formData[type];
      
      if (value && !isNaN(parseFloat(value))) {
        let newValue: string;
        if (type === 'height') {
          newValue = oldUnit === 'cm' 
            ? cmToInches(parseFloat(value)).toString()
            : inchesToCm(parseFloat(value)).toString();
        } else {
          newValue = oldUnit === 'kg'
            ? kgToLbs(parseFloat(value)).toString()
            : lbsToKg(parseFloat(value)).toString();
        }
        setFormData(prev => ({ ...prev, [type]: newValue }));
        
        // Validate the converted value
        const fieldError = validateField(type, newValue);
        setFieldErrors(prev => ({
          ...prev,
          [type]: fieldError
        }));
      }
      
      setUnits(prev => ({ ...prev, [type]: newUnit }));
    } catch (err) {
      setError(`Error converting ${type}: ${err instanceof Error ? err.message : 'Invalid value'}`);
    }
  };

  const validateForm = (): boolean => {
    const newFieldErrors: Record<string, string> = {};
    let hasErrors = false;

    // Validate all fields
    Object.entries(formData).forEach(([name, value]) => {
      const fieldError = validateField(name, value);
      if (fieldError) {
        newFieldErrors[name] = fieldError;
        hasErrors = true;
      }
    });

    setFieldErrors(newFieldErrors);
    return !hasErrors;
  };

  const handleSignup = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    
    // Don't proceed if already loading
    if (loading) return;

    // Validate all fields first
    if (!validateForm()) {
      setError('Please correct the errors in the form');
      return;
    }

    setLoading(true);

    try {
      // Convert height and weight to metric units
      const heightNum = parseFloat(formData.height);
      const weightNum = parseFloat(formData.weight);
      
      const convertedHeight = units.height === 'in' ? inchesToCm(heightNum) : heightNum;
      const convertedWeight = units.weight === 'lbs' ? lbsToKg(weightNum) : weightNum;

      const metricData: SignupData = {
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
        dateOfBirth: formData.dateOfBirth,
        height: convertedHeight,
        weight: convertedWeight
      };

      // Final validation before submission
      const validationResult = validateSignupData(metricData);
      if (!validationResult.isValid) {
        throw new Error(validationResult.error || 'Invalid form data');
      }

      await signup(metricData);
      // Signup successful - router.push will be handled by the auth context
    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <SignupContainer>
      <BackgroundContainer>
        <Canvas
          camera={{ position: [0, 0, 50], fov: 75 }}
          style={{ background: 'linear-gradient(to bottom, #000000, #0a192f)' }}
        >
          <SpaceScene />
          <Preload all />
        </Canvas>
      </BackgroundContainer>

      <SignupFormContainer
        component="form"
        onSubmit={handleSignup}
        sx={{
          width: '100%',
          maxWidth: 400,
          p: 4,
          zIndex: 1
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
          <Alert severity="error" sx={{ mt: 2, backgroundColor: 'rgba(211, 47, 47, 0.1)', color: 'white' }}>
            {error}
          </Alert>
        )}

        <StyledTextField
          fullWidth
          name="email"
          type="email"
          label="Email"
          value={formData.email}
          onChange={handleChange}
          required
          error={!!fieldErrors.email}
          helperText={fieldErrors.email}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Email sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
              </InputAdornment>
            ),
          }}
        />

        <StyledTextField
          fullWidth
          name="password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          value={formData.password}
          onChange={handleChange}
          required
          error={!!fieldErrors.password}
          helperText={fieldErrors.password}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
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
        />

        <StyledTextField
          fullWidth
          name="name"
          label="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
          error={!!fieldErrors.name}
          helperText={fieldErrors.name}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Person sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
              </InputAdornment>
            ),
          }}
        />

        <StyledTextField
          fullWidth
          type="date"
          name="dateOfBirth"
          label="Date of Birth"
          value={formData.dateOfBirth}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
          required
          error={!!fieldErrors.dateOfBirth}
          helperText={fieldErrors.dateOfBirth}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CalendarToday sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
              </InputAdornment>
            ),
          }}
        />

        <FormBox>
          <StyledTextField
            name="height"
            label="Height"
            type="number"
            value={formData.height}
            onChange={handleChange}
            required
            error={!!fieldErrors.height}
            helperText={fieldErrors.height}
            sx={{ flex: 1 }}
          />
          <FormControl sx={{ minWidth: 80 }}>
            <Select
              value={units.height}
              onChange={(e) => handleUnitChange('height', e.target.value)}
              size="small"
              sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' } }}
            >
              <MenuItem value="cm">cm</MenuItem>
              <MenuItem value="in">in</MenuItem>
            </Select>
          </FormControl>
        </FormBox>

        <FormBox>
          <StyledTextField
            name="weight"
            label="Weight"
            type="number"
            value={formData.weight}
            onChange={handleChange}
            required
            error={!!fieldErrors.weight}
            helperText={fieldErrors.weight}
            sx={{ flex: 1 }}
          />
          <FormControl sx={{ minWidth: 80 }}>
            <Select
              value={units.weight}
              onChange={(e) => handleUnitChange('weight', e.target.value)}
              size="small"
              sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' } }}
            >
              <MenuItem value="kg">kg</MenuItem>
              <MenuItem value="lbs">lbs</MenuItem>
            </Select>
          </FormControl>
        </FormBox>

        <Button
          fullWidth
          variant="contained"
          type="submit"
          disabled={loading}
          sx={{ mt: 3, mb: 2 }}
          endIcon={loading ? <CircularProgress size={20} /> : <ArrowForward />}
        >
          Sign Up
        </Button>

        <LinkContainer>
          <NextLink href="/login" passHref legacyBehavior>
            <Typography
              component="a"
              variant="body2"
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Already have an account? Log in
            </Typography>
          </NextLink>
        </LinkContainer>
      </SignupFormContainer>
    </SignupContainer>
  );
};

export default SignupPage;
