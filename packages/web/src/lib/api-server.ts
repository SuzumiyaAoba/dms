/**
 * Server-side API client for DMS Backend
 *
 * This module provides server-side only API calls
 */

import type { Document, PaginatedApiResponse } from '@/types/api';

/**
 * Get API base URL for server-side
 * Uses internal Docker network or localhost
 */
function getServerApiUrl(): string {
  // Use environment variable or fallback to localhost
  return process.env.API_URL || 'http://localhost:3000/api/v1';
}

/**
 * List documents with pagination (server-side)
 */
export async function listDocuments(
  page = 1,
  limit = 20,
): Promise<{
  items: Document[];
  pagination: PaginatedApiResponse<Document>['data']['pagination'];
}> {
  const url = new URL(`${getServerApiUrl()}/documents`);
  url.searchParams.set('page', page.toString());
  url.searchParams.set('limit', limit.toString());

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    // Disable caching for server components
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch documents: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as PaginatedApiResponse<Document>;

  if (!data.success) {
    throw new Error('Failed to fetch documents');
  }

  return data.data;
}

/**
 * Get a document by ID (server-side)
 */
export async function getDocument(id: string): Promise<Document> {
  const url = `${getServerApiUrl()}/documents/${id}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    // Disable caching for server components
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { success: boolean; data: Document };

  if (!data.success) {
    throw new Error('Failed to fetch document');
  }

  return data.data;
}
