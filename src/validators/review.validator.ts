// src/validators/review.validator.ts
import { z } from 'zod';

export const createReviewSchema = z.object({
  orderId: z
    .string()
    .min(1, 'Order ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID format'),
  rating: z
    .number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  comment: z
    .string()
    .min(3, 'Comment must be at least 3 characters')
    .max(1000, 'Comment cannot exceed 1000 characters'),
});

export const updateReviewStatusSchema = z.object({
  status: z.enum(['pending', 'published', 'private'], {
    errorMap: () => ({ message: 'Invalid status. Must be one of: pending, published, private' })
  }),
});