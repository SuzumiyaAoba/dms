/**
 * In-memory document storage implementation
 *
 * This implementation stores documents in memory using a Map.
 * Data is lost when the server restarts.
 *
 * @module storage/memoryStorage
 */

import { uuidv7 } from 'uuidv7';
import type { CreateDocument, Document, UpdateDocument } from '../types/document';
import type { DocumentStorage } from './interface';
import { SAMPLE_DOCUMENTS } from './sampleDocuments';

/**
 * In-memory storage implementation
 *
 * Stores documents in a Map. Data is volatile and lost on restart.
 */
export class MemoryDocumentStorage implements DocumentStorage {
  private documents = new Map<string, Document>();

  getAllDocuments(): Document[] {
    return Array.from(this.documents.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  getDocuments(page: number, limit: number): { items: Document[]; total: number } {
    const allDocs = this.getAllDocuments();
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      items: allDocs.slice(start, end),
      total: allDocs.length,
    };
  }

  getDocumentById(id: string): Document | undefined {
    return this.documents.get(id);
  }

  createDocument(data: CreateDocument): Document {
    const now = new Date().toISOString();
    const document: Document = {
      id: uuidv7(),
      title: data.title,
      content: data.content,
      createdAt: now,
      updatedAt: now,
    };

    this.documents.set(document.id, document);
    return document;
  }

  updateDocument(id: string, data: UpdateDocument): Document | undefined {
    const document = this.documents.get(id);
    if (!document) {
      return undefined;
    }

    const updated: Document = {
      ...document,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.documents.set(id, updated);
    return updated;
  }

  deleteDocument(id: string): boolean {
    return this.documents.delete(id);
  }

  clearAllDocuments(): void {
    this.documents.clear();
  }

  seedDocuments(): void {
    // Avoid duplicating seed data if storage already contains documents
    if (this.documents.size > 0) {
      return;
    }

    for (const doc of SAMPLE_DOCUMENTS) {
      this.createDocument(doc);
    }
  }
}
