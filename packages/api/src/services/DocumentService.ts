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

  /**
   * Get file content from disk
   */
  export function getFileContent(fileUrl: string): Effect.Effect<string, AppError, StorageAdapter> {
    return Effect.gen(function* () {
      const storageAdapter = yield* StorageAdapter;

      // Check if storage adapter supports reading file content
      if (!('readFile' in storageAdapter)) {
        logger.warn('Storage adapter does not support reading file content');
        return '';
      }

      const content = yield* Effect.promise(() =>
        (storageAdapter as unknown as { readFile: (path: string) => Promise<string> }).readFile(
          fileUrl,
        ),
      );

      return content;
    });
  }

  /**
   * Import existing files from storage
   *
   * Scans the storage directory and creates document entries for files
   * that are not yet in the repository.
   */
  export function importExistingFiles(): Effect.Effect<
    number,
    AppError,
    StorageAdapter | DocumentRepositoryService
  > {
    return Effect.gen(function* () {
      const storageAdapter = yield* StorageAdapter;
      const repository = yield* DocumentRepositoryService;

      // Check if storage adapter supports scanning
      if (!('scanExistingFiles' in storageAdapter)) {
        logger.warn('Storage adapter does not support scanning existing files');
        return 0;
      }

      const files = yield* Effect.promise(() =>
        (
          storageAdapter as unknown as {
            scanExistingFiles: () => Promise<
              Array<{
                fileName: string;
                filePath: string;
                fileSize: number;
                mimeType: string;
                modifiedAt: Date;
              }>
            >;
          }
        ).scanExistingFiles(),
      );

      let importedCount = 0;

      for (const file of files) {
        // Check if document already exists with this file path
        const existingDocs = yield* repository.findAll(1, 1000);
        const exists = existingDocs.items.some((doc) => doc.fileUrl === file.filePath);

        if (!exists) {
          yield* repository.create({
            title: file.fileName,
            description: undefined,
            tags: [],
            metadata: {},
            fileUrl: file.filePath,
            fileName: file.fileName,
            fileSize: file.fileSize,
            mimeType: file.mimeType,
          });
          importedCount++;
        }
      }

      logger.info({ importedCount, totalFiles: files.length }, 'Imported existing files');
      return importedCount;
    });
  }

  /**
   * Sync documents with storage
   *
   * This method:
   * 1. Scans all files in storage
   * 2. Adds new files to repository
   * 3. Removes documents whose files no longer exist in storage
   *
   * @returns Object containing counts of added and removed documents
   */
  export function syncDocuments(
    directories?: string[],
  ): Effect.Effect<
    { added: number; removed: number },
    AppError,
    StorageAdapter | DocumentRepositoryService
  > {
    return Effect.gen(function* () {
      const storageAdapter = yield* StorageAdapter;
      const repository = yield* DocumentRepositoryService;

      // Check if storage adapter supports scanning
      if (!('scanExistingFiles' in storageAdapter)) {
        logger.warn('Storage adapter does not support scanning existing files');
        return { added: 0, removed: 0 };
      }

      // Get all files from storage
      const files = yield* Effect.promise(() =>
        (
          storageAdapter as unknown as {
            scanExistingFiles: (dirs?: string[]) => Promise<
              Array<{
                fileName: string;
                filePath: string;
                fileSize: number;
                mimeType: string;
                modifiedAt: Date;
              }>
            >;
          }
        ).scanExistingFiles(directories),
      );

      // Get all documents from repository
      const allDocs = yield* repository.findAll(1, 10000);
      const existingDocs = allDocs.items;

      // Create a set of file paths for quick lookup
      const filePaths = new Set(files.map((f) => f.filePath));

      let addedCount = 0;
      let removedCount = 0;

      // Add new files to repository
      for (const file of files) {
        const exists = existingDocs.some((doc) => doc.fileUrl === file.filePath);

        if (!exists) {
          yield* repository.create({
            title: file.fileName,
            description: undefined,
            tags: [],
            metadata: {},
            fileUrl: file.filePath,
            fileName: file.fileName,
            fileSize: file.fileSize,
            mimeType: file.mimeType,
          });
          addedCount++;
        }
      }

      // Remove documents whose files no longer exist
      for (const doc of existingDocs) {
        if (!filePaths.has(doc.fileUrl)) {
          yield* repository.delete(doc.id);
          removedCount++;
        }
      }

      logger.info(
        { added: addedCount, removed: removedCount, totalFiles: files.length },
        'Synced documents with storage',
      );
      return { added: addedCount, removed: removedCount };
    });
  }
}
