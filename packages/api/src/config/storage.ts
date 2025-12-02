/**
 * Storage configuration and initialization
 *
 * @module config/storage
 */

import * as path from 'node:path';
import type { IStorageAdapter } from '@dms/core';
import { FileSystemStorageAdapter } from '../infrastructure/adapters/FileSystemStorageAdapter';
import type { IDocumentRepository } from '../repositories/DocumentRepository';
import { InMemoryDocumentRepository } from '../repositories/DocumentRepository';
import { logger } from '../utils/logger';

/**
 * Storage service container
 *
 * Holds instances of storage adapter and document repository.
 * In the future, this will support dependency injection.
 */
export class StorageService {
  private static instance: StorageService | null = null;

  private constructor(
    public readonly storageAdapter: IStorageAdapter,
    public readonly documentRepository: IDocumentRepository,
  ) {}

  /**
   * Get the singleton instance of StorageService
   */
  static getInstance(): StorageService {
    if (!StorageService.instance) {
      throw new Error('StorageService not initialized. Call initialize() first.');
    }
    return StorageService.instance;
  }

  /**
   * Initialize storage service
   *
   * Creates and configures storage adapter and document repository based on environment.
   */
  static async initialize(): Promise<void> {
    const storageType = process.env.STORAGE_TYPE || 'filesystem';
    const storagePath =
      process.env.STORAGE_PATH || path.join(process.cwd(), 'storage', 'documents');

    let storageAdapter: IStorageAdapter;

    switch (storageType) {
      case 'filesystem':
        storageAdapter = new FileSystemStorageAdapter(storagePath);
        await (storageAdapter as FileSystemStorageAdapter).initialize();
        logger.info({ type: 'filesystem', path: storagePath }, 'Storage adapter initialized');
        break;

      case 's3':
        // TODO: Implement S3 storage adapter
        throw new Error('S3 storage adapter not yet implemented');

      default:
        throw new Error(`Unknown storage type: ${storageType}`);
    }

    // Create document repository (currently in-memory, will be PostgreSQL in the future)
    const documentRepository = new InMemoryDocumentRepository();
    logger.info({ type: 'in-memory' }, 'Document repository initialized');

    StorageService.instance = new StorageService(storageAdapter, documentRepository);
  }
}
