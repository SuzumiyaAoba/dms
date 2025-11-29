import type { Context } from 'hono';
import { HTTP_STATUS } from '../config/constants';

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

export interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

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

  return c.json(response, status);
};

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

  return c.json(response, status);
};

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
