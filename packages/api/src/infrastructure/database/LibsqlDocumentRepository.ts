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
 * LibSQL document repository implementation
 *
 * Provides persistent storage for document metadata using LibSQL.
 */
export class LibsqlDocumentRepository implements IDocumentRepository {
  constructor(private readonly client: Client) {}

  /**
   * Convert database row to Document type
   */
  private rowToDocument(row: DocumentRow): Document {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      tags: JSON.parse(row.tags) as string[],
      metadata: JSON.parse(row.metadata) as Record<string, unknown>,
      fileUrl: row.file_url,
      fileName: row.file_name,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      extractedText: row.extracted_text,
      embeddingId: row.embedding_id,
      status: row.status as 'processing' | 'ready' | 'error',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    };
  }

  findAll(
    page: number,
    limit: number,
  ): Effect.Effect<{ items: Document[]; total: number }, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        // Get total count
        const countResult = await this.client.execute({
          sql: 'SELECT COUNT(*) as count FROM documents WHERE deleted_at IS NULL',
          args: [],
        });
        const total = (countResult.rows[0].count as number) || 0;

        // Get paginated results
        const offset = (page - 1) * limit;
        const result = await this.client.execute({
          sql: `
            SELECT * FROM documents
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
          `,
          args: [limit, offset],
        });

        const items = result.rows.map((row) => this.rowToDocument(row as unknown as DocumentRow));

        return { items, total };
      },
      catch: (error) =>
        new RepositoryError({
          message: 'Failed to find all documents',
          cause: error instanceof Error ? error : new Error(String(error)),
        }),
    });
  }

  findById(id: string): Effect.Effect<Document, NotFoundError | RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.client.execute({
          sql: 'SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL',
          args: [id],
        });

        if (result.rows.length === 0) {
          throw new NotFoundError({ resource: 'Document', identifier: id });
        }

        return this.rowToDocument(result.rows[0] as unknown as DocumentRow);
      },
      catch: (error) => {
        if (error instanceof NotFoundError) {
          return error;
        }
        return new RepositoryError({
          message: 'Failed to find document by ID',
          cause: error instanceof Error ? error : new Error(String(error)),
        });
      },
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
      const existing = yield* this.findById(id);

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
