/**
 * In-memory document storage module
 *
 * Temporary storage implementation for documents.
 * This will be replaced with a proper database in the future.
 *
 * @module storage/documentStorage
 */

import type { CreateDocument, Document, UpdateDocument } from '../types/document';

/**
 * In-memory document store
 */
const documents = new Map<string, Document>();

/**
 * Generate a simple UUID v4
 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get all documents
 */
export function getAllDocuments(): Document[] {
  return Array.from(documents.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/**
 * Get documents with pagination
 */
export function getDocuments(page: number, limit: number): { items: Document[]; total: number } {
  const allDocs = getAllDocuments();
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    items: allDocs.slice(start, end),
    total: allDocs.length,
  };
}

/**
 * Get a document by ID
 */
export function getDocumentById(id: string): Document | undefined {
  return documents.get(id);
}

/**
 * Create a new document
 */
export function createDocument(data: CreateDocument): Document {
  const now = new Date().toISOString();
  const document: Document = {
    id: generateId(),
    title: data.title,
    content: data.content,
    createdAt: now,
    updatedAt: now,
  };

  documents.set(document.id, document);
  return document;
}

/**
 * Update a document
 */
export function updateDocument(id: string, data: UpdateDocument): Document | undefined {
  const document = documents.get(id);
  if (!document) {
    return undefined;
  }

  const updated: Document = {
    ...document,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  documents.set(id, updated);
  return updated;
}

/**
 * Delete a document
 */
export function deleteDocument(id: string): boolean {
  return documents.delete(id);
}

/**
 * Clear all documents (for testing)
 */
export function clearAllDocuments(): void {
  documents.clear();
}

/**
 * Seed initial documents (for development)
 */
export function seedDocuments(): void {
  const sampleDocuments: CreateDocument[] = [
    {
      title: 'Getting Started Guide',
      content:
        'Welcome to the Document Management System! This guide will help you get started with managing your documents.',
    },
    {
      title: 'API Documentation',
      content:
        'This document describes the API endpoints available in the DMS. Use the /api/v1 prefix for all API calls.',
    },
    {
      title: 'Project Roadmap',
      content:
        'Our project roadmap includes implementing LLM-powered search, document versioning, and collaboration features.',
    },
  ];

  for (const doc of sampleDocuments) {
    createDocument(doc);
  }
}
