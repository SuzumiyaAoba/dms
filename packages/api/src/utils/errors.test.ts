import { describe, expect, it } from 'vitest';
import { ERROR_CODES, HTTP_STATUS } from '../config/constants';
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
  ValidationError,
} from './errors';

describe('AppError', () => {
  it('should create an error with all properties', () => {
    const error = new AppError('TEST_ERROR', 'Test message', 400, { field: 'test' });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.name).toBe('AppError');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.message).toBe('Test message');
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual({ field: 'test' });
    expect(error.stack).toBeDefined();
  });

  it('should use default status code when not provided', () => {
    const error = new AppError('TEST_ERROR', 'Test message');

    expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(error.details).toBeUndefined();
  });
});

describe('ValidationError', () => {
  it('should create a validation error with details', () => {
    const error = new ValidationError('Email is required', { field: 'email' });

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.name).toBe('ValidationError');
    expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(error.message).toBe('Email is required');
    expect(error.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(error.details).toEqual({ field: 'email' });
  });

  it('should create a validation error without details', () => {
    const error = new ValidationError('Validation failed');

    expect(error.message).toBe('Validation failed');
    expect(error.details).toBeUndefined();
  });
});

describe('UnauthorizedError', () => {
  it('should create an unauthorized error with custom message', () => {
    const error = new UnauthorizedError('Invalid token');

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.name).toBe('UnauthorizedError');
    expect(error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    expect(error.message).toBe('Invalid token');
    expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  it('should use default message when not provided', () => {
    const error = new UnauthorizedError();

    expect(error.message).toBe('Unauthorized');
  });
});

describe('ForbiddenError', () => {
  it('should create a forbidden error with custom message', () => {
    const error = new ForbiddenError('You do not have permission');

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(ForbiddenError);
    expect(error.name).toBe('ForbiddenError');
    expect(error.code).toBe(ERROR_CODES.FORBIDDEN);
    expect(error.message).toBe('You do not have permission');
    expect(error.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
  });

  it('should use default message when not provided', () => {
    const error = new ForbiddenError();

    expect(error.message).toBe('Forbidden');
  });
});

describe('NotFoundError', () => {
  it('should create a not found error with identifier', () => {
    const error = new NotFoundError('Document', 'abc123');

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.name).toBe('NotFoundError');
    expect(error.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(error.message).toBe("Document with identifier 'abc123' not found");
    expect(error.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
  });

  it('should create a not found error without identifier', () => {
    const error = new NotFoundError('User');

    expect(error.message).toBe('User not found');
  });
});

describe('ConflictError', () => {
  it('should create a conflict error', () => {
    const error = new ConflictError('Document already exists');

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(ConflictError);
    expect(error.name).toBe('ConflictError');
    expect(error.code).toBe(ERROR_CODES.CONFLICT);
    expect(error.message).toBe('Document already exists');
    expect(error.statusCode).toBe(HTTP_STATUS.CONFLICT);
  });
});

describe('RateLimitError', () => {
  it('should create a rate limit error with custom message', () => {
    const error = new RateLimitError('Too many requests');

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.name).toBe('RateLimitError');
    expect(error.code).toBe(ERROR_CODES.RATE_LIMIT_EXCEEDED);
    expect(error.message).toBe('Too many requests');
    expect(error.statusCode).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
  });

  it('should use default message when not provided', () => {
    const error = new RateLimitError();

    expect(error.message).toBe('Rate limit exceeded');
  });
});
