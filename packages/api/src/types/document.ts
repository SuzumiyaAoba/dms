/**
 * Document type definitions
 *
 * Documents consist of metadata (stored in database) and files (stored in file storage).
 *
 * @module types/document
 */

import { z } from 'zod';

/**
 * Document status enum
 */
export const DocumentStatus = z.enum(['processing', 'ready', 'error']).openapi({
  description: 'Document processing status',
  example: 'ready',
});

/**
 * Document metadata schema
 *
 * Custom metadata fields for documents (e.g., author, category, etc.)
 */
export const DocumentMetadataSchema = z.record(z.string(), z.unknown()).openapi({
  description: 'Custom metadata fields',
  example: { author: 'John Doe', department: 'Engineering' },
});

/**
 * Document schema for validation
 *
 * Represents document metadata with reference to the stored file.
 */
export const DocumentSchema = z.object({
  id: z.string().uuid().openapi({ example: '01933c3e-8f52-7000-a000-123456789abc' }),
  title: z.string().min(1).max(1000).openapi({ example: 'Q4 Financial Report.pdf' }),
  description: z.string().nullable().openapi({ example: 'Quarterly financial report for Q4 2024' }),
  tags: z
    .array(z.string())
    .default([])
    .openapi({ example: ['finance', 'report', '2024'] }),
  metadata: DocumentMetadataSchema.default({}).openapi({
    example: { author: 'Finance Team', year: '2024' },
  }),
  fileUrl: z.string().openapi({ example: '/storage/2024/12/02/abc123def456.pdf' }),
  fileName: z.string().openapi({ example: 'Q4_Financial_Report.pdf' }),
  fileSize: z.number().int().positive().openapi({ example: 2547896 }),
  mimeType: z
    .string()
    .openapi({ example: 'application/pdf', description: 'MIME type of the file' }),
  extractedText: z
    .string()
    .nullable()
    .openapi({ example: 'This is the extracted text from the document...' }),
  embeddingId: z
    .string()
    .uuid()
    .nullable()
    .openapi({ example: '01933c3e-8f52-7000-b000-987654321xyz' }),
  status: DocumentStatus,
  createdAt: z.string().datetime().openapi({ example: '2025-11-30T00:00:00.000Z' }),
  updatedAt: z.string().datetime().openapi({ example: '2025-11-30T12:00:00.000Z' }),
  deletedAt: z.string().datetime().nullable().openapi({ example: null }),
});

/**
 * Document creation schema (without id and timestamps)
 *
 * Used when uploading a new document with a file.
 */
export const CreateDocumentSchema = z.object({
  title: z.string().min(1).max(1000).openapi({ example: 'New Document.pdf' }),
  description: z.string().optional().openapi({ example: 'Document description' }),
  tags: z
    .array(z.string())
    .optional()
    .openapi({ example: ['tag1', 'tag2'] }),
  metadata: DocumentMetadataSchema.optional().openapi({ example: { author: 'John Doe' } }),
});

/**
 * Document update schema (partial)
 */
export const UpdateDocumentSchema = z.object({
  title: z.string().min(1).max(1000).optional().openapi({ example: 'Updated Title' }),
  description: z.string().optional().openapi({ example: 'Updated description' }),
  tags: z
    .array(z.string())
    .optional()
    .openapi({ example: ['updated-tag'] }),
  metadata: DocumentMetadataSchema.optional(),
  status: DocumentStatus.optional(),
  extractedText: z.string().optional(),
});

/**
 * Document type inferred from schema
 */
export type Document = z.infer<typeof DocumentSchema>;

/**
 * Document creation type
 */
export type CreateDocument = z.infer<typeof CreateDocumentSchema>;

/**
 * Document update type
 */
export type UpdateDocument = z.infer<typeof UpdateDocumentSchema>;

/**
 * Document status type
 */
export type DocumentStatusType = z.infer<typeof DocumentStatus>;
