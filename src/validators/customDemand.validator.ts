// src/validators/customDemand.validator.ts
import { z } from 'zod';

export const createCustomDemandSchema = z.object({
  requirements: z
    .string()
    .min(10, 'Requirements must be at least 10 characters')
    .max(2000, 'Requirements cannot exceed 2000 characters'),
  rank: z
    .string()
    .optional(),
  level: z
    .number()
    .min(1, 'Level must be at least 1')
    .max(500, 'Level cannot exceed 500')
    .optional(),
  skins: z
    .array(z.string())
    .default([]),
  budget: z
    .number()
    .min(0, 'Budget must be a positive number')
    .optional(),
  additionalInformation: z
    .string()
    .max(1000, 'Additional information cannot exceed 1000 characters')
    .optional(),
});

export const updateCustomDemandSchema = createCustomDemandSchema.partial().extend({
  status: z.enum(['pending', 'assisted', 'completed'], {
    errorMap: () => ({ message: 'Invalid status. Must be one of: pending, assisted, completed' })
  }).optional(),
});