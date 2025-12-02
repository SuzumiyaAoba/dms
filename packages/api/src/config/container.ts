/**
 * Dependency Injection container configuration
 *
 * This module configures the DI container using tsyringe.
 * All services, repositories, and adapters are registered here.
 *
 * @module config/container
 */

import 'reflect-metadata';
import * as path from 'node:path';
import type { IStorageAdapter } from '@dms/core';
import { container } from 'tsyringe';
import { FileSystemStorageAdapter } from '@/infrastructure/adapters/FileSystemStorageAdapter';
import type { IDocumentRepository } from '@/repositories/DocumentRepository';
import { InMemoryDocumentRepository } from '@/repositories/DocumentRepository';
import { logger } from '@/utils/logger';

/**
 * Tokens for dependency injection
 *
 * These tokens are used to identify dependencies in the container.
 */
export const TOKENS = {
  IStorageAdapter: Symbol.for('IStorageAdapter'),
  IDocumentRepository: Symbol.for('IDocumentRepository'),
} as const;

/**
 * Initialize and configure the DI container
 *
 * Registers all services, repositories, and adapters based on environment configuration.
 * This should be called once at application startup.
 */
export async function setupContainer(): Promise<void> {
  // Configure storage adapter based on environment
  const storageType = process.env.STORAGE_TYPE || 'filesystem';
  const storagePath = process.env.STORAGE_PATH || path.join(process.cwd(), 'storage', 'documents');

  let storageAdapter: IStorageAdapter;

  switch (storageType) {
    case 'filesystem': {
      const adapter = new FileSystemStorageAdapter(storagePath);
      await adapter.initialize();
      storageAdapter = adapter;
      logger.info({ type: 'filesystem', path: storagePath }, 'Storage adapter initialized');
      break;
    }

    case 's3':
      // TODO: Implement S3 storage adapter
      throw new Error('S3 storage adapter not yet implemented');

    default:
      throw new Error(`Unknown storage type: ${storageType}`);
  }

  // Register storage adapter
  container.registerInstance<IStorageAdapter>(TOKENS.IStorageAdapter, storageAdapter);

  // Register document repository (in-memory for now, will be PostgreSQL later)
  const documentRepository = new InMemoryDocumentRepository();
  container.registerInstance<IDocumentRepository>(TOKENS.IDocumentRepository, documentRepository);

  logger.info('DI container configured successfully');
}

/**
 * Get the DI container instance
 *
 * Use this to resolve dependencies manually when needed.
 * Prefer constructor injection over manual resolution.
 */
export function getContainer() {
  return container;
}
