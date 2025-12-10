/**
 * Hono application setup module
 *
 * This module creates and configures the main Hono application instance with OpenAPI support,
 * including all global middleware, route registration, and API documentation.
 * The app instance is exported for use by the server entry point.
 *
 * @module app
 */

import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { Effect, Layer } from 'effect';
import { logger as honoLogger } from 'hono/logger';
import { env } from '@/config/env';
import { makeAppLayer } from '@/config/layers';
import { cors } from '@/middleware/cors';
import { errorHandler } from '@/middleware/errorHandler';
import { loggerMiddleware } from '@/middleware/logger';
import { notFound } from '@/middleware/notFound';
import routes from '@/routes';
import { DocumentService } from '@/services/DocumentService';
import '@/types/hono';
import { logger } from '@/utils/logger';

/**
 * Main Hono application instance with OpenAPI support
 *
 * Configured with the following middleware stack (in order):
 * 1. **Hono built-in logger** - Console logging for development
 * 2. **Custom logger middleware** - Structured logging with request IDs
 * 3. **CORS middleware** - Cross-origin resource sharing configuration
 * 4. **Error handler** - Centralized error handling and response formatting
 *
 * Routes are mounted as follows:
 * - Health check routes at `/health` (no API prefix)
 * - API documentation at `/reference` (Scalar UI)
 * - OpenAPI spec at `/doc` (JSON format)
 * - API routes will be mounted at `/api/v1` (TODO)
 * - 404 handler for undefined routes
 *
 * @example
 * Middleware execution order for a request:
 * ```
 * Request
 *   ↓
 * honoLogger (console log)
 *   ↓
 * loggerMiddleware (structured log + request ID)
 *   ↓
 * cors (CORS headers)
 *   ↓
 * errorHandler (wraps remaining stack)
 *   ↓
 * Route handler
 *   ↓
 * Response (or 404 if no match)
 * ```
 */
const app = new OpenAPIHono();

// Initialize application layer
const appLayer = makeAppLayer();
// Build runtime once (async) and keep scope open for the lifetime of the process
let appRuntime: Awaited<ReturnType<typeof Layer.toRuntime>> | null = null;
const appRuntimePromise = Effect.runPromise(Layer.toRuntime(appLayer).pipe(Effect.scoped));

const getAppRuntime = async () => {
  if (!appRuntime) {
    appRuntime = await appRuntimePromise;
  }
  return appRuntime;
};

// Middleware to inject app layer into context
app.use('*', async (c, next) => {
  c.set('appLayer', appLayer);
  try {
    const runtime = await getAppRuntime();
    c.set('appRuntime', runtime);
  } catch (error) {
    logger.error({ error }, 'Failed to initialize app runtime');
    throw error;
  }
  await next();
});

// Global middleware
app.use('*', honoLogger());
app.use('*', loggerMiddleware);
app.use('*', cors);
app.use('*', errorHandler);

// Routes
app.route('/', routes);

// API versioned routes (to be added)
// app.route(API_PREFIX, apiRoutes);

// OpenAPI documentation
app.doc('/doc', {
  openapi: '3.1.0',
  info: {
    version: '1.0.0',
    title: 'DMS API',
    description: 'Document Management System API with LLM-powered search capabilities',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
});

// Scalar API Reference UI
app.get(
  '/reference',
  apiReference({
    theme: 'purple',
    url: '/doc',
  }),
);

// 404 handler
app.notFound(notFound);

// Initialize by importing existing files (opt-in)
if (env.IMPORT_EXISTING_FILES_ON_STARTUP) {
  (async () => {
    try {
      const importEffect = DocumentService.importExistingFiles();
      const result = await Effect.runPromise(importEffect.pipe(Effect.provide(appLayer)));
      logger.info({ importedCount: result }, 'Existing files imported');
    } catch (error) {
      logger.error({ error }, 'Failed to import existing files');
    }
  })();
} else {
  logger.info('Skipping import of existing files on startup');
}

export default app;
