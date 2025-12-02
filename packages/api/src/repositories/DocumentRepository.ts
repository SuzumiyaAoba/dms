/**
 * Document repository interface and in-memory implementation
 *
 * This provides a temporary in-memory storage for document metadata.
 * In the future, this will be replaced by a PostgreSQL implementation using Drizzle ORM.
 *
 * @module repositories/DocumentRepository
 */

import { Effect } from 'effect';
import { uuidv7 } from 'uuidv7';
import type { CreateDocument, Document, UpdateDocument } from '../types/document';
import { NotFoundError, type RepositoryError } from '../utils/effect-errors';

/**
 * Document repository interface
 *
 * Defines the contract for document metadata storage.
 * The interface abstracts the underlying storage mechanism.
 */
export interface IDocumentRepository {
  /**
   * Find all documents with pagination
   */
  findAll(
    page: number,
    limit: number,
  ): Effect.Effect<{ items: Document[]; total: number }, RepositoryError>;

  /**
   * Find a document by ID
   */
  findById(id: string): Effect.Effect<Document, NotFoundError | RepositoryError>;

  /**
   * Create a new document
   */
  create(
    data: CreateDocument & {
      fileUrl: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
    },
  ): Effect.Effect<Document, RepositoryError>;

  /**
   * Update a document
   */
  update(
    id: string,
    data: UpdateDocument,
  ): Effect.Effect<Document, NotFoundError | RepositoryError>;

  /**
   * Delete a document (soft delete)
   */
  delete(id: string): Effect.Effect<void, NotFoundError | RepositoryError>;

  /**
   * Clear all documents (for testing)
   */
  clear(): Effect.Effect<void, never>;
}

/**
 * In-memory document repository implementation
 *
 * Temporary implementation for development. Will be replaced by PostgreSQL.
 */
export class InMemoryDocumentRepository implements IDocumentRepository {
  private documents = new Map<string, Document>();

  findAll(
    page: number,
    limit: number,
  ): Effect.Effect<{ items: Document[]; total: number }, RepositoryError> {
    return Effect.sync(() => {
      const allDocs = Array.from(this.documents.values())
        .filter((doc) => !doc.deletedAt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const start = (page - 1) * limit;
      const end = start + limit;

      return {
        items: allDocs.slice(start, end),
        total: allDocs.length,
      };
    });
  }

  findById(id: string): Effect.Effect<Document, NotFoundError | RepositoryError> {
    return Effect.gen(this, function* () {
      const doc = this.documents.get(id);
      if (!doc || doc.deletedAt) {
        return yield* Effect.fail(new NotFoundError({ resource: 'Document', identifier: id }));
      }
      return doc;
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
    return Effect.sync(() => {
      const now = new Date().toISOString();
      const document: Document = {
        id: uuidv7(),
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

      this.documents.set(document.id, document);
      return document;
    });
  }

  update(
    id: string,
    data: UpdateDocument,
  ): Effect.Effect<Document, NotFoundError | RepositoryError> {
    return Effect.gen(this, function* () {
      const document = this.documents.get(id);
      if (!document || document.deletedAt) {
        return yield* Effect.fail(new NotFoundError({ resource: 'Document', identifier: id }));
      }

      const updated: Document = {
        ...document,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      this.documents.set(id, updated);
      return updated;
    });
  }

  delete(id: string): Effect.Effect<void, NotFoundError | RepositoryError> {
    return Effect.gen(this, function* () {
      const document = this.documents.get(id);
      if (!document || document.deletedAt) {
        return yield* Effect.fail(new NotFoundError({ resource: 'Document', identifier: id }));
      }

      document.deletedAt = new Date().toISOString();
      this.documents.set(id, document);
    });
  }

  clear(): Effect.Effect<void, never> {
    return Effect.sync(() => {
      this.documents.clear();
    });
  }
}
