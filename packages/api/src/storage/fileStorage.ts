/**
 * File-based document storage implementation
 *
 * Persists documents to disk as JSON, allowing data to survive restarts.
 *
 * @module storage/fileStorage
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { uuidv7 } from 'uuidv7';
import type { CreateDocument, Document, UpdateDocument } from '../types/document';
import type { DocumentStorage } from './interface';
import { SAMPLE_DOCUMENTS } from './sampleDocuments';

/**
 * File storage implementation
 *
 * Stores documents in a JSON file on disk.
 */
export class FileDocumentStorage implements DocumentStorage {
  private readonly filePath: string;
  private documents = new Map<string, Document>();

  constructor(filePath: string) {
    this.filePath = this.resolveFilePath(filePath);
    this.loadFromDisk();
  }

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
    this.persist();
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
    this.persist();
    return updated;
  }

  deleteDocument(id: string): boolean {
    const deleted = this.documents.delete(id);
    if (deleted) {
      this.persist();
    }

    return deleted;
  }

  clearAllDocuments(): void {
    this.documents.clear();
    this.persist();
  }

  seedDocuments(): void {
    if (this.documents.size > 0) {
      return;
    }

    for (const doc of SAMPLE_DOCUMENTS) {
      this.createDocument(doc);
    }
  }

  /**
   * Resolve the storage path to an absolute path.
   */
  private resolveFilePath(filePath: string): string {
    return isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath);
  }

  /**
   * Load documents from disk into memory.
   */
  private loadFromDisk(): void {
    try {
      const content = readFileSync(this.filePath, 'utf-8');
      if (!content.trim()) {
        this.persist();
        return;
      }

      const parsed = JSON.parse(content) as Document[];
      this.documents = new Map(parsed.map((doc) => [doc.id, doc]));
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        this.persist();
        return;
      }

      throw error;
    }
  }

  /**
   * Persist current state to disk.
   */
  private persist(): void {
    this.ensureDirectory();
    const serialized = JSON.stringify(Array.from(this.documents.values()), null, 2);
    writeFileSync(this.filePath, serialized, 'utf-8');
  }

  /**
   * Ensure the storage directory exists before writing.
   */
  private ensureDirectory(): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
  }
}
