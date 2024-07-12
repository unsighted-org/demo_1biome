// lib/validation.ts
import { z } from 'zod';

import type { UserSignupData, UserUpdateSettingsData } from '@/types';

// Reusable schemas
const emailSchema = z.string().email({ message: "Invalid email address" });
const passwordSchema = z.string().min(8, { message: "Password must be at least 8 characters long" })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 
    { message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character" });
const nameSchema = z.string().min(2, { message: "Name must be at least 2 characters long" })
  .max(50, { message: "Name must not exceed 50 characters" })
  .regex(/^[a-zA-Z' -]+$/, { message: "Name can only contain letters, spaces, hyphens, and apostrophes" });
const dateOfBirthSchema = z.date().min(new Date(1900, 0, 1), { message: "Date of birth is too early" });
const heightSchema = z.number().positive({ message: "Height must be a positive number" });
const weightSchema = z.number().positive({ message: "Weight must be a positive number" });
const _avatarUrlSchema = z.string().url({ message: "Invalid URL for avatar" }).nullable();

// UserSignupData schema
export const userSignupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  dateOfBirth: dateOfBirthSchema,
  height: heightSchema.optional(),
  weight: weightSchema.optional(),
  avatarFile: z.any().optional(), // File validation can be more complex based on requirements
});

// UserUpdateSettingsData schema
export const userUpdateSettingsSchema = z.object({
  dateOfBirth: dateOfBirthSchema.optional(),
  height: heightSchema.optional(),
  weight: weightSchema.optional(),
  connectedDevices: z.array(z.string()).optional(),
  dailyReminder: z.boolean().optional(),
  weeklySummary: z.boolean().optional(),
  shareData: z.boolean().optional(),
  notificationsEnabled: z.boolean().optional(),
  dataRetentionPeriod: z.number().optional(),
});

// Validation functions
export const validateUserSignup = (data: UserSignupData) => userSignupSchema.safeParse(data);
export const validateUserUpdateSettings = (data: UserUpdateSettingsData) => userUpdateSettingsSchema.safeParse(data);

// You can also export individual field validators if needed
export const validateEmail = (email: string) => emailSchema.safeParse(email);
export const validatePassword = (password: string) => passwordSchema.safeParse(password);
export const validateName = (name: string) => nameSchema.safeParse(name);
export const validateDateOfBirth = (dateOfBirth: string | Date) => dateOfBirthSchema.safeParse(dateOfBirth);
export const validateHeight = (height: number) => heightSchema.safeParse(height);
export const validateWeight = (weight: number) => weightSchema.safeParse(weight);
