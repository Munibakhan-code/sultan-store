// src/validators/auth.validator.ts
import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .trim(),
  email: z
    .string()
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  token: z
    .string()
    .min(1, 'Verification token is required'),
});

export const resendVerificationSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email')
    .toLowerCase()
    .trim(),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email')
    .toLowerCase()
    .trim(),
});

export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});