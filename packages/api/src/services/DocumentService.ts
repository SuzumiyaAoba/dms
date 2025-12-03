/**
 * Document service
 *
 * Business logic for document management operations.
 * This service coordinates between storage adapter and document repository.
 *
 * @module services/DocumentService
 */

import { Effect } from 'effect';
import type { Document, UpdateDocument } from '@/types/document';
import type { AppError } from '@/utils/effect-errors';
import { logger } from '@/utils/logger';
import { DocumentRepositoryService, StorageAdapter } from './context';

/**
 * Document upload data
 */
export interface UploadDocumentData {
  file: File;
  title?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Document service implementation
 *
 * Handles document operations including file upload, metadata management,
 * and coordination between storage and repository layers.
 */
export namespace DocumentService {
  /**
   * List documents with pagination
   */
  export function listDocuments(
    page: number,
    limit: number,
  ): Effect.Effect<{ items: Document[]; total: number }, AppError, DocumentRepositoryService> {
    return Effect.gen(function* () {
      const repository = yield* DocumentRepositoryService;
      return yield* repository.findAll(page, limit);
    });
  }

  /**
   * Get a document by ID
   */
  export function getDocumentById(
    id: string,
  ): Effect.Effect<Document, AppError, DocumentRepositoryService> {
    return Effect.gen(function* () {
      const repository = yield* DocumentRepositoryService;
      return yield* repository.findById(id);
    });
  }

  /**
   * Upload a new document
   *
   * This method:
   * 1. Uploads the file to storage
   * 2. Creates document metadata in repository
   * 3. Returns the created document
   */
  export function uploadDocument(
    data: UploadDocumentData,
  ): Effect.Effect<Document, AppError, StorageAdapter | DocumentRepositoryService> {
    return Effect.gen(function* () {
      const storageAdapter = yield* StorageAdapter;
      const repository = yield* DocumentRepositoryService;
      const { file, title, description, tags, metadata } = data;

      // Upload file to storage
      const buffer = Buffer.from(yield* Effect.promise(() => file.arrayBuffer()));
      const uploadResult = yield* storageAdapter.upload({
        fileName: file.name,
        mimeType: file.type,
        buffer,
        metadata: metadata
          ? Object.fromEntries(Object.entries(metadata).map(([k, v]) => [k, String(v)]))
          : undefined,
      });

      logger.info(
        {
          fileName: file.name,
          size: uploadResult.size,
          url: uploadResult.url,
        },
        'File uploaded successfully',
      );

      // Create document metadata
      const document = yield* repository.create({
        title: title || file.name,
        description,
        tags,
        metadata,
        fileUrl: uploadResult.url,
        fileName: file.name,
        fileSize: uploadResult.size,
        mimeType: file.type,
      });

      logger.info({ documentId: document.id }, 'Document created successfully');

      return document;
    });
  }

  /**
   * Update document metadata
   */
  export function updateDocument(
    id: string,
    data: UpdateDocument,
  ): Effect.Effect<Document, AppError, DocumentRepositoryService> {
    return Effect.gen(function* () {
      const repository = yield* DocumentRepositoryService;
      const updated = yield* repository.update(id, data);
      logger.info({ documentId: id }, 'Document updated successfully');
      return updated;
    });
  }

  /**
   * Delete a document (soft delete)
   */
  export function deleteDocument(
    id: string,
  ): Effect.Effect<void, AppError, DocumentRepositoryService> {
    return Effect.gen(function* () {
      const repository = yield* DocumentRepositoryService;
      yield* repository.delete(id);
      logger.info({ documentId: id }, 'Document deleted successfully');
    });
  }

  /**
   * Get download URL for a document file
   */
  export function getDownloadUrl(
    document: Document,
    expiresIn?: number,
  ): Effect.Effect<string, AppError, StorageAdapter> {
    return Effect.gen(function* () {
      const storageAdapter = yield* StorageAdapter;
      return yield* storageAdapter.getDownloadUrl(document.fileUrl, expiresIn);
    });
  }
}
