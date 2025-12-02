/**
 * Health check routes module
 *
 * This module provides OpenAPI-documented endpoints for monitoring the API's health
 * and readiness status. These endpoints are commonly used by load balancers,
 * container orchestrators (e.g., Kubernetes), and monitoring systems to determine
 * if the service is running and ready to accept traffic.
 *
 * @module routes/health
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { env } from '@/config/env';

const health = new OpenAPIHono();

/**
 * Health status response schema
 */
const HealthStatusSchema = z.object({
  status: z.string().openapi({ example: 'healthy' }),
  version: z.string().openapi({ example: '1.0.0' }),
  environment: z.enum(['development', 'production', 'test']).openapi({ example: 'development' }),
  timestamp: z.string().datetime().openapi({ example: '2025-11-30T12:00:00.000Z' }),
});

/**
 * Readiness status response schema
 */
const ReadinessStatusSchema = z.object({
  status: z.string().openapi({ example: 'ready' }),
  checks: z.object({
    database: z.string().openapi({ example: 'pending' }),
    storage: z.string().openapi({ example: 'pending' }),
  }),
});

/**
 * GET /health route definition
 */
const healthRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Health'],
  summary: 'Health check',
  description:
    'Basic health check endpoint that returns the API status and version. Always returns 200 OK if the API process is running.',
  responses: {
    200: {
      description: 'API is healthy',
      content: {
        'application/json': {
          schema: HealthStatusSchema,
        },
      },
    },
  },
});

/**
 * GET /health/ready route definition
 */
const readyRoute = createRoute({
  method: 'get',
  path: '/ready',
  tags: ['Health'],
  summary: 'Readiness check',
  description:
    'Readiness check endpoint that indicates whether the API is ready to serve traffic. Should verify that all dependencies (database, storage, etc.) are accessible.',
  responses: {
    200: {
      description: 'API is ready',
      content: {
        'application/json': {
          schema: ReadinessStatusSchema,
        },
      },
    },
  },
});

/**
 * GET /health
 *
 * Basic health check endpoint that returns the API's current status and version.
 * This endpoint always returns 200 OK if the API process is running.
 *
 * Use this endpoint for basic "is the service running?" checks.
 */
health.openapi(healthRoute, (c) => {
  return c.json({
    status: 'healthy',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/ready
 *
 * Readiness check endpoint that indicates whether the API is ready to serve traffic.
 * This endpoint should verify that all dependencies (database, storage, etc.) are accessible.
 *
 * **TODO**: Currently returns pending status for database and storage checks.
 * These checks should be implemented to verify actual connectivity.
 *
 * Use this endpoint for Kubernetes readiness probes or load balancer health checks.
 */
health.openapi(readyRoute, (c) => {
  // TODO: Add readiness checks (DB connection, etc.)
  return c.json({
    status: 'ready',
    checks: {
      database: 'pending',
      storage: 'pending',
    },
  });
});

export default health;
