export interface SignupData {
  email: string;
  password: string;
  name: string;
  dateOfBirth: string;
  height: number;
  weight: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateSignupData = (data: SignupData): ValidationResult => {
  // Email validation
  if (!data.email) {
    return { isValid: false, error: 'Email is required' };
  }
  if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(data.email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  // Password validation
  if (!data.password) {
    return { isValid: false, error: 'Password is required' };
  }
  if (data.password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(data.password)) {
    return { isValid: false, error: 'Password must contain an uppercase letter' };
  }
  if (!/[a-z]/.test(data.password)) {
    return { isValid: false, error: 'Password must contain a lowercase letter' };
  }
  if (!/[0-9]/.test(data.password)) {
    return { isValid: false, error: 'Password must contain a number' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(data.password)) {
    return { isValid: false, error: 'Password must contain a special character' };
  }

  // Name validation
  if (!data.name) {
    return { isValid: false, error: 'Name is required' };
  }
  if (data.name.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }
  if (!/^[a-zA-Z\s-']+$/.test(data.name)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  // Date of birth validation
  if (!data.dateOfBirth) {
    return { isValid: false, error: 'Date of birth is required' };
  }
  const birthDate = new Date(data.dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  if (age < 13) {
    return { isValid: false, error: 'You must be at least 13 years old to sign up' };
  }
  if (birthDate > today) {
    return { isValid: false, error: 'Date of birth cannot be in the future' };
  }

  // Height validation
  if (!data.height || isNaN(data.height)) {
    return { isValid: false, error: 'Height is required and must be a number' };
  }
  if (data.height < 50 || data.height > 300) {
    return { isValid: false, error: 'Height must be between 50cm and 300cm' };
  }

  // Weight validation
  if (!data.weight || isNaN(data.weight)) {
    return { isValid: false, error: 'Weight is required and must be a number' };
  }
  if (data.weight < 20 || data.weight > 500) {
    return { isValid: false, error: 'Weight must be between 20kg and 500kg' };
  }

  return { isValid: true };
};