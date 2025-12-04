/**
 * API Client for DMS Backend
 *
 * Provides type-safe methods for interacting with the DMS API
 */

import type {
  ApiErrorResponse,
  ApiResponse,
  ApiSuccessResponse,
  CreateDocumentInput,
  Document,
  PaginatedApiResponse,
  UpdateDocumentInput,
} from '@/types/api';

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
    // Default to relative URL in production, localhost in development
    if (typeof window !== 'undefined') {
      // Client-side: use current origin
      return `${window.location.origin}/api/v1`;
    }
    // Server-side build: use default localhost
    return 'http://localhost:3000/api/v1';
  }
  return baseUrl;
}

/**
 * Handle API response and throw error if failed
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as ApiResponse<T> | ApiErrorResponse;

  if (!data.success) {
    throw new ApiClientError(data.error.message, data.error.code, data.error.details);
  }

  return (data as ApiSuccessResponse<T>).data;
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

    const data = (await response.json()) as PaginatedApiResponse<Document> | ApiErrorResponse;

    if (!data.success) {
      throw new ApiClientError(data.error.message, data.error.code, data.error.details);
    }

    return data.data;
  }

  /**
   * Get a document by ID
   */
  async getDocument(id: string): Promise<Document> {
    const response = await fetch(`${this.baseUrl}/documents/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse<Document>(response);
  }

  /**
   * Create a new document with file upload
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

    return handleResponse<Document>(response);
  }

  /**
   * Update a document
   */
  async updateDocument(id: string, input: UpdateDocumentInput): Promise<Document> {
    const response = await fetch(`${this.baseUrl}/documents/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    return handleResponse<Document>(response);
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/documents/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = (await response.json()) as ApiErrorResponse;
      throw new ApiClientError(data.error.message, data.error.code, data.error.details);
    }
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${this.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return handleResponse<{ status: string; timestamp: string }>(response);
  }
}

/**
 * Default API client instance
 */
export const apiClient = new ApiClient();
