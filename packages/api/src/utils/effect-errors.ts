/**
 * Effect-based error types module
 *
 * This module defines Effect-compatible error types for type-safe error handling.
 * These errors can be used with Effect's error channel for better type inference.
 *
 * @module utils/effect-errors
 */

import { FileNotFoundError, StorageError } from '@dms/core';
import { Data } from 'effect';
import { HTTP_STATUS } from '@/config/constants';

/**
 * Base error class for Effect-based errors
 */
export class ValidationError extends Data.TaggedError('ValidationError')<{
  message: string;
  details?: unknown;
}> {
  readonly statusCode = HTTP_STATUS.BAD_REQUEST;
}

export class UnauthorizedError extends Data.TaggedError('UnauthorizedError')<{
  message: string;
}> {
  readonly statusCode = HTTP_STATUS.UNAUTHORIZED;
}

export class ForbiddenError extends Data.TaggedError('ForbiddenError')<{
  message: string;
}> {
  readonly statusCode = HTTP_STATUS.FORBIDDEN;
}

export class NotFoundError extends Data.TaggedError('NotFoundError')<{
  resource: string;
  identifier?: string;
}> {
  readonly statusCode = HTTP_STATUS.NOT_FOUND;

  get message(): string {
    return this.identifier
      ? `${this.resource} with identifier '${this.identifier}' not found`
      : `${this.resource} not found`;
  }
}

export class ConflictError extends Data.TaggedError('ConflictError')<{
  message: string;
}> {
  readonly statusCode = HTTP_STATUS.CONFLICT;
}

export class RateLimitError extends Data.TaggedError('RateLimitError')<{
  message: string;
}> {
  readonly statusCode = HTTP_STATUS.TOO_MANY_REQUESTS;
}

export class RepositoryError extends Data.TaggedError('RepositoryError')<{
  message: string;
  cause?: unknown;
}> {
  readonly statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
}

export class DatabaseError extends Data.TaggedError('DatabaseError')<{
  operation: string;
  cause?: unknown;
}> {
  readonly statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;

  get message(): string {
    return `Database operation '${this.operation}' failed`;
  }
}

// Re-export storage errors from core
export { StorageError, FileNotFoundError };

/**
 * Union type of all possible errors
 */
export type AppError =
  | ValidationError
  | UnauthorizedError
  | ForbiddenError
  | NotFoundError
  | ConflictError
  | RateLimitError
  | StorageError
  | FileNotFoundError
  | RepositoryError
  | DatabaseError;
