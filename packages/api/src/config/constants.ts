/**
 * Application constants module
 *
 * This module defines all constant values used throughout the API application,
 * including API versioning, rate limits, file upload constraints, pagination defaults,
 * HTTP status codes, and error codes.
 *
 * @module config/constants
 */

/** Current API version */
export const API_VERSION = 'v1';

/** API URL prefix including version */
export const API_PREFIX = `/api/${API_VERSION}`;

/**
 * Rate limiting configuration
 *
 * Defines request limits for different types of operations to prevent abuse.
 */
export const RATE_LIMITS = {
  /** General API requests per minute */
  GENERAL: 100,
  /** Search requests per minute */
  SEARCH: 30,
  /** LLM-based requests per minute */
  LLM: 10,
  /** File upload requests per hour */
  UPLOAD: 20,
} as const;

/**
 * File upload constraints
 *
 * Defines maximum file size and allowed MIME types for document uploads.
 */
export const FILE_UPLOAD = {
  /** Maximum file size in bytes (100MB) */
  MAX_SIZE: 100 * 1024 * 1024,
  /** List of allowed MIME types for document uploads */
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/markdown',
  ],
} as const;

/**
 * Pagination default values
 *
 * Defines default page number, items per page, and maximum allowed limit.
 */
export const PAGINATION = {
  /** Default page number (1-indexed) */
  DEFAULT_PAGE: 1,
  /** Default number of items per page */
  DEFAULT_LIMIT: 20,
  /** Maximum number of items per page */
  MAX_LIMIT: 100,
} as const;

/**
 * HTTP status codes
 *
 * Standard HTTP status codes used throughout the API for consistent responses.
 */
export const HTTP_STATUS = {
  /** 200 - Request succeeded */
  OK: 200,
  /** 201 - Resource created successfully */
  CREATED: 201,
  /** 204 - Request succeeded with no content to return */
  NO_CONTENT: 204,
  /** 400 - Invalid request */
  BAD_REQUEST: 400,
  /** 401 - Authentication required */
  UNAUTHORIZED: 401,
  /** 403 - Authenticated but not authorized */
  FORBIDDEN: 403,
  /** 404 - Resource not found */
  NOT_FOUND: 404,
  /** 409 - Request conflicts with current state */
  CONFLICT: 409,
  /** 422 - Request semantically invalid */
  UNPROCESSABLE_ENTITY: 422,
  /** 429 - Too many requests */
  TOO_MANY_REQUESTS: 429,
  /** 500 - Server error */
  INTERNAL_SERVER_ERROR: 500,
  /** 503 - Service temporarily unavailable */
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Application error codes
 *
 * Custom error codes for consistent error handling and client error identification.
 */
export const ERROR_CODES = {
  /** Validation error code */
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  /** Unauthorized access error code */
  UNAUTHORIZED: 'UNAUTHORIZED',
  /** Forbidden access error code */
  FORBIDDEN: 'FORBIDDEN',
  /** Resource not found error code */
  NOT_FOUND: 'NOT_FOUND',
  /** Resource conflict error code */
  CONFLICT: 'CONFLICT',
  /** Internal server error code */
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  /** Service unavailable error code */
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  /** Rate limit exceeded error code */
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;
