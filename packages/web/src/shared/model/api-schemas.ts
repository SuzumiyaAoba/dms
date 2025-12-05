/**
 * Zod schemas for API responses
 *
 * Following "Parse, don't validate" principle
 */

import { z } from 'zod';

/**
 * Document status enum
 */
export const DocumentStatusSchema = z.enum(['processing', 'ready', 'error']);

/**
 * Document schema
 */
export const DocumentSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  tags: z.array(z.string()),
  metadata: z.record(z.string(), z.unknown()),
  fileUrl: z.string(),
  fileName: z.string(),
  fileSize: z.number().int().positive(),
  mimeType: z.string(),
  extractedText: z.string().nullable(),
  embeddingId: z.string().uuid().nullable(),
  status: DocumentStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});

/**
 * Pagination metadata schema
 */
export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

/**
 * Response metadata schema
 */
export const ResponseMetaSchema = z.object({
  timestamp: z.string().datetime(),
  requestId: z.string().optional(),
});

/**
 * Success response schema
 */
export const ApiSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: ResponseMetaSchema,
  });

/**
 * Paginated response schema
 */
export const PaginatedApiResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.literal(true),
    data: z.object({
      items: z.array(itemSchema),
      pagination: PaginationSchema,
    }),
    meta: ResponseMetaSchema,
  });

/**
 * Error response schema
 */
export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
  meta: ResponseMetaSchema,
});

/**
 * Health check response schema
 */
export const HealthResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
});
