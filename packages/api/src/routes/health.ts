/**
 * Health check routes module
 *
 * This module provides endpoints for monitoring the API's health and readiness status.
 * These endpoints are commonly used by load balancers, container orchestrators (e.g., Kubernetes),
 * and monitoring systems to determine if the service is running and ready to accept traffic.
 *
 * @module routes/health
 */

import { Hono } from 'hono';
import { env } from '../config/env';
import { successResponse } from '../utils/response';

const health = new Hono();

/**
 * GET /health
 *
 * Basic health check endpoint that returns the API's current status and version.
 * This endpoint always returns 200 OK if the API process is running.
 *
 * Use this endpoint for basic "is the service running?" checks.
 *
 * @returns {Object} Health status information
 * @property {string} status - Always "healthy" if the API is running
 * @property {string} version - Current API version
 * @property {string} environment - Current environment (development/production/test)
 * @property {string} timestamp - Current ISO 8601 timestamp
 *
 * @example
 * Request:
 * ```
 * GET /health
 * ```
 *
 * Response:
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "status": "healthy",
 *     "version": "1.0.0",
 *     "environment": "development",
 *     "timestamp": "2025-11-30T12:00:00.000Z"
 *   },
 *   "meta": {
 *     "timestamp": "2025-11-30T12:00:00.000Z",
 *     "requestId": "550e8400-e29b-41d4-a716-446655440000"
 *   }
 * }
 * ```
 */
health.get('/', (c) => {
  return successResponse(c, {
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
 *
 * @returns {Object} Readiness status and dependency checks
 * @property {string} status - "ready" if all systems are operational
 * @property {Object} checks - Status of individual dependency checks
 * @property {string} checks.database - Database connection status (TODO: implement actual check)
 * @property {string} checks.storage - Storage system status (TODO: implement actual check)
 *
 * @example
 * Request:
 * ```
 * GET /health/ready
 * ```
 *
 * Response (current):
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "status": "ready",
 *     "checks": {
 *       "database": "pending",
 *       "storage": "pending"
 *     }
 *   },
 *   "meta": {
 *     "timestamp": "2025-11-30T12:00:00.000Z",
 *     "requestId": "550e8400-e29b-41d4-a716-446655440000"
 *   }
 * }
 * ```
 *
 * @example
 * Future implementation with actual checks:
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "status": "ready",
 *     "checks": {
 *       "database": "connected",
 *       "storage": "connected"
 *     }
 *   }
 * }
 * ```
 */
health.get('/ready', (c) => {
  // TODO: Add readiness checks (DB connection, etc.)
  return successResponse(c, {
    status: 'ready',
    checks: {
      database: 'pending',
      storage: 'pending',
    },
  });
});

export default health;
