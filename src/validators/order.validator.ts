// src/validators/order.validator.ts
import { z } from 'zod';

export const createOrderSchema = z.object({
  accountId: z
    .string()
    .min(1, 'Account ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid account ID format'),
  paymentMethodId: z
    .string()
    .min(1, 'Payment method is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid payment method ID format'),
});

export const submitPaymentSchema = z.object({
  paymentMethodId: z
    .string()
    .min(1, 'Payment method is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid payment method ID format'),
  screenshotBase64: z
    .string()
    .min(1, 'Payment screenshot is required')
    .regex(/^data:image\/(jpeg|png|gif|webp);base64,/, 'Invalid screenshot format. Must be a base64 image'),
});

export const getOrdersQuerySchema = z.object({
  status: z.enum(['pending', 'submitted', 'approved', 'rejected'], {
    errorMap: () => ({ message: 'Invalid payment status. Must be one of: pending, submitted, approved, rejected' })
  }).optional(),
  dealStatus: z.enum(['pending', 'credentials_sent', 'completed'], {
    errorMap: () => ({ message: 'Invalid deal status. Must be one of: pending, credentials_sent, completed' })
  }).optional(),
  page: z.preprocess(
    (val) => (val === undefined || val === '' ? 1 : Number(val)),
    z.number().min(1, 'Page must be at least 1').default(1)
  ),
  limit: z.preprocess(
    (val) => (val === undefined || val === '' ? 10 : Number(val)),
    z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10)
  ),
});

export const updateDealStatusSchema = z.object({
  dealStatus: z.enum(['pending', 'credentials_sent', 'completed'], {
    errorMap: () => ({ message: 'Invalid deal status. Must be one of: pending, credentials_sent, completed' })
  }),
});

export const analyticsQuerySchema = z.object({
  period: z.enum(['today', 'week', 'month', 'year'], {
    errorMap: () => ({ message: 'Invalid period. Must be one of: today, week, month, year' })
  }).optional().default('month'),
});