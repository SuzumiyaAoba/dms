import { ERROR_CODES, HTTP_STATUS } from '../config/constants';

export class AppError extends Error {
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

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ERROR_CODES.VALIDATION_ERROR, message, HTTP_STATUS.BAD_REQUEST, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(ERROR_CODES.UNAUTHORIZED, message, HTTP_STATUS.UNAUTHORIZED);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(ERROR_CODES.FORBIDDEN, message, HTTP_STATUS.FORBIDDEN);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(ERROR_CODES.NOT_FOUND, message, HTTP_STATUS.NOT_FOUND);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ERROR_CODES.CONFLICT, message, HTTP_STATUS.CONFLICT);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(ERROR_CODES.RATE_LIMIT_EXCEEDED, message, HTTP_STATUS.TOO_MANY_REQUESTS);
    this.name = 'RateLimitError';
  }
}
