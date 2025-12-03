/**
 * Effect Layer configuration
 *
 * This module composes all application layers for dependency injection.
 *
 * @module config/layers
 */

import * as path from 'node:path';
import { Layer } from 'effect';
import { env } from '@/config/env';
import { makeFileSystemStorageLayer } from '@/infrastructure/adapters/FileSystemStorageAdapter';
import { LibsqlDocumentRepositoryLayer } from '@/infrastructure/database/LibsqlDocumentRepository';
import { LibsqlClientLayer } from '@/infrastructure/database/libsql';
import { InMemoryDocumentRepositoryLayer } from '@/repositories/DocumentRepository';
import type { DocumentRepositoryService, StorageAdapter } from '@/services/context';
import { logger } from '@/utils/logger';

/**
 * Create the main application layer
 *
 * Combines all service layers into a single application layer.
 * This layer provides all dependencies needed by the application.
 */
export function makeAppLayer() {
  // Get configuration from environment
  const storageType = process.env.STORAGE_TYPE || 'filesystem';
  const storagePath = process.env.STORAGE_PATH || path.join(process.cwd(), 'storage', 'documents');
  const databaseType = env.DATABASE_TYPE;

  // Create storage layer based on configuration
  let storageLayer: ReturnType<typeof makeFileSystemStorageLayer>;
  switch (storageType) {
    case 'filesystem':
      storageLayer = makeFileSystemStorageLayer(storagePath);
      break;

    case 's3':
      // TODO: Implement S3 storage adapter
      throw new Error('S3 storage adapter not yet implemented');

    default:
      throw new Error(`Unknown storage type: ${storageType}`);
  }

  // Create repository layer based on configuration
  let repositoryLayer: typeof InMemoryDocumentRepositoryLayer;
  switch (databaseType) {
    case 'memory':
      repositoryLayer = InMemoryDocumentRepositoryLayer;
      logger.info('Using in-memory document repository');
      break;

    case 'libsql':
      repositoryLayer = LibsqlDocumentRepositoryLayer.pipe(
        Layer.provide(LibsqlClientLayer),
      ) as typeof InMemoryDocumentRepositoryLayer;
      logger.info('Using LibSQL document repository');
      break;

    default:
      throw new Error(`Unknown database type: ${databaseType}`);
  }

  // Compose all layers
  const appLayer = Layer.mergeAll(storageLayer, repositoryLayer);

  logger.info('Application layer initialized successfully');

  return appLayer;
}
