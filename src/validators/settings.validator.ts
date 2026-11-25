// src/validators/settings.validator.ts
import { z } from 'zod';

export const updateThemeSchema = z.object({
  themeColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Theme color must be a valid hex color (e.g., #D4AF37)'),
});

export const heroVideoSchema = z.object({
  videoBase64: z
    .string()
    .min(1, 'Video data is required')
    .regex(/^data:video\/(mp4|webm|ogg);base64,/, 'Invalid video format. Must be a base64 video'),
});

export const paymentMethodSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters'),
  type: z.enum(['bank_transfer', 'crypto', 'other'], {
    errorMap: () => ({ message: 'Invalid type. Must be one of: bank_transfer, crypto, other' })
  }),
  enabled: z
    .boolean()
    .default(true),
  details: z
    .record(z.any())
    .default({}),
  logo: z.object({
    url: z.string().url('Invalid logo URL format'),
    publicId: z.string().min(1, 'Public ID is required'),
  }).optional(),
});

// Add WhatsApp settings schema
export const updateWhatsAppSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^[0-9+\-() ]+$/, 'Invalid phone number format')
    .optional(),
  isEnabled: z.boolean().optional(),
  messageTemplate: z
    .string()
    .max(500, 'Message template cannot exceed 500 characters')
    .optional(),
});