import type { Context } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import { ERROR_CODES, HTTP_STATUS } from '../config/constants';
import { AppError, NotFoundError, ValidationError } from '../utils/errors';
import { errorHandler } from './errorHandler';

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Helper to create mock context
const createMockContext = (requestId = 'test-request-id'): Context => {
  let jsonData: unknown;
  let jsonStatus: number;

  return {
    get: vi.fn((key: string) => {
      if (key === 'requestId') return requestId;
      return undefined;
    }),
    json: vi.fn((data, status) => {
      jsonData = data;
      jsonStatus = status;
      return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
    // Helper to get the json data for testing
    _getJsonData: () => jsonData,
    _getJsonStatus: () => jsonStatus,
  } as unknown as Context;
};

describe('errorHandler', () => {
  it('should pass through when no error is thrown', async () => {
    const c = createMockContext();
    const next = vi.fn(async () => {});

    await errorHandler(c, next);

    expect(next).toHaveBeenCalled();
  });

  it('should handle ZodError', async () => {
    const c = createMockContext('zod-error-id');
    const zodError = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['email'],
        message: 'Expected string, received number',
      },
    ]);

    const next = vi.fn(async () => {
      throw zodError;
    });

    const response = await errorHandler(c, next);
    const json = await response.json();

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(json.error.message).toBe('Validation failed');
    expect(json.error.details).toBeDefined();
    expect(json.meta.requestId).toBe('zod-error-id');
  });

  it('should handle AppError', async () => {
    const c = createMockContext('app-error-id');
    const appError = new AppError('CUSTOM_ERROR', 'Custom error message', HTTP_STATUS.BAD_REQUEST, {
      field: 'test',
    });

    const next = vi.fn(async () => {
      throw appError;
    });

    const response = await errorHandler(c, next);
    const json = await response.json();

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('CUSTOM_ERROR');
    expect(json.error.message).toBe('Custom error message');
    expect(json.error.details).toEqual({ field: 'test' });
    expect(json.meta.requestId).toBe('app-error-id');
  });

  it('should handle NotFoundError', async () => {
    const c = createMockContext();
    const notFoundError = new NotFoundError('Document', 'abc123');

    const next = vi.fn(async () => {
      throw notFoundError;
    });

    const response = await errorHandler(c, next);
    const json = await response.json();

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(json.error.message).toBe("Document with identifier 'abc123' not found");
  });

  it('should handle ValidationError', async () => {
    const c = createMockContext();
    const validationError = new ValidationError('Email is required', { field: 'email' });

    const next = vi.fn(async () => {
      throw validationError;
    });

    const response = await errorHandler(c, next);
    const json = await response.json();

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(json.error.message).toBe('Email is required');
    expect(json.error.details).toEqual({ field: 'email' });
  });

  it('should handle unknown errors', async () => {
    const c = createMockContext('unknown-error-id');
    const unknownError = new Error('Unknown error occurred');

    const next = vi.fn(async () => {
      throw unknownError;
    });

    const response = await errorHandler(c, next);
    const json = await response.json();

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(json.error.message).toBe('Internal server error');
    expect(json.meta.requestId).toBe('unknown-error-id');
  });

  it('should handle non-Error thrown values', async () => {
    const c = createMockContext();

    const next = vi.fn(async () => {
      throw 'string error'; // Throwing a non-Error value
    });

    const response = await errorHandler(c, next);
    const json = await response.json();

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
  });
});
