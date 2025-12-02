/**
 * Document service
 *
 * Business logic for document management operations.
 * This service coordinates between storage adapter and document repository.
 *
 * @module services/DocumentService
 */

import type { IStorageAdapter } from '@dms/core';
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '../config/container';
import type { IDocumentRepository } from '../repositories/DocumentRepository';
import type { Document, UpdateDocument } from '../types/document';
import { logger } from '../utils/logger';

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
  async listDocuments(page: number, limit: number): Promise<{ items: Document[]; total: number }> {
    return this.documentRepository.findAll(page, limit);
  }

  /**
   * Get a document by ID
   */
  async getDocumentById(id: string): Promise<Document | null> {
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
  async uploadDocument(data: UploadDocumentData): Promise<Document> {
    const { file, title, description, tags, metadata } = data;

    // Upload file to storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await this.storageAdapter.upload({
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
    const document = await this.documentRepository.create({
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
  }

  /**
   * Update document metadata
   */
  async updateDocument(id: string, data: UpdateDocument): Promise<Document | null> {
    const updated = await this.documentRepository.update(id, data);

    if (updated) {
      logger.info({ documentId: id }, 'Document updated successfully');
    }

    return updated;
  }

  /**
   * Delete a document (soft delete)
   */
  async deleteDocument(id: string): Promise<boolean> {
    const deleted = await this.documentRepository.delete(id);

    if (deleted) {
      logger.info({ documentId: id }, 'Document deleted successfully');
    }

    return deleted;
  }

  /**
   * Get download URL for a document file
   */
  async getDownloadUrl(document: Document, expiresIn?: number): Promise<string> {
    return this.storageAdapter.getDownloadUrl(document.fileUrl, expiresIn);
  }
}
