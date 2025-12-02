/**
 * Storage adapter interface for document file storage
 *
 * This interface abstracts the storage of actual document files (PDF, Word, Excel, etc.)
 * independent of the metadata storage. Implementations can use file system, S3, or other
 * object storage services.
 *
 * @module domain/adapters/IStorageAdapter
 */

import { Data, type Effect } from 'effect';

/**
 * Storage error types
 */
export class StorageError extends Data.TaggedError('StorageError')<{
  message: string;
  cause?: unknown;
}> {}

export class FileNotFoundError extends Data.TaggedError('FileNotFoundError')<{
  url: string;
}> {
  get message(): string {
    return `File not found: ${this.url}`;
  }
}

/**
 * Options for uploading a file
 */
export interface UploadOptions {
  /**
   * Original file name
   */
  fileName: string;

  /**
   * MIME type of the file
   */
  mimeType: string;

  /**
   * File content as Buffer
   */
  buffer: Buffer;

  /**
   * Optional metadata to attach to the file
   */
  metadata?: Record<string, string>;
}

/**
 * Result of a successful upload
 */
export interface UploadResult {
  /**
   * Storage URL or path to the uploaded file
   * - For file system: absolute file path
   * - For S3: s3://bucket/key format or full URL
   */
  url: string;

  /**
   * File size in bytes
   */
  size: number;
}

/**
 * Storage adapter interface
 *
 * Implementations must handle actual file storage and retrieval.
 * The implementation should be stateless and thread-safe.
 */
export interface IStorageAdapter {
  /**
   * Upload a file to storage
   *
   * @param options - Upload options including file content and metadata
   * @returns Effect that succeeds with upload result or fails with StorageError
   */
  upload(options: UploadOptions): Effect.Effect<UploadResult, StorageError>;

  /**
   * Download a file from storage
   *
   * @param url - Storage URL or path returned from upload()
   * @returns Effect that succeeds with file content or fails with FileNotFoundError | StorageError
   */
  download(url: string): Effect.Effect<Buffer, FileNotFoundError | StorageError>;

  /**
   * Delete a file from storage
   *
   * @param url - Storage URL or path returned from upload()
   * @returns Effect that succeeds when deletion completes or fails with StorageError
   */
  delete(url: string): Effect.Effect<void, StorageError>;

  /**
   * Generate a temporary download URL
   *
   * For file system storage, this might return a URL to a local endpoint.
   * For S3, this generates a pre-signed URL.
   *
   * @param url - Storage URL or path
   * @param expiresIn - URL expiration time in seconds (default: 3600)
   * @returns Effect that succeeds with download URL or fails with StorageError
   */
  getDownloadUrl(url: string, expiresIn?: number): Effect.Effect<string, StorageError>;

  /**
   * Check if a file exists in storage
   *
   * @param url - Storage URL or path
   * @returns Effect that succeeds with boolean indicating existence
   */
  exists(url: string): Effect.Effect<boolean, StorageError>;
}
