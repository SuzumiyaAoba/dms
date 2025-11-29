import { z } from 'zod';
import { PAGINATION } from '../config/constants';

// Common validation schemas

export const idSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default(String(PAGINATION.DEFAULT_PAGE))
    .transform(Number)
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .default(String(PAGINATION.DEFAULT_LIMIT))
    .transform(Number)
    .pipe(z.number().int().positive().max(PAGINATION.MAX_LIMIT)),
});

export const sortSchema = z.object({
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const searchQuerySchema = z.object({
  query: z.string().min(1, 'Query is required'),
  type: z.enum(['hybrid', 'embedding', 'fulltext', 'string']).optional().default('hybrid'),
  limit: z.number().int().positive().max(100).optional().default(10),
});

// Helper to create validation middleware
export const validate = <T extends z.ZodTypeAny>(schema: T) => {
  return schema;
};
