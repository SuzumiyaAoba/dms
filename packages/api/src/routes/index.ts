/**
 * Route aggregation module
 *
 * This module serves as the central router that aggregates all API route modules.
 * It organizes routes into logical groups and applies consistent path prefixes.
 *
 * @module routes/index
 */

import { OpenAPIHono } from '@hono/zod-openapi';
import { API_PREFIX } from '@/config/constants';
import documents from './documents';
import health from './health';

const routes = new OpenAPIHono();

/**
 * Health check routes
 *
 * Mounted at /health (no API prefix) for easy access by load balancers
 * and monitoring systems.
 *
 * Available endpoints:
 * - GET /health - Basic health check
 * - GET /health/ready - Readiness check
 */
routes.route('/health', health);

/**
 * Document management routes
 *
 * Mounted at /api/v1/documents for document CRUD operations.
 *
 * Available endpoints:
 * - GET /api/v1/documents - List all documents (paginated)
 * - GET /api/v1/documents/:id - Get a specific document
 * - POST /api/v1/documents - Create a new document
 * - PATCH /api/v1/documents/:id - Update a document
 * - DELETE /api/v1/documents/:id - Delete a document
 */
routes.route(`${API_PREFIX}/documents`, documents);

export default routes;
