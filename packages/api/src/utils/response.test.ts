import type { Context } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { HTTP_STATUS } from '../config/constants';
import { errorResponse, paginatedResponse, successResponse } from './response';

// Mock Hono context
const createMockContext = (requestId?: string): Context => {
  const mockContext = {
    get: vi.fn((key: string) => {
      if (key === 'requestId') return requestId;
      return undefined;
    }),
    json: vi.fn((data, status) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  } as unknown as Context;

  return mockContext;
};

describe('successResponse', () => {
  it('should create a success response with data', async () => {
    const c = createMockContext('test-request-id');
    const data = { id: '123', name: 'Test' };

    const response = successResponse(c, data);
    const json = await response.json();

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(data);
    expect(json.meta.requestId).toBe('test-request-id');
    expect(json.meta.timestamp).toBeDefined();
    expect(new Date(json.meta.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('should create a success response with custom status code', async () => {
    const c = createMockContext();
    const data = { id: '123' };

    const response = successResponse(c, data, HTTP_STATUS.CREATED);
    const json = await response.json();

    expect(response.status).toBe(HTTP_STATUS.CREATED);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(data);
  });

  it('should handle missing request ID', async () => {
    const c = createMockContext();
    const data = { test: 'value' };

    const response = successResponse(c, data);
    const json = await response.json();

    expect(json.meta.requestId).toBeUndefined();
    expect(json.meta.timestamp).toBeDefined();
  });
});

describe('errorResponse', () => {
  it('should create an error response with all fields', async () => {
    const c = createMockContext('error-request-id');

    const response = errorResponse(c, 'TEST_ERROR', 'Test error message', HTTP_STATUS.BAD_REQUEST, {
      field: 'email',
    });
    const json = await response.json();

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(json.success).toBe(false);
    expect(json.error).toEqual({
      code: 'TEST_ERROR',
      message: 'Test error message',
      details: { field: 'email' },
    });
    expect(json.meta.requestId).toBe('error-request-id');
    expect(json.meta.timestamp).toBeDefined();
  });

  it('should use default status code when not provided', async () => {
    const c = createMockContext();

    const response = errorResponse(c, 'ERROR', 'Error message');
    const json = await response.json();

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(json.success).toBe(false);
  });

  it('should create error response without details', async () => {
    const c = createMockContext();

    const response = errorResponse(c, 'NOT_FOUND', 'Resource not found', HTTP_STATUS.NOT_FOUND);
    const json = await response.json();

    expect(json.error.details).toBeUndefined();
    expect(json.error.code).toBe('NOT_FOUND');
    expect(json.error.message).toBe('Resource not found');
  });
});

describe('paginatedResponse', () => {
  it('should create a paginated response with correct structure', async () => {
    const c = createMockContext('paginated-request-id');
    const items = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
      { id: '3', name: 'Item 3' },
    ];

    const response = paginatedResponse(c, items, 1, 10, 25);
    const json = await response.json();

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(json.success).toBe(true);
    expect(json.data.items).toEqual(items);
    expect(json.data.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
    expect(json.meta.requestId).toBe('paginated-request-id');
  });

  it('should calculate total pages correctly', async () => {
    const c = createMockContext();

    // Test exact division
    let response = paginatedResponse(c, [], 1, 10, 30);
    let json = await response.json();
    expect(json.data.pagination.totalPages).toBe(3);

    // Test with remainder
    response = paginatedResponse(c, [], 1, 10, 25);
    json = await response.json();
    expect(json.data.pagination.totalPages).toBe(3);

    // Test less than one page
    response = paginatedResponse(c, [], 1, 10, 5);
    json = await response.json();
    expect(json.data.pagination.totalPages).toBe(1);

    // Test empty result
    response = paginatedResponse(c, [], 1, 10, 0);
    json = await response.json();
    expect(json.data.pagination.totalPages).toBe(0);
  });

  it('should handle different page numbers', async () => {
    const c = createMockContext();
    const items = [{ id: '4' }, { id: '5' }];

    const response = paginatedResponse(c, items, 2, 10, 15);
    const json = await response.json();

    expect(json.data.pagination.page).toBe(2);
    expect(json.data.pagination.limit).toBe(10);
    expect(json.data.pagination.total).toBe(15);
    expect(json.data.pagination.totalPages).toBe(2);
  });

  it('should handle empty items array', async () => {
    const c = createMockContext();

    const response = paginatedResponse(c, [], 1, 10, 0);
    const json = await response.json();

    expect(json.data.items).toEqual([]);
    expect(json.data.pagination.total).toBe(0);
  });
});
