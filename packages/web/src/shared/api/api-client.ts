/**
 * API Client for DMS Backend
 *
 * Provides type-safe methods for interacting with the DMS API
 * Following "Parse, don't validate" principle with Zod
 */

import { z } from 'zod';
import type {
  CreateDocumentInput,
  Document,
  PaginatedApiResponse,
  UpdateDocumentInput,
} from '@/shared/model/api';
import {
  ApiErrorResponseSchema,
  ApiSuccessResponseSchema,
  DocumentSchema,
  HealthResponseSchema,
  PaginatedApiResponseSchema,
} from '@/shared/model/api-schemas';

/**
 * API Client Error
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Get API base URL from environment
 */
function getApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    // Default to localhost with /api/v1 prefix
    if (typeof window !== 'undefined') {
      // Client-side: use current origin with API prefix
      return `${window.location.origin}/api/v1`;
    }
    // Server-side build: use default localhost with API prefix
    return 'http://localhost:3000/api/v1';
  }
  return baseUrl;
}

/**
 * Handle API response and throw error if failed
 * Following "Parse, don't validate" - uses Zod to parse response
 */
async function handleResponse<T>(
  response: Response,
  schema: ReturnType<typeof ApiSuccessResponseSchema>,
): Promise<T> {
  const json = await response.json();

  // Try to parse as error response first
  const errorResult = ApiErrorResponseSchema.safeParse(json);
  if (errorResult.success) {
    const errorData = errorResult.data;
    throw new ApiClientError(
      errorData.error.message,
      errorData.error.code,
      errorData.error.details,
    );
  }

  // Parse as success response with provided schema
  const parsed = schema.parse(json);
  return parsed.data as T;
}

/**
 * API Client class
 */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getApiBaseUrl();
  }

  /**
   * List documents with pagination
   * Following "Parse, don't validate" - uses Zod to parse response
   */
  async listDocuments(
    page = 1,
    limit = 20,
  ): Promise<{
    items: Document[];
    pagination: PaginatedApiResponse<Document>['data']['pagination'];
  }> {
    const url = new URL(`${this.baseUrl}/documents`);
    url.searchParams.set('page', page.toString());
    url.searchParams.set('limit', limit.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const json = await response.json();

    // Debug log
    console.log('API Response:', json);
    console.log('Response type:', typeof json);
    console.log('Response success:', json?.success, typeof json?.success);

    // Try to parse as error response first
    const errorResult = ApiErrorResponseSchema.safeParse(json);
    console.log('Error parse result:', errorResult);
    if (errorResult.success) {
      const errorData = errorResult.data;
      console.error('API Error:', errorData.error);
      throw new ApiClientError(
        errorData.error.message,
        errorData.error.code,
        errorData.error.details,
      );
    }

    // Parse as paginated response with Zod
    const parseResult = PaginatedApiResponseSchema(DocumentSchema).safeParse(json);
    if (!parseResult.success) {
      console.error('Schema validation failed:', parseResult.error);
      throw new Error(`Failed to parse API response: ${parseResult.error.message}`);
    }

    return parseResult.data.data;
  }

  /**
   * Get a document by ID
   * Following "Parse, don't validate" - uses Zod to parse response
   */
  async getDocument(id: string): Promise<Document> {
    const response = await fetch(`${this.baseUrl}/documents/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse<Document>(response, ApiSuccessResponseSchema(DocumentSchema));
  }

  /**
   * Create a new document with file upload
   * Following "Parse, don't validate" - uses Zod to parse response
   */
  async createDocument(input: CreateDocumentInput): Promise<Document> {
    const formData = new FormData();

    // Add file
    formData.append('file', input.file);

    // Add metadata as JSON
    const metadata = {
      title: input.title,
      ...(input.description && { description: input.description }),
      ...(input.tags && { tags: input.tags }),
      ...(input.metadata && { metadata: input.metadata }),
    };

    formData.append('metadata', JSON.stringify(metadata));

    const response = await fetch(`${this.baseUrl}/documents`, {
      method: 'POST',
      body: formData,
    });

    return handleResponse<Document>(response, ApiSuccessResponseSchema(DocumentSchema));
  }

  /**
   * Update a document
   * Following "Parse, don't validate" - uses Zod to parse response
   */
  async updateDocument(id: string, input: UpdateDocumentInput): Promise<Document> {
    const response = await fetch(`${this.baseUrl}/documents/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    return handleResponse<Document>(response, ApiSuccessResponseSchema(DocumentSchema));
  }

  /**
   * Delete a document
   * Following "Parse, don't validate" - uses Zod to parse error response
   */
  async deleteDocument(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/documents/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const json = await response.json();
      // Parse error response with Zod
      const errorData = ApiErrorResponseSchema.parse(json);
      throw new ApiClientError(
        errorData.error.message,
        errorData.error.code,
        errorData.error.details,
      );
    }
  }

  /**
   * Get document file content
   * Following "Parse, don't validate" - uses Zod to parse response
   */
  async getDocumentContent(id: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/documents/${id}/content`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const json = await response.json();

    // Try to parse as error response first
    const errorResult = ApiErrorResponseSchema.safeParse(json);
    if (errorResult.success) {
      const errorData = errorResult.data;
      throw new ApiClientError(
        errorData.error.message,
        errorData.error.code,
        errorData.error.details,
      );
    }

    // Parse as success response
    const ContentSchema = z.object({ content: z.string() });
    const parseResult = ApiSuccessResponseSchema(ContentSchema).safeParse(json);
    if (!parseResult.success) {
      throw new Error(`Failed to parse API response: ${parseResult.error.message}`);
    }

    return parseResult.data.data.content;
  }

  /**
   * Sync documents with storage
   * Following "Parse, don't validate" - uses Zod to parse response
   */
  async syncDocuments(): Promise<{ added: number; removed: number; message: string }> {
    const response = await fetch(`${this.baseUrl}/documents/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const json = await response.json();

    // Try to parse as error response first
    const errorResult = ApiErrorResponseSchema.safeParse(json);
    if (errorResult.success) {
      const errorData = errorResult.data;
      throw new ApiClientError(
        errorData.error.message,
        errorData.error.code,
        errorData.error.details,
      );
    }

    // Parse as success response
    const SyncResponseSchema = z.object({
      added: z.number(),
      removed: z.number(),
      message: z.string(),
    });
    const parseResult = ApiSuccessResponseSchema(SyncResponseSchema).safeParse(json);
    if (!parseResult.success) {
      throw new Error(`Failed to parse API response: ${parseResult.error.message}`);
    }

    return parseResult.data.data;
  }

  /**
   * Get health status
   * Following "Parse, don't validate" - uses Zod to parse response
   *
   * Note: Health endpoint is mounted at /health (without API prefix)
   */
  async getHealth(): Promise<{ status: string; timestamp: string }> {
    // Health endpoint is at /health, not /api/v1/health
    // Remove /api/v1 suffix from baseUrl if present
    const healthUrl = this.baseUrl.replace(/\/api\/v1$/, '/health');

    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const json = await response.json();
    // Parse health response with Zod
    return HealthResponseSchema.parse(json);
  }
}

/**
 * Default API client instance
 */
export const apiClient = new ApiClient();
