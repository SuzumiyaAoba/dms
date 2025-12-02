/**
 * Document routes module
 *
 * This module provides OpenAPI-documented endpoints for document management operations
 * including CRUD operations (Create, Read, Update, Delete).
 *
 * @module routes/documents
 */

// @ts-nocheck - OpenAPI type inference issues with response types
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { HTTP_STATUS } from '../config/constants';
import {
  createDocument,
  deleteDocument,
  getDocumentById,
  getDocuments,
  updateDocument,
} from '../storage/documentStorage';
import { CreateDocumentSchema, DocumentSchema, UpdateDocumentSchema } from '../types/document';
import { NotFoundError } from '../utils/errors';
import { paginatedResponse, successResponse } from '../utils/response';
import { idSchema, paginationSchema } from '../utils/validation';

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
  const { items, total } = getDocuments(page, limit);

  return paginatedResponse(c, items, page, limit, total);
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
  const document = getDocumentById(id);

  if (!document) {
    throw new NotFoundError('Document', id);
  }

  return successResponse(c, document);
});

/**
 * POST /documents - Create a new document
 */
const createDocumentRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Documents'],
  summary: 'Create a new document',
  description: 'Create a new document with the provided title and content.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateDocumentSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Document created successfully',
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
      description: 'Invalid input',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().openapi({ example: false }),
            error: z.object({
              code: z.string().openapi({ example: 'VALIDATION_ERROR' }),
              message: z.string().openapi({ example: 'Validation failed' }),
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
  const data = c.req.valid('json');
  const document = createDocument(data);

  return successResponse(c, document, HTTP_STATUS.CREATED);
});

/**
 * PATCH /documents/:id - Update a document
 */
const updateDocumentRoute = createRoute({
  method: 'patch',
  path: '/{id}',
  tags: ['Documents'],
  summary: 'Update a document',
  description: 'Update an existing document with new title and/or content.',
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

  const updated = updateDocument(id, data);
  if (!updated) {
    throw new NotFoundError('Document', id);
  }

  return successResponse(c, updated);
});

/**
 * DELETE /documents/:id - Delete a document
 */
const deleteDocumentRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Documents'],
  summary: 'Delete a document',
  description: 'Delete a document by its unique identifier.',
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

  const deleted = deleteDocument(id);
  if (!deleted) {
    throw new NotFoundError('Document', id);
  }

  return successResponse(c, { message: 'Document deleted successfully' });
});

export default documents;
