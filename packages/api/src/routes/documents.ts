/**
 * Document routes module
 *
 * This module provides OpenAPI-documented endpoints for document management operations
 * including file upload, metadata management, and retrieval.
 *
 * @module routes/documents
 */

import * as os from 'node:os';
import * as path from 'node:path';
// @ts-nocheck - OpenAPI type inference issues with response types
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { Effect } from 'effect';
import { HTTP_STATUS } from '@/config/constants';
import { DocumentService } from '@/services/DocumentService';
import { DocumentSchema, UpdateDocumentSchema } from '@/types/document';
import { runEffectHandler } from '@/utils/effect-helpers';
import { paginatedResponse, successResponse } from '@/utils/response';
import { idSchema, paginationSchema } from '@/utils/validation';

const documents = new OpenAPIHono();

/**
 * GET /documents - List all documents with pagination
 */
const listDocumentsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Documents'],
  summary: 'List all documents',
  description:
    'Retrieve a paginated list of all documents, sorted by creation date (newest first).',
  request: {
    query: paginationSchema,
  },
  responses: {
    200: {
      description: 'List of documents',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().openapi({ example: true }),
            data: z.object({
              items: z.array(DocumentSchema),
              pagination: z.object({
                page: z.number().openapi({ example: 1 }),
                limit: z.number().openapi({ example: 20 }),
                total: z.number().openapi({ example: 50 }),
                totalPages: z.number().openapi({ example: 3 }),
              }),
            }),
            meta: z.object({
              timestamp: z.string().datetime(),
              requestId: z.string().optional(),
            }),
          }),
        },
      },
    },
  },
});

documents.openapi(listDocumentsRoute, async (c) => {
  const { page, limit } = c.req.valid('query');

  return runEffectHandler(c, DocumentService.listDocuments(page, limit), ({ items, total }) =>
    paginatedResponse(c, items, page, limit, total),
  );
});

/**
 * GET /documents/:id - Get a specific document by ID
 */
const getDocumentRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Documents'],
  summary: 'Get a document by ID',
  description: 'Retrieve a specific document by its unique identifier.',
  request: {
    params: idSchema,
  },
  responses: {
    200: {
      description: 'Document found',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().openapi({ example: true }),
            data: DocumentSchema,
            meta: z.object({
              timestamp: z.string().datetime(),
              requestId: z.string().optional(),
            }),
          }),
        },
      },
    },
    404: {
      description: 'Document not found',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().openapi({ example: false }),
            error: z.object({
              code: z.string().openapi({ example: 'NOT_FOUND' }),
              message: z.string().openapi({ example: 'Document not found' }),
            }),
            meta: z.object({
              timestamp: z.string().datetime(),
              requestId: z.string().optional(),
            }),
          }),
        },
      },
    },
  },
});

documents.openapi(getDocumentRoute, async (c) => {
  const { id } = c.req.valid('param');

  return runEffectHandler(c, DocumentService.getDocumentById(id), (document) =>
    successResponse(c, document),
  );
});

/**
 * POST /documents - Create a new document with file upload
 */
const createDocumentRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Documents'],
  summary: 'Upload a new document',
  description:
    'Upload a new document file with metadata. The file will be stored and text extraction will be queued.',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            file: z.any().openapi({ type: 'string', format: 'binary' }),
            title: z.string().min(1).max(1000).optional().openapi({ example: 'My Document.pdf' }),
            description: z.string().optional().openapi({ example: 'Document description' }),
            tags: z
              .string()
              .optional()
              .openapi({ example: 'tag1,tag2,tag3', description: 'Comma-separated tags' }),
            metadata: z
              .string()
              .optional()
              .openapi({ example: '{"author":"John Doe"}', description: 'JSON metadata' }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Document uploaded successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().openapi({ example: true }),
            data: DocumentSchema,
            meta: z.object({
              timestamp: z.string().datetime(),
              requestId: z.string().optional(),
            }),
          }),
        },
      },
    },
    400: {
      description: 'Invalid input or no file provided',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().openapi({ example: false }),
            error: z.object({
              code: z.string().openapi({ example: 'VALIDATION_ERROR' }),
              message: z.string().openapi({ example: 'No file provided' }),
              details: z.array(z.unknown()).optional(),
            }),
            meta: z.object({
              timestamp: z.string().datetime(),
              requestId: z.string().optional(),
            }),
          }),
        },
      },
    },
  },
});

documents.openapi(createDocumentRoute, async (c) => {
  const body = await c.req.parseBody();
  const file = body.file;

  if (!file || !(file instanceof File)) {
    throw new Error('No file provided');
  }

  // Parse form data
  const title = (body.title as string) || undefined;
  const description = body.description as string | undefined;
  const tagsString = body.tags as string | undefined;
  const metadataString = body.metadata as string | undefined;

  const tags = tagsString ? tagsString.split(',').map((t) => t.trim()) : undefined;
  const metadata = metadataString ? JSON.parse(metadataString) : undefined;

  return runEffectHandler(
    c,
    DocumentService.uploadDocument({
      file,
      title,
      description,
      tags,
      metadata,
    }),
    (document) => successResponse(c, document, HTTP_STATUS.CREATED),
  );
});

/**
 * PATCH /documents/:id - Update document metadata
 */
const updateDocumentRoute = createRoute({
  method: 'patch',
  path: '/{id}',
  tags: ['Documents'],
  summary: 'Update document metadata',
  description: 'Update document metadata (title, description, tags, etc.). File cannot be changed.',
  request: {
    params: idSchema,
    body: {
      content: {
        'application/json': {
          schema: UpdateDocumentSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Document updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().openapi({ example: true }),
            data: DocumentSchema,
            meta: z.object({
              timestamp: z.string().datetime(),
              requestId: z.string().optional(),
            }),
          }),
        },
      },
    },
    404: {
      description: 'Document not found',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().openapi({ example: false }),
            error: z.object({
              code: z.string().openapi({ example: 'NOT_FOUND' }),
              message: z.string().openapi({ example: 'Document not found' }),
            }),
            meta: z.object({
              timestamp: z.string().datetime(),
              requestId: z.string().optional(),
            }),
          }),
        },
      },
    },
  },
});

documents.openapi(updateDocumentRoute, async (c) => {
  const { id } = c.req.valid('param');
  const data = c.req.valid('json');

  return runEffectHandler(c, DocumentService.updateDocument(id, data), (updated) =>
    successResponse(c, updated),
  );
});

/**
 * DELETE /documents/:id - Delete a document
 */
const deleteDocumentRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Documents'],
  summary: 'Delete a document',
  description:
    'Soft delete a document by its unique identifier. The file will be marked as deleted but not physically removed.',
  request: {
    params: idSchema,
  },
  responses: {
    200: {
      description: 'Document deleted successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().openapi({ example: true }),
            data: z.object({
              message: z.string().openapi({ example: 'Document deleted successfully' }),
            }),
            meta: z.object({
              timestamp: z.string().datetime(),
              requestId: z.string().optional(),
            }),
          }),
        },
      },
    },
    404: {
      description: 'Document not found',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().openapi({ example: false }),
            error: z.object({
              code: z.string().openapi({ example: 'NOT_FOUND' }),
              message: z.string().openapi({ example: 'Document not found' }),
            }),
            meta: z.object({
              timestamp: z.string().datetime(),
              requestId: z.string().optional(),
            }),
          }),
        },
      },
    },
  },
});

documents.openapi(deleteDocumentRoute, async (c) => {
  const { id } = c.req.valid('param');

  return runEffectHandler(c, DocumentService.deleteDocument(id), () =>
    successResponse(c, { message: 'Document deleted successfully' }),
  );
});

/**
 * GET /documents/:id/content - Get document file content
 */
const getDocumentContentRoute = createRoute({
  method: 'get',
  path: '/{id}/content',
  tags: ['Documents'],
  summary: 'Get document file content',
  description: 'Retrieve the file content of a specific document as plain text.',
  request: {
    params: idSchema,
  },
  responses: {
    200: {
      description: 'Document content retrieved',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().openapi({ example: true }),
            data: z.object({
              content: z.string(),
            }),
            meta: z.object({
              timestamp: z.string().datetime(),
              requestId: z.string().optional(),
            }),
          }),
        },
      },
    },
    404: {
      description: 'Document not found',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().openapi({ example: false }),
            error: z.object({
              code: z.string().openapi({ example: 'NOT_FOUND' }),
              message: z.string().openapi({ example: 'Document not found' }),
            }),
            meta: z.object({
              timestamp: z.string().datetime(),
              requestId: z.string().optional(),
            }),
          }),
        },
      },
    },
  },
});

documents.openapi(getDocumentContentRoute, async (c) => {
  const { id } = c.req.valid('param');

  return runEffectHandler(
    c,
    Effect.gen(function* () {
      const document = yield* DocumentService.getDocumentById(id);
      const content = yield* DocumentService.getFileContent(document.fileUrl);
      return { content };
    }),
    (data) => successResponse(c, data),
  );
});

/**
 * POST /documents/sync - Sync documents with storage
 */
const syncDocumentsRoute = createRoute({
  method: 'post',
  path: '/sync',
  tags: ['Documents'],
  summary: 'Sync documents with storage',
  description:
    'Synchronize document metadata with actual files in storage. Adds new files and removes documents for deleted files.',
  request: {
    body: {
      required: false,
      content: {
        'application/json': {
          schema: z
            .object({
              directories: z
                .array(z.string().min(1))
                .max(50)
                .optional()
                .openapi({
                  description:
                    'Absolute or ~-prefixed directories to scan. Falls back to default when omitted.',
                  example: ['/Users/example/zettelkasten', '~/second/notes'],
                }),
            })
            .optional(),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Sync completed successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().openapi({ example: true }),
            data: z.object({
              added: z.number().openapi({ example: 5, description: 'Number of documents added' }),
              removed: z
                .number()
                .openapi({ example: 2, description: 'Number of documents removed' }),
              message: z.string().openapi({ example: 'Sync completed successfully' }),
              directories: z
                .array(z.string())
                .openapi({ example: ['/Users/example/zettelkasten', '/Users/example/notes'] }),
            }),
            meta: z.object({
              timestamp: z.string().datetime(),
              requestId: z.string().optional(),
            }),
          }),
        },
      },
    },
  },
});

documents.openapi(syncDocumentsRoute, async (c) => {
  const body = c.req.valid('json') as { directories?: string[] } | undefined;

  const normalizeDirectories = (dirs?: string[]) => {
    if (!dirs || dirs.length === 0) return [];
    return Array.from(
      new Set(
        dirs
          .map((dir) => dir.trim())
          .filter(Boolean)
          .map((dir) => {
            if (dir === '~') return os.homedir();
            if (dir.startsWith('~/')) return path.join(os.homedir(), dir.slice(2));
            return path.resolve(dir);
          }),
      ),
    );
  };

  const directories = normalizeDirectories(body?.directories);
  let scanDirectories = directories;

  if (scanDirectories.length === 0) {
    let storagePath = process.env.STORAGE_PATH || path.join(process.cwd(), 'storage', 'documents');
    if (storagePath.startsWith('~/')) {
      storagePath = path.join(os.homedir(), storagePath.slice(2));
    } else if (storagePath === '~') {
      storagePath = os.homedir();
    } else {
      storagePath = path.resolve(storagePath);
    }
    scanDirectories = [storagePath];
  }

  return runEffectHandler(c, DocumentService.syncDocuments(scanDirectories), ({ added, removed }) =>
    successResponse(c, {
      added,
      removed,
      directories: scanDirectories,
      message: 'Sync completed successfully',
    }),
  );
});

export default documents;
