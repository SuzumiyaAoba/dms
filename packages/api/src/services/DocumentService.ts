/**
 * Document service
 *
 * Business logic for document management operations.
 * This service coordinates between storage adapter and document repository.
 *
 * @module services/DocumentService
 */

import type { IStorageAdapter } from '@dms/core';
import { Effect } from 'effect';
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@/config/container';
import type { IDocumentRepository } from '@/repositories/DocumentRepository';
import type { Document, UpdateDocument } from '@/types/document';
import type { AppError } from '@/utils/effect-errors';
import { logger } from '@/utils/logger';

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
@injectable()
export class DocumentService {
  constructor(
    @inject(TOKENS.IStorageAdapter) private readonly storageAdapter: IStorageAdapter,
    @inject(TOKENS.IDocumentRepository) private readonly documentRepository: IDocumentRepository,
  ) {}

  /**
   * List documents with pagination
   */
  listDocuments(
    page: number,
    limit: number,
  ): Effect.Effect<{ items: Document[]; total: number }, AppError> {
    return this.documentRepository.findAll(page, limit);
  }

  /**
   * Get a document by ID
   */
  getDocumentById(id: string): Effect.Effect<Document, AppError> {
    return this.documentRepository.findById(id);
  }

  /**
   * Upload a new document
   *
   * This method:
   * 1. Uploads the file to storage
   * 2. Creates document metadata in repository
   * 3. Returns the created document
   */
  uploadDocument(data: UploadDocumentData): Effect.Effect<Document, AppError> {
    return Effect.gen(this, function* () {
      const { file, title, description, tags, metadata } = data;

      // Upload file to storage
      const buffer = Buffer.from(yield* Effect.promise(() => file.arrayBuffer()));
      const uploadResult = yield* this.storageAdapter.upload({
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
      const document = yield* this.documentRepository.create({
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
  updateDocument(id: string, data: UpdateDocument): Effect.Effect<Document, AppError> {
    return Effect.gen(this, function* () {
      const updated = yield* this.documentRepository.update(id, data);
      logger.info({ documentId: id }, 'Document updated successfully');
      return updated;
    });
  }

  /**
   * Delete a document (soft delete)
   */
  deleteDocument(id: string): Effect.Effect<void, AppError> {
    return Effect.gen(this, function* () {
      yield* this.documentRepository.delete(id);
      logger.info({ documentId: id }, 'Document deleted successfully');
    });
  }

  /**
   * Get download URL for a document file
   */
  getDownloadUrl(document: Document, expiresIn?: number): Effect.Effect<string, AppError> {
    return this.storageAdapter.getDownloadUrl(document.fileUrl, expiresIn);
  }
}
