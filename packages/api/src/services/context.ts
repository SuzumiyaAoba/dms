/**
 * Effect Context definitions for dependency injection
 *
 * This module defines Context tags for all services and dependencies
 * used throughout the application. These tags are used with Effect's
 * Layer system for type-safe dependency injection.
 *
 * @module services/context
 */

import type { IStorageAdapter } from '@dms/core';
import { Context } from 'effect';
import type { IDocumentRepository } from '@/repositories/DocumentRepository';

/**
 * Context tag for IStorageAdapter
 *
 * Used to inject storage adapter implementations (FileSystem, S3, etc.)
 */
export class StorageAdapter extends Context.Tag('StorageAdapter')<
  StorageAdapter,
  IStorageAdapter
>() {}

/**
 * Context tag for IDocumentRepository
 *
 * Used to inject document repository implementations
 */
export class DocumentRepositoryService extends Context.Tag('DocumentRepository')<
  DocumentRepositoryService,
  IDocumentRepository
>() {}
