/**
 * API Client for DMS Backend
 *
 * Provides type-safe methods for interacting with the DMS API
 * Following "Parse, don't validate" principle with Zod
 */

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
    // Default to localhost without /api/v1 prefix
    // Note: API does not use versioning prefix yet
    if (typeof window !== 'undefined') {
      // Client-side: use current origin
      return window.location.origin;
    }
    // Server-side build: use default localhost
    return 'http://localhost:3000';
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

    // Parse as paginated response with Zod
    const parsed = PaginatedApiResponseSchema(DocumentSchema).parse(json);
    return parsed.data;
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
   * Get health status
   * Following "Parse, don't validate" - uses Zod to parse response
   */
  async getHealth(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${this.baseUrl}/health`, {
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
