/**
 * Document storage entry point
 *
 * Selects the configured storage backend (memory or file) and exposes
 * a simple function-based API for the rest of the application.
 *
 * @module storage/documentStorage
 */

import { env } from '../config/env';
import type { CreateDocument, Document, UpdateDocument } from '../types/document';
import { logger } from '../utils/logger';
import { FileDocumentStorage } from './fileStorage';
import type { DocumentStorage } from './interface';
import { MemoryDocumentStorage } from './memoryStorage';

/**
 * Storage instance selected based on configuration.
 */
const storage: DocumentStorage = createStorage();

/**
 * Create the configured storage backend.
 */
function createStorage(): DocumentStorage {
  if (env.STORAGE_DRIVER === 'file') {
    logger.info(
      { driver: env.STORAGE_DRIVER, filePath: env.FILE_STORAGE_PATH },
      'Using file-based document storage',
    );
    return new FileDocumentStorage(env.FILE_STORAGE_PATH);
  }

  logger.info({ driver: env.STORAGE_DRIVER }, 'Using in-memory document storage');
  return new MemoryDocumentStorage();
}

/**
 * Get all documents sorted by creation date
 */
export function getAllDocuments(): Document[] {
  return storage.getAllDocuments();
}

/**
 * Get documents with pagination
 */
export function getDocuments(page: number, limit: number): { items: Document[]; total: number } {
  return storage.getDocuments(page, limit);
}

/**
 * Get a document by ID
 */
export function getDocumentById(id: string): Document | undefined {
  return storage.getDocumentById(id);
}

/**
 * Create a new document
 */
export function createDocument(data: CreateDocument): Document {
  return storage.createDocument(data);
}

/**
 * Update a document
 */
export function updateDocument(id: string, data: UpdateDocument): Document | undefined {
  return storage.updateDocument(id, data);
}

/**
 * Delete a document
 */
export function deleteDocument(id: string): boolean {
  return storage.deleteDocument(id);
}

/**
 * Clear all documents (for testing)
 */
export function clearAllDocuments(): void {
  storage.clearAllDocuments();
}

/**
 * Seed initial documents (for development)
 */
export function seedDocuments(): void {
  storage.seedDocuments();
}

/**
 * Export the selected storage instance for advanced usage (e.g., tests).
 */
export { storage as documentStorage };
