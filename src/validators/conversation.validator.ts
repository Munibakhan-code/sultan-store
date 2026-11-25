// src/validators/conversation.validator.ts
import { z } from 'zod';

export const sendMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .max(10000, 'Message cannot exceed 10000 characters'),
});

export const getMessagesQuerySchema = z.object({
  page: z.preprocess(
    (val) => (val === undefined || val === '' ? 1 : Number(val)),
    z.number().min(1, 'Page must be at least 1').default(1)
  ),
  limit: z.preprocess(
    (val) => (val === undefined || val === '' ? 50 : Number(val)),
    z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(50)
  ),
});