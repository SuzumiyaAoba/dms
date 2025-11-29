/**
 * Hono application setup module
 *
 * This module creates and configures the main Hono application instance,
 * including all global middleware and route registration. The app instance
 * is exported for use by the server entry point.
 *
 * @module app
 */

import { Hono } from 'hono';
import { logger as honoLogger } from 'hono/logger';
import { API_PREFIX } from './config/constants';
import { cors } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import { loggerMiddleware } from './middleware/logger';
import { notFound } from './middleware/notFound';
import routes from './routes';

/**
 * Main Hono application instance
 *
 * Configured with the following middleware stack (in order):
 * 1. **Hono built-in logger** - Console logging for development
 * 2. **Custom logger middleware** - Structured logging with request IDs
 * 3. **CORS middleware** - Cross-origin resource sharing configuration
 * 4. **Error handler** - Centralized error handling and response formatting
 *
 * Routes are mounted as follows:
 * - Health check routes at `/health` (no API prefix)
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
const app = new Hono();

// Global middleware
app.use('*', honoLogger());
app.use('*', loggerMiddleware);
app.use('*', cors);
app.use('*', errorHandler);

// Routes
app.route('/', routes);

// API versioned routes (to be added)
// app.route(API_PREFIX, apiRoutes);

// 404 handler
app.notFound(notFound);

export default app;
