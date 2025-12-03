/**
 * Validation schemas module
 *
 * This module provides reusable Zod validation schemas for common API request
 * parameters such as IDs, pagination, sorting, and search queries. These schemas
 * ensure consistent validation across all endpoints.
 *
 * @module utils/validation
 */

import { z } from 'zod';
import { PAGINATION } from '@/config/constants';

/**
 * Schema for validating resource ID parameters
 *
 * Ensures the ID is a non-empty string.
 *
 * @example
 * ```typescript
 * const validator = zValidator('param', idSchema);
 * app.get('/documents/:id', validator, async (c) => {
 *   const { id } = c.req.valid('param');
 * });
 * ```
 */
export const idSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

/**
 * Schema for validating pagination query parameters
 *
 * Provides default values and constraints for page number and limit.
 * - page: Must be a positive integer (default: 1)
 * - limit: Must be a positive integer, max 100 (default: 20)
 *
 * @example
 * ```typescript
 * const validator = zValidator('query', paginationSchema);
 * app.get('/documents', validator, async (c) => {
 *   const { page, limit } = c.req.valid('query');
 *   // page and limit are guaranteed to be valid integers
 * });
 * ```
 */
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

/**
 * Schema for validating sort query parameters
 *
 * Defines allowed sort fields and sort order (ascending/descending).
 * - sortBy: One of 'createdAt', 'updatedAt', or 'title' (default: 'createdAt')
 * - order: Either 'asc' or 'desc' (default: 'desc')
 *
 * @example
 * ```typescript
 * const validator = zValidator('query', sortSchema);
 * app.get('/documents', validator, async (c) => {
 *   const { sortBy, order } = c.req.valid('query');
 *   // sortBy and order are type-safe and validated
 * });
 * ```
 */
export const sortSchema = z.object({
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Schema for validating search query parameters
 *
 * Defines search query, search type, and result limit.
 * - query: Non-empty search string (required)
 * - type: Search strategy - 'hybrid', 'embedding', 'fulltext', or 'string' (default: 'hybrid')
 * - limit: Number of results to return, max 100 (default: 10)
 *
 * @example
 * ```typescript
 * const validator = zValidator('query', searchQuerySchema);
 * app.get('/search', validator, async (c) => {
 *   const { query, type, limit } = c.req.valid('query');
 *   // Perform search with validated parameters
 * });
 * ```
 */
export const searchQuerySchema = z.object({
  query: z.string().min(1, 'Query is required'),
  type: z.enum(['hybrid', 'embedding', 'fulltext', 'string']).optional().default('hybrid'),
  limit: z.number().int().positive().max(100).optional().default(10),
});

/**
 * Helper function to create validation middleware
 *
 * This is a pass-through function that can be extended in the future
 * for custom validation logic or middleware creation.
 *
 * @template T - Zod schema type
 * @param {T} schema - Zod schema to validate against
 * @returns {T} The same schema (pass-through)
 *
 * @example
 * ```typescript
 * const mySchema = validate(z.object({ name: z.string() }));
 * ```
 */
export const validate = <T extends z.ZodTypeAny>(schema: T) => {
  return schema;
};
