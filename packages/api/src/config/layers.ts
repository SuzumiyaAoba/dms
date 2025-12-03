/**
 * Effect Layer configuration
 *
 * This module composes all application layers for dependency injection.
 *
 * @module config/layers
 */

import * as path from 'node:path';
import { Layer } from 'effect';
import { makeFileSystemStorageLayer } from '@/infrastructure/adapters/FileSystemStorageAdapter';
import { InMemoryDocumentRepositoryLayer } from '@/repositories/DocumentRepository';
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

  // Compose all layers
  const appLayer = Layer.mergeAll(storageLayer, InMemoryDocumentRepositoryLayer);

  logger.info('Application layer initialized successfully');

  return appLayer;
}
