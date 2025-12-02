/**
 * Document repository interface and in-memory implementation
 *
 * This provides a temporary in-memory storage for document metadata.
 * In the future, this will be replaced by a PostgreSQL implementation using Drizzle ORM.
 *
 * @module repositories/DocumentRepository
 */

import { uuidv7 } from 'uuidv7';
import type { CreateDocument, Document, UpdateDocument } from '../types/document';

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
  findAll(page: number, limit: number): Promise<{ items: Document[]; total: number }>;

  /**
   * Find a document by ID
   */
  findById(id: string): Promise<Document | null>;

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
  ): Promise<Document>;

  /**
   * Update a document
   */
  update(id: string, data: UpdateDocument): Promise<Document | null>;

  /**
   * Delete a document (soft delete)
   */
  delete(id: string): Promise<boolean>;

  /**
   * Clear all documents (for testing)
   */
  clear(): Promise<void>;
}

/**
 * In-memory document repository implementation
 *
 * Temporary implementation for development. Will be replaced by PostgreSQL.
 */
export class InMemoryDocumentRepository implements IDocumentRepository {
  private documents = new Map<string, Document>();

  async findAll(page: number, limit: number): Promise<{ items: Document[]; total: number }> {
    const allDocs = Array.from(this.documents.values())
      .filter((doc) => !doc.deletedAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      items: allDocs.slice(start, end),
      total: allDocs.length,
    };
  }

  async findById(id: string): Promise<Document | null> {
    const doc = this.documents.get(id);
    if (!doc || doc.deletedAt) {
      return null;
    }
    return doc;
  }

  async create(
    data: CreateDocument & {
      fileUrl: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
    },
  ): Promise<Document> {
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
  }

  async update(id: string, data: UpdateDocument): Promise<Document | null> {
    const document = this.documents.get(id);
    if (!document || document.deletedAt) {
      return null;
    }

    const updated: Document = {
      ...document,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.documents.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const document = this.documents.get(id);
    if (!document || document.deletedAt) {
      return false;
    }

    document.deletedAt = new Date().toISOString();
    this.documents.set(id, document);
    return true;
  }

  async clear(): Promise<void> {
    this.documents.clear();
  }
}
