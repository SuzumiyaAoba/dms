/**
 * Custom error classes module
 *
 * This module defines a hierarchy of custom error classes for consistent
 * error handling throughout the application. All errors extend AppError
 * which provides structured error information including error codes,
 * HTTP status codes, and optional details.
 *
 * @module utils/errors
 */

import { ERROR_CODES, HTTP_STATUS } from '../config/constants';

/**
 * Base application error class
 *
 * All custom errors should extend this class. Provides structured error
 * information including error code, message, HTTP status code, and optional details.
 *
 * @example
 * ```typescript
 * throw new AppError('CUSTOM_ERROR', 'Something went wrong', 400, { field: 'email' });
 * ```
 */
export class AppError extends Error {
  /**
   * Creates an instance of AppError
   *
   * @param {string} code - Error code for client identification
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {unknown} details - Optional additional error details
   */
  constructor(
    public code: string,
    message: string,
    public statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class
 *
 * Thrown when input validation fails. Returns HTTP 400 status code.
 *
 * @example
 * ```typescript
 * throw new ValidationError('Email is required', { field: 'email' });
 * ```
 */
export class ValidationError extends AppError {
  /**
   * Creates an instance of ValidationError
   *
   * @param {string} message - Validation error message
   * @param {unknown} details - Optional validation error details (e.g., field-specific errors)
   */
  constructor(message: string, details?: unknown) {
    super(ERROR_CODES.VALIDATION_ERROR, message, HTTP_STATUS.BAD_REQUEST, details);
    this.name = 'ValidationError';
  }
}

/**
 * Unauthorized error class
 *
 * Thrown when authentication is required but not provided or invalid.
 * Returns HTTP 401 status code.
 *
 * @example
 * ```typescript
 * throw new UnauthorizedError('Invalid token');
 * ```
 */
export class UnauthorizedError extends AppError {
  /**
   * Creates an instance of UnauthorizedError
   *
   * @param {string} message - Unauthorized error message (default: 'Unauthorized')
   */
  constructor(message = 'Unauthorized') {
    super(ERROR_CODES.UNAUTHORIZED, message, HTTP_STATUS.UNAUTHORIZED);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden error class
 *
 * Thrown when user is authenticated but not authorized to access the resource.
 * Returns HTTP 403 status code.
 *
 * @example
 * ```typescript
 * throw new ForbiddenError('You do not have permission to delete this document');
 * ```
 */
export class ForbiddenError extends AppError {
  /**
   * Creates an instance of ForbiddenError
   *
   * @param {string} message - Forbidden error message (default: 'Forbidden')
   */
  constructor(message = 'Forbidden') {
    super(ERROR_CODES.FORBIDDEN, message, HTTP_STATUS.FORBIDDEN);
    this.name = 'ForbiddenError';
  }
}

/**
 * Not found error class
 *
 * Thrown when a requested resource cannot be found. Returns HTTP 404 status code.
 *
 * @example
 * ```typescript
 * throw new NotFoundError('Document', 'abc123');
 * // Message: "Document with identifier 'abc123' not found"
 *
 * throw new NotFoundError('User');
 * // Message: "User not found"
 * ```
 */
export class NotFoundError extends AppError {
  /**
   * Creates an instance of NotFoundError
   *
   * @param {string} resource - Name of the resource that was not found
   * @param {string} identifier - Optional identifier of the resource
   */
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(ERROR_CODES.NOT_FOUND, message, HTTP_STATUS.NOT_FOUND);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error class
 *
 * Thrown when the request conflicts with the current state of the server.
 * Returns HTTP 409 status code.
 *
 * @example
 * ```typescript
 * throw new ConflictError('Document with this name already exists');
 * ```
 */
export class ConflictError extends AppError {
  /**
   * Creates an instance of ConflictError
   *
   * @param {string} message - Conflict error message
   */
  constructor(message: string) {
    super(ERROR_CODES.CONFLICT, message, HTTP_STATUS.CONFLICT);
    this.name = 'ConflictError';
  }
}

/**
 * Rate limit error class
 *
 * Thrown when a client exceeds the allowed rate limit. Returns HTTP 429 status code.
 *
 * @example
 * ```typescript
 * throw new RateLimitError('Too many search requests');
 * ```
 */
export class RateLimitError extends AppError {
  /**
   * Creates an instance of RateLimitError
   *
   * @param {string} message - Rate limit error message (default: 'Rate limit exceeded')
   */
  constructor(message = 'Rate limit exceeded') {
    super(ERROR_CODES.RATE_LIMIT_EXCEEDED, message, HTTP_STATUS.TOO_MANY_REQUESTS);
    this.name = 'RateLimitError';
  }
}
