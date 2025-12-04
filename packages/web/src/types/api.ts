/**
 * API response types
 *
 * Type definitions for API responses from the backend
 */

/**
 * Document type - matches backend Document type
 */
export interface Document {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  extractedText: string | null;
  embeddingId: string | null;
  status: 'processing' | 'ready' | 'error';
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * Document creation input
 */
export interface CreateDocumentInput {
  title: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  file: File;
}

/**
 * Document update input
 */
export interface UpdateDocumentInput {
  title?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  status?: 'processing' | 'ready' | 'error';
}

/**
 * Pagination metadata
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * API response metadata
 */
export interface ResponseMeta {
  timestamp: string;
  requestId?: string;
}

/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
}

/**
 * Paginated API response
 */
export interface PaginatedApiResponse<T> {
  success: true;
  data: {
    items: T[];
    pagination: Pagination;
  };
  meta: ResponseMeta;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: ResponseMeta;
}

/**
 * API response type (success or error)
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
