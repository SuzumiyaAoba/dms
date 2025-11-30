import { describe, expect, it } from 'vitest';
import { PAGINATION } from '../config/constants';
import { idSchema, paginationSchema, searchQuerySchema, sortSchema, validate } from './validation';

describe('idSchema', () => {
  it('should validate a valid ID', () => {
    const result = idSchema.safeParse({ id: 'abc123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('abc123');
    }
  });

  it('should reject empty string ID', () => {
    const result = idSchema.safeParse({ id: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('ID is required');
    }
  });

  it('should reject missing ID', () => {
    const result = idSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('paginationSchema', () => {
  it('should use default values when not provided', () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(PAGINATION.DEFAULT_PAGE);
      expect(result.data.limit).toBe(PAGINATION.DEFAULT_LIMIT);
    }
  });

  it('should parse valid page and limit', () => {
    const result = paginationSchema.safeParse({ page: '2', limit: '50' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(50);
    }
  });

  it('should reject negative page number', () => {
    const result = paginationSchema.safeParse({ page: '-1' });
    expect(result.success).toBe(false);
  });

  it('should reject zero page number', () => {
    const result = paginationSchema.safeParse({ page: '0' });
    expect(result.success).toBe(false);
  });

  it('should reject limit exceeding max', () => {
    const result = paginationSchema.safeParse({ limit: String(PAGINATION.MAX_LIMIT + 1) });
    expect(result.success).toBe(false);
  });

  it('should accept limit at max', () => {
    const result = paginationSchema.safeParse({ limit: String(PAGINATION.MAX_LIMIT) });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(PAGINATION.MAX_LIMIT);
    }
  });

  it('should reject non-numeric page', () => {
    const result = paginationSchema.safeParse({ page: 'abc' });
    expect(result.success).toBe(false);
  });

  it('should reject decimal page number', () => {
    const result = paginationSchema.safeParse({ page: '1.5' });
    expect(result.success).toBe(false);
  });
});

describe('sortSchema', () => {
  it('should use default values when not provided', () => {
    const result = sortSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortBy).toBe('createdAt');
      expect(result.data.order).toBe('desc');
    }
  });

  it('should validate valid sort parameters', () => {
    const result = sortSchema.safeParse({ sortBy: 'title', order: 'asc' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortBy).toBe('title');
      expect(result.data.order).toBe('asc');
    }
  });

  it('should accept all valid sortBy values', () => {
    const validSortFields = ['createdAt', 'updatedAt', 'title'] as const;

    for (const field of validSortFields) {
      const result = sortSchema.safeParse({ sortBy: field });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sortBy).toBe(field);
      }
    }
  });

  it('should reject invalid sortBy value', () => {
    const result = sortSchema.safeParse({ sortBy: 'invalidField' });
    expect(result.success).toBe(false);
  });

  it('should accept both asc and desc order', () => {
    let result = sortSchema.safeParse({ order: 'asc' });
    expect(result.success).toBe(true);

    result = sortSchema.safeParse({ order: 'desc' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid order value', () => {
    const result = sortSchema.safeParse({ order: 'ascending' });
    expect(result.success).toBe(false);
  });
});

describe('searchQuerySchema', () => {
  it('should validate with all fields provided', () => {
    const result = searchQuerySchema.safeParse({
      query: 'test search',
      type: 'embedding',
      limit: 20,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toBe('test search');
      expect(result.data.type).toBe('embedding');
      expect(result.data.limit).toBe(20);
    }
  });

  it('should use default values for optional fields', () => {
    const result = searchQuerySchema.safeParse({ query: 'test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('hybrid');
      expect(result.data.limit).toBe(10);
    }
  });

  it('should reject empty query string', () => {
    const result = searchQuerySchema.safeParse({ query: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Query is required');
    }
  });

  it('should reject missing query', () => {
    const result = searchQuerySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should accept all valid search types', () => {
    const validTypes = ['hybrid', 'embedding', 'fulltext', 'string'] as const;

    for (const type of validTypes) {
      const result = searchQuerySchema.safeParse({ query: 'test', type });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe(type);
      }
    }
  });

  it('should reject invalid search type', () => {
    const result = searchQuerySchema.safeParse({ query: 'test', type: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('should reject limit exceeding max', () => {
    const result = searchQuerySchema.safeParse({ query: 'test', limit: 101 });
    expect(result.success).toBe(false);
  });

  it('should reject negative limit', () => {
    const result = searchQuerySchema.safeParse({ query: 'test', limit: -1 });
    expect(result.success).toBe(false);
  });

  it('should accept limit at max', () => {
    const result = searchQuerySchema.safeParse({ query: 'test', limit: 100 });
    expect(result.success).toBe(true);
  });
});

describe('validate', () => {
  it('should return the same schema', () => {
    const schema = idSchema;
    const result = validate(schema);
    expect(result).toBe(schema);
  });
});
