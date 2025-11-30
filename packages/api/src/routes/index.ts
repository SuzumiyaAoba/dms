/**
 * Route aggregation module
 *
 * This module serves as the central router that aggregates all API route modules.
 * It organizes routes into logical groups and applies consistent path prefixes.
 *
 * @module routes/index
 */

import { OpenAPIHono } from '@hono/zod-openapi';
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

// API routes will be added here
// TODO: Add versioned API routes under /api/v1 prefix
// routes.route('/documents', documents);
// routes.route('/search', search);
// etc.

export default routes;
