/**
 * LibSQL Document Repository Implementation
 *
 * Implements IDocumentRepository using LibSQL for document metadata storage.
 *
 * @module infrastructure/database/LibsqlDocumentRepository
 */

import type { Client } from '@libsql/client';
import { Context, Effect, Layer } from 'effect';
import { uuidv7 } from 'uuidv7';
import type { IDocumentRepository } from '@/repositories/DocumentRepository';
import { DocumentRepositoryService } from '@/services/context';
import type { CreateDocument, Document, UpdateDocument } from '@/types/document';
import { NotFoundError, RepositoryError } from '@/utils/effect-errors';

/**
 * Document row type from database
 */
interface DocumentRow {
  id: string;
  title: string;
  description: string | null;
  tags: string; // JSON string
  metadata: string; // JSON string
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  extracted_text: string | null;
  embedding_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Type guard to validate database row matches DocumentRow shape
 */
function isDocumentRow(row: unknown): row is DocumentRow {
  if (typeof row !== 'object' || row === null) {
    return false;
  }

  const r = row as Record<string, unknown>;

  return (
    typeof r.id === 'string' &&
    typeof r.title === 'string' &&
    (r.description === null || typeof r.description === 'string') &&
    typeof r.tags === 'string' &&
    typeof r.metadata === 'string' &&
    typeof r.file_url === 'string' &&
    typeof r.file_name === 'string' &&
    typeof r.file_size === 'number' &&
    typeof r.mime_type === 'string' &&
    (r.extracted_text === null || typeof r.extracted_text === 'string') &&
    (r.embedding_id === null || typeof r.embedding_id === 'string') &&
    typeof r.status === 'string' &&
    typeof r.created_at === 'string' &&
    typeof r.updated_at === 'string' &&
    (r.deleted_at === null || typeof r.deleted_at === 'string')
  );
}

/**
 * Validate document status
 */
function isValidStatus(status: string): status is 'processing' | 'ready' | 'error' {
  return status === 'processing' || status === 'ready' || status === 'error';
}

/**
 * LibSQL document repository implementation
 *
 * Provides persistent storage for document metadata using LibSQL.
 */
export class LibsqlDocumentRepository implements IDocumentRepository {
  constructor(private readonly client: Client) {}

  /**
   * Convert database row to Document type with validation
   */
  private rowToDocument(row: DocumentRow): Effect.Effect<Document, RepositoryError> {
    return Effect.gen(function* () {
      // Parse and validate tags
      const tags = yield* Effect.try({
        try: () => JSON.parse(row.tags),
        catch: (error) =>
          new RepositoryError({
            message: 'Failed to parse tags JSON',
            cause: error instanceof Error ? error : new Error(String(error)),
          }),
      });

      if (!Array.isArray(tags) || !tags.every((tag) => typeof tag === 'string')) {
        return yield* Effect.fail(
          new RepositoryError({
            message: 'Invalid tags format: expected array of strings',
          }),
        );
      }

      // Parse and validate metadata
      const metadata = yield* Effect.try({
        try: () => JSON.parse(row.metadata),
        catch: (error) =>
          new RepositoryError({
            message: 'Failed to parse metadata JSON',
            cause: error instanceof Error ? error : new Error(String(error)),
          }),
      });

      if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
        return yield* Effect.fail(
          new RepositoryError({
            message: 'Invalid metadata format: expected object',
          }),
        );
      }

      // Validate status
      if (!isValidStatus(row.status)) {
        return yield* Effect.fail(
          new RepositoryError({
            message: `Invalid status value: ${row.status}`,
          }),
        );
      }

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        tags: tags as string[],
        metadata: metadata as Record<string, unknown>,
        fileUrl: row.file_url,
        fileName: row.file_name,
        fileSize: row.file_size,
        mimeType: row.mime_type,
        extractedText: row.extracted_text,
        embeddingId: row.embedding_id,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
      };
    });
  }

  findAll(
    page: number,
    limit: number,
  ): Effect.Effect<{ items: Document[]; total: number }, RepositoryError> {
    return Effect.gen(this, function* () {
      // Get total count
      const countResult = yield* Effect.tryPromise({
        try: () =>
          this.client.execute({
            sql: 'SELECT COUNT(*) as count FROM documents WHERE deleted_at IS NULL',
            args: [],
          }),
        catch: (error) =>
          new RepositoryError({
            message: 'Failed to count documents',
            cause: error instanceof Error ? error : new Error(String(error)),
          }),
      });

      const countRow = countResult.rows[0];
      if (!countRow || typeof countRow.count !== 'number') {
        return yield* Effect.fail(
          new RepositoryError({
            message: 'Invalid count result from database',
          }),
        );
      }
      const total = countRow.count;

      // Get paginated results
      const offset = (page - 1) * limit;
      const result = yield* Effect.tryPromise({
        try: () =>
          this.client.execute({
            sql: `
            SELECT * FROM documents
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
          `,
            args: [limit, offset],
          }),
        catch: (error) =>
          new RepositoryError({
            message: 'Failed to fetch documents',
            cause: error instanceof Error ? error : new Error(String(error)),
          }),
      });

      // Validate and convert rows
      const items: Document[] = [];
      for (const row of result.rows) {
        if (!isDocumentRow(row)) {
          return yield* Effect.fail(
            new RepositoryError({
              message: 'Invalid row format from database',
            }),
          );
        }
        const document = yield* this.rowToDocument(row);
        items.push(document);
      }

      return { items, total };
    });
  }

  findById(id: string): Effect.Effect<Document, NotFoundError | RepositoryError> {
    return Effect.gen(this, function* () {
      const result = yield* Effect.tryPromise({
        try: () =>
          this.client.execute({
            sql: 'SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL',
            args: [id],
          }),
        catch: (error) =>
          new RepositoryError({
            message: 'Failed to query document by ID',
            cause: error instanceof Error ? error : new Error(String(error)),
          }),
      });

      if (result.rows.length === 0) {
        return yield* Effect.fail(new NotFoundError({ resource: 'Document', identifier: id }));
      }

      const row = result.rows[0];
      if (!isDocumentRow(row)) {
        return yield* Effect.fail(
          new RepositoryError({
            message: 'Invalid row format from database',
          }),
        );
      }

      return yield* this.rowToDocument(row);
    });
  }

  create(
    data: CreateDocument & {
      fileUrl: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
    },
  ): Effect.Effect<Document, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const now = new Date().toISOString();
        const id = uuidv7();

        await this.client.execute({
          sql: `
            INSERT INTO documents (
              id, title, description, tags, metadata,
              file_url, file_name, file_size, mime_type,
              extracted_text, embedding_id, status,
              created_at, updated_at, deleted_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            id,
            data.title,
            data.description ?? null,
            JSON.stringify(data.tags ?? []),
            JSON.stringify(data.metadata ?? {}),
            data.fileUrl,
            data.fileName,
            data.fileSize,
            data.mimeType,
            null, // extracted_text
            null, // embedding_id
            'processing',
            now,
            now,
            null, // deleted_at
          ],
        });

        const document: Document = {
          id,
          title: data.title,
          description: data.description ?? null,
          tags: data.tags ?? [],
          metadata: data.metadata ?? {},
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          extractedText: null,
          embeddingId: null,
          status: 'processing',
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };

        return document;
      },
      catch: (error) =>
        new RepositoryError({
          message: 'Failed to create document',
          cause: error instanceof Error ? error : new Error(String(error)),
        }),
    });
  }

  update(
    id: string,
    data: UpdateDocument,
  ): Effect.Effect<Document, NotFoundError | RepositoryError> {
    return Effect.gen(this, function* () {
      // First, check if document exists
      const _existing = yield* this.findById(id);

      const now = new Date().toISOString();
      const updates: string[] = [];
      const args: unknown[] = [];

      if (data.title !== undefined) {
        updates.push('title = ?');
        args.push(data.title);
      }
      if (data.description !== undefined) {
        updates.push('description = ?');
        args.push(data.description);
      }
      if (data.tags !== undefined) {
        updates.push('tags = ?');
        args.push(JSON.stringify(data.tags));
      }
      if (data.metadata !== undefined) {
        updates.push('metadata = ?');
        args.push(JSON.stringify(data.metadata));
      }
      if (data.status !== undefined) {
        updates.push('status = ?');
        args.push(data.status);
      }
      if (data.extractedText !== undefined) {
        updates.push('extracted_text = ?');
        args.push(data.extractedText);
      }

      updates.push('updated_at = ?');
      args.push(now);
      args.push(id); // For WHERE clause

      yield* Effect.tryPromise({
        try: async () => {
          await this.client.execute({
            sql: `UPDATE documents SET ${updates.join(', ')} WHERE id = ?`,
            args: args as (string | number | null)[],
          });
        },
        catch: (error) =>
          new RepositoryError({
            message: 'Failed to update document',
            cause: error instanceof Error ? error : new Error(String(error)),
          }),
      });

      // Return updated document
      return yield* this.findById(id);
    });
  }

  delete(id: string): Effect.Effect<void, NotFoundError | RepositoryError> {
    return Effect.gen(this, function* () {
      // First, check if document exists
      yield* this.findById(id);

      const now = new Date().toISOString();

      yield* Effect.tryPromise({
        try: async () => {
          await this.client.execute({
            sql: 'UPDATE documents SET deleted_at = ? WHERE id = ?',
            args: [now, id],
          });
        },
        catch: (error) =>
          new RepositoryError({
            message: 'Failed to delete document',
            cause: error instanceof Error ? error : new Error(String(error)),
          }),
      });
    });
  }

  clear(): Effect.Effect<void, never> {
    const self = this;
    return Effect.gen(function* () {
      yield* Effect.tryPromise({
        try: async () => {
          await self.client.execute('DELETE FROM documents');
        },
        catch: () => {
          // Swallow errors for clear operation
        },
      }).pipe(Effect.orDie);
    });
  }
}

/**
 * Context tag for LibSQL Client
 */
export class LibsqlClient extends Context.Tag('LibsqlClient')<LibsqlClient, Client>() {}

/**
 * Layer for LibsqlDocumentRepository
 *
 * Requires LibsqlClient to be provided
 */
export const LibsqlDocumentRepositoryLayer = Layer.effect(
  DocumentRepositoryService,
  Effect.gen(function* () {
    const client = yield* LibsqlClient;
    return new LibsqlDocumentRepository(client);
  }),
);
