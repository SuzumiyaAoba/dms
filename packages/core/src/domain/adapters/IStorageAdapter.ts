/**
 * Storage adapter interface for document file storage
 *
 * This interface abstracts the storage of actual document files (PDF, Word, Excel, etc.)
 * independent of the metadata storage. Implementations can use file system, S3, or other
 * object storage services.
 *
 * @module domain/adapters/IStorageAdapter
 */

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
   * @returns Promise resolving to upload result with URL and size
   * @throws Error if upload fails
   */
  upload(options: UploadOptions): Promise<UploadResult>;

  /**
   * Download a file from storage
   *
   * @param url - Storage URL or path returned from upload()
   * @returns Promise resolving to file content as Buffer
   * @throws Error if file not found or download fails
   */
  download(url: string): Promise<Buffer>;

  /**
   * Delete a file from storage
   *
   * @param url - Storage URL or path returned from upload()
   * @returns Promise resolving when deletion completes
   * @throws Error if deletion fails
   */
  delete(url: string): Promise<void>;

  /**
   * Generate a temporary download URL
   *
   * For file system storage, this might return a URL to a local endpoint.
   * For S3, this generates a pre-signed URL.
   *
   * @param url - Storage URL or path
   * @param expiresIn - URL expiration time in seconds (default: 3600)
   * @returns Promise resolving to download URL
   * @throws Error if URL generation fails
   */
  getDownloadUrl(url: string, expiresIn?: number): Promise<string>;

  /**
   * Check if a file exists in storage
   *
   * @param url - Storage URL or path
   * @returns Promise resolving to true if file exists, false otherwise
   */
  exists(url: string): Promise<boolean>;
}
