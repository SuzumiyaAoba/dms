/**
 * API response utilities module
 *
 * This module provides helper functions and types for creating consistent,
 * structured API responses. All responses follow a standard format with
 * success/error indicators, data/error payloads, and metadata.
 *
 * @module utils/response
 */

import type { Context } from 'hono';
import { HTTP_STATUS } from '@/config/constants';

/**
 * Standard API response structure
 *
 * @template T - Type of the response data
 *
 * @property {boolean} success - Indicates if the request was successful
 * @property {T} data - Response data (present on success)
 * @property {object} error - Error information (present on failure)
 * @property {string} error.code - Machine-readable error code
 * @property {string} error.message - Human-readable error message
 * @property {unknown} error.details - Optional additional error details
 * @property {object} meta - Response metadata
 * @property {string} meta.timestamp - ISO 8601 timestamp of the response
 * @property {string} meta.requestId - Unique request identifier for tracing
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Paginated data structure
 *
 * @template T - Type of items in the paginated list
 *
 * @property {T[]} items - Array of items for the current page
 * @property {object} pagination - Pagination information
 * @property {number} pagination.page - Current page number (1-indexed)
 * @property {number} pagination.limit - Number of items per page
 * @property {number} pagination.total - Total number of items across all pages
 * @property {number} pagination.totalPages - Total number of pages
 */
export interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Creates a successful API response
 *
 * Generates a standardized success response with the provided data,
 * timestamp, and request ID.
 *
 * @template T - Type of the response data
 * @param {Context} c - Hono context object
 * @param {T} data - Data to include in the response
 * @param {number} status - HTTP status code (default: 200)
 * @returns {Response} Hono response with JSON body
 *
 * @example
 * ```typescript
 * return successResponse(c, { id: '123', name: 'Document' }, HTTP_STATUS.CREATED);
 * // Returns: { success: true, data: {...}, meta: {...} }
 * ```
 */
export const successResponse = <T>(
  c: Context,
  data: T,
  status: number = HTTP_STATUS.OK,
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    },
  };

  return c.json(response, status as never);
};

/**
 * Creates an error API response
 *
 * Generates a standardized error response with error code, message,
 * optional details, timestamp, and request ID.
 *
 * @param {Context} c - Hono context object
 * @param {string} code - Machine-readable error code
 * @param {string} message - Human-readable error message
 * @param {number} status - HTTP status code (default: 500)
 * @param {unknown} details - Optional additional error details
 * @returns {Response} Hono response with JSON body
 *
 * @example
 * ```typescript
 * return errorResponse(
 *   c,
 *   ERROR_CODES.NOT_FOUND,
 *   'Document not found',
 *   HTTP_STATUS.NOT_FOUND,
 *   { documentId: '123' }
 * );
 * // Returns: { success: false, error: {...}, meta: {...} }
 * ```
 */
export const errorResponse = (
  c: Context,
  code: string,
  message: string,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  details?: unknown,
): Response => {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: c.get('requestId'),
    },
  };

  return c.json(response, status as never);
};

/**
 * Creates a paginated API response
 *
 * Generates a standardized success response with paginated data,
 * including items and pagination metadata (current page, total items, etc.).
 *
 * @template T - Type of items in the paginated list
 * @param {Context} c - Hono context object
 * @param {T[]} items - Array of items for the current page
 * @param {number} page - Current page number (1-indexed)
 * @param {number} limit - Number of items per page
 * @param {number} total - Total number of items across all pages
 * @returns {Response} Hono response with JSON body
 *
 * @example
 * ```typescript
 * const documents = await getDocuments(page, limit);
 * const total = await countDocuments();
 * return paginatedResponse(c, documents, page, limit, total);
 * // Returns: { success: true, data: { items: [...], pagination: {...} }, meta: {...} }
 * ```
 */
export const paginatedResponse = <T>(
  c: Context,
  items: T[],
  page: number,
  limit: number,
  total: number,
): Response => {
  const data: PaginatedData<T> = {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };

  return successResponse(c, data);
};
