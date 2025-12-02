/**
 * Storage interface for document operations
 *
 * This interface defines the contract that all storage implementations must follow.
 * It allows easy switching between different storage backends (memory, file, database).
 *
 * @module storage/interface
 */

import type { CreateDocument, Document, UpdateDocument } from '../types/document';

/**
 * Document storage interface
 *
 * Defines the contract for document storage implementations.
 * All storage backends must implement this interface.
 */
export interface DocumentStorage {
  /**
   * Get all documents sorted by creation date (newest first)
   */
  getAllDocuments(): Document[];

  /**
   * Get documents with pagination
   *
   * @param page - Page number (1-based)
   * @param limit - Number of documents per page
   * @returns Paginated documents and total count
   */
  getDocuments(page: number, limit: number): { items: Document[]; total: number };

  /**
   * Get a document by ID
   *
   * @param id - Document ID
   * @returns Document if found, undefined otherwise
   */
  getDocumentById(id: string): Document | undefined;

  /**
   * Create a new document
   *
   * @param data - Document data without ID and timestamps
   * @returns Created document with generated ID and timestamps
   */
  createDocument(data: CreateDocument): Document;

  /**
   * Update a document
   *
   * @param id - Document ID
   * @param data - Partial document data to update
   * @returns Updated document if found, undefined otherwise
   */
  updateDocument(id: string, data: UpdateDocument): Document | undefined;

  /**
   * Delete a document
   *
   * @param id - Document ID
   * @returns true if deleted, false if not found
   */
  deleteDocument(id: string): boolean;

  /**
   * Clear all documents (for testing)
   */
  clearAllDocuments(): void;

  /**
   * Seed initial documents (for development)
   */
  seedDocuments(): void;
}
