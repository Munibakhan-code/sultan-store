// src/validators/account.validator.ts
import { z } from 'zod';

export const createAccountSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),
  priceUSD: z
    .number()
    .min(0, 'USD price must be a positive number'),
  pricePKR: z
    .number()
    .min(0, 'PKR price must be a positive number'),
  level: z
    .number()
    .min(1, 'Level must be at least 1')
    .max(500, 'Level cannot exceed 500'),
  rank: z.enum(['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Crown', 'Ace', 'Conqueror'], {
    errorMap: () => ({ message: 'Invalid rank. Must be one of: Bronze, Silver, Gold, Platinum, Diamond, Crown, Ace, Conqueror' })
  }),
  skins: z.array(z.string()).default([]),
  weapons: z.array(z.string()).default([]),
  outfits: z.array(z.string()).default([]),
  status: z.enum(['available', 'reserved', 'sold'], {
    errorMap: () => ({ message: 'Invalid status. Must be one of: available, reserved, sold' })
  }).default('available'),
  images: z
    .array(
      z.object({
        url: z.string().url('Invalid image URL format'),
        publicId: z.string().min(1, 'Public ID is required'),
      })
    )
    .max(10, 'Maximum 10 images allowed')
    .default([]),
});

export const updateAccountSchema = createAccountSchema
  .partial()
  .extend({
    status: z.enum(['available', 'reserved', 'sold'], {
      errorMap: () => ({ message: 'Invalid status. Must be one of: available, reserved, sold' })
    }).optional(),
  })
  .omit({ images: true }); // Remove images from update schema

export const getAccountsQuerySchema = z.object({
  search: z.string().optional(),
  minPriceUSD: z.preprocess(
    (val) => (val === undefined || val === '' ? undefined : Number(val)),
    z.number().min(0, 'Minimum USD price must be a positive number').optional()
  ),
  maxPriceUSD: z.preprocess(
    (val) => (val === undefined || val === '' ? undefined : Number(val)),
    z.number().min(0, 'Maximum USD price must be a positive number').optional()
  ),
  minPricePKR: z.preprocess(
    (val) => (val === undefined || val === '' ? undefined : Number(val)),
    z.number().min(0, 'Minimum PKR price must be a positive number').optional()
  ),
  maxPricePKR: z.preprocess(
    (val) => (val === undefined || val === '' ? undefined : Number(val)),
    z.number().min(0, 'Maximum PKR price must be a positive number').optional()
  ),
  rank: z.enum(['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Crown', 'Ace', 'Conqueror'], {
    errorMap: () => ({ message: 'Invalid rank. Must be one of: Bronze, Silver, Gold, Platinum, Diamond, Crown, Ace, Conqueror' })
  }).optional(),
  minLevel: z.preprocess(
    (val) => (val === undefined || val === '' ? undefined : Number(val)),
    z.number().min(1, 'Minimum level must be at least 1').optional()
  ),
  maxLevel: z.preprocess(
    (val) => (val === undefined || val === '' ? undefined : Number(val)),
    z.number().min(1, 'Maximum level must be at least 1').optional()
  ),
  status: z.enum(['available', 'reserved', 'sold'], {
    errorMap: () => ({ message: 'Invalid status. Must be one of: available, reserved, sold' })
  }).optional(),
  sortBy: z.enum(['priceUSD', 'pricePKR', 'level', 'createdAt'], {
    errorMap: () => ({ message: 'Invalid sort field. Must be one of: priceUSD, pricePKR, level, createdAt' })
  }).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc'], {
    errorMap: () => ({ message: 'Invalid sort order. Must be one of: asc, desc' })
  }).default('desc'),
  page: z.preprocess(
    (val) => (val === undefined || val === '' ? 1 : Number(val)),
    z.number().min(1, 'Page must be at least 1').default(1)
  ),
  limit: z.preprocess(
    (val) => (val === undefined || val === '' ? 10 : Number(val)),
    z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10)
  ),
});