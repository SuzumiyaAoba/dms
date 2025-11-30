/**
 * Document type definitions
 *
 * @module types/document
 */

import { z } from 'zod';

/**
 * Document schema for validation
 */
export const DocumentSchema = z.object({
  id: z.string().uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
  title: z.string().min(1).max(200).openapi({ example: 'Project Documentation' }),
  content: z.string().openapi({ example: 'This is the content of the document...' }),
  createdAt: z.string().datetime().openapi({ example: '2025-11-30T00:00:00.000Z' }),
  updatedAt: z.string().datetime().openapi({ example: '2025-11-30T12:00:00.000Z' }),
});

/**
 * Document creation schema (without id and timestamps)
 */
export const CreateDocumentSchema = z.object({
  title: z.string().min(1).max(200).openapi({ example: 'New Document' }),
  content: z.string().openapi({ example: 'Document content goes here...' }),
});

/**
 * Document update schema (partial)
 */
export const UpdateDocumentSchema = z.object({
  title: z.string().min(1).max(200).optional().openapi({ example: 'Updated Title' }),
  content: z.string().optional().openapi({ example: 'Updated content...' }),
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
