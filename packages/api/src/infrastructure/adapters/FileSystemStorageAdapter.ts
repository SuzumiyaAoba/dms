/**
 * File system storage adapter implementation
 *
 * This adapter stores document files on the local file system.
 * Suitable for development and small-scale deployments.
 *
 * @module infrastructure/adapters/FileSystemStorageAdapter
 */

import { randomBytes } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { IStorageAdapter, UploadOptions, UploadResult } from '@dms/core';
import { Effect } from 'effect';
import { FileNotFoundError, StorageError } from '../../utils/effect-errors';
import { logger } from '../../utils/logger';

/**
 * File system storage adapter
 *
 * Stores files in a local directory with organized subdirectories.
 */
export class FileSystemStorageAdapter implements IStorageAdapter {
  /**
   * Create a new file system storage adapter
   *
   * @param basePath - Base directory for file storage (must exist)
   */
  constructor(private readonly basePath: string) {}

  /**
   * Initialize storage directory structure
   *
   * Creates the base directory if it doesn't exist.
   * Should be called before using the adapter.
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
      logger.info({ basePath: this.basePath }, 'File system storage initialized');
    } catch (error) {
      logger.error({ error, basePath: this.basePath }, 'Failed to initialize storage');
      throw error;
    }
  }

  upload(options: UploadOptions): Effect.Effect<UploadResult, StorageError> {
    return Effect.gen(this, function* () {
      try {
        // Generate unique file name with original extension
        const ext = path.extname(options.fileName);
        const uniqueName = `${this.generateUniqueId()}${ext}`;

        // Create subdirectory based on date for organization (YYYY/MM/DD)
        const now = new Date();
        const subDir = path.join(
          now.getFullYear().toString(),
          (now.getMonth() + 1).toString().padStart(2, '0'),
          now.getDate().toString().padStart(2, '0'),
        );

        const fullDir = path.join(this.basePath, subDir);
        yield* Effect.promise(() => fs.mkdir(fullDir, { recursive: true }));

        // Write file
        const fullPath = path.join(fullDir, uniqueName);
        yield* Effect.promise(() => fs.writeFile(fullPath, options.buffer));

        // Store metadata as JSON sidecar file if provided
        if (options.metadata && Object.keys(options.metadata).length > 0) {
          const metadataPath = `${fullPath}.meta.json`;
          yield* Effect.promise(() =>
            fs.writeFile(metadataPath, JSON.stringify(options.metadata, null, 2)),
          );
        }

        logger.info(
          {
            fileName: options.fileName,
            storedAs: uniqueName,
            size: options.buffer.length,
            path: fullPath,
          },
          'File uploaded to file system',
        );

        return {
          url: fullPath,
          size: options.buffer.length,
        };
      } catch (error) {
        logger.error({ error, fileName: options.fileName }, 'Failed to upload file');
        return yield* Effect.fail(
          new StorageError({
            message: `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            cause: error,
          }),
        );
      }
    });
  }

  download(url: string): Effect.Effect<Buffer, FileNotFoundError | StorageError> {
    return Effect.gen(this, function* () {
      try {
        const buffer = yield* Effect.promise(() => fs.readFile(url));
        logger.info({ path: url, size: buffer.length }, 'File downloaded from file system');
        return buffer;
      } catch (error) {
        logger.error({ error, path: url }, 'Failed to download file');
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
          return yield* Effect.fail(new FileNotFoundError({ url }));
        }
        return yield* Effect.fail(
          new StorageError({
            message: `Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            cause: error,
          }),
        );
      }
    });
  }

  delete(url: string): Effect.Effect<void, StorageError> {
    return Effect.gen(this, function* () {
      try {
        yield* Effect.promise(() => fs.unlink(url));

        // Also delete metadata file if it exists
        const metadataPath = `${url}.meta.json`;
        yield* Effect.promise(() => fs.unlink(metadataPath)).pipe(Effect.ignore);

        logger.info({ path: url }, 'File deleted from file system');
      } catch (error) {
        logger.error({ error, path: url }, 'Failed to delete file');
        return yield* Effect.fail(
          new StorageError({
            message: `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            cause: error,
          }),
        );
      }
    });
  }

  getDownloadUrl(url: string, _expiresIn = 3600): Effect.Effect<string, StorageError> {
    return Effect.sync(() => {
      // For file system storage, we return a relative URL that will be served by the API
      // The actual implementation would depend on how the API serves files
      const _fileName = path.basename(url);
      const relativePath = path.relative(this.basePath, url);

      // Return a URL path that can be served by the API
      // Example: /api/v1/files/2024/12/02/abc123.pdf
      return `/api/v1/files/${relativePath}`;
    });
  }

  exists(url: string): Effect.Effect<boolean, StorageError> {
    return Effect.gen(this, function* () {
      try {
        yield* Effect.promise(() => fs.access(url));
        return true;
      } catch {
        return false;
      }
    });
  }

  /**
   * Generate a unique ID for file naming
   *
   * @returns 16-character hex string
   */
  private generateUniqueId(): string {
    return randomBytes(8).toString('hex');
  }
}
