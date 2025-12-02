/**
 * Server entry point module
 *
 * This module serves as the main entry point for the DMS API server.
 * It starts the HTTP server using Hono with Node.js adapter and sets up
 * graceful shutdown handlers for SIGINT and SIGTERM signals.
 *
 * @module index
 */

import 'reflect-metadata';
import { serve } from '@hono/node-server';
import app from '@/app';
import { setupContainer } from '@/config/container';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

const port = env.PORT;
const host = env.HOST;

// Initialize DI container
async function initializeServer() {
  try {
    await setupContainer();
    logger.info('DI container initialized successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize DI container');
    process.exit(1);
  }
}

// Log server startup information
logger.info({
  env: env.NODE_ENV,
  port,
  host,
  msg: 'Starting DMS API Server',
});

// Initialize DI container before starting server
await initializeServer();

/**
 * Start the HTTP server
 *
 * Binds the server to the configured host and port, then logs the
 * server address once it's ready to accept connections.
 *
 * Configuration is loaded from environment variables:
 * - HOST: Server hostname (default: 0.0.0.0)
 * - PORT: Server port (default: 3000)
 *
 * @example
 * Server startup log output:
 * ```
 * INFO: Starting DMS API Server
 *   env: "development"
 *   port: 3000
 *   host: "0.0.0.0"
 *
 * INFO: Server is running
 *   port: 3000
 *   address: "http://0.0.0.0:3000"
 * ```
 */
serve(
  {
    fetch: app.fetch,
    port,
    hostname: host,
  },
  (info) => {
    logger.info({
      port: info.port,
      address: `http://${host}:${info.port}`,
      msg: 'Server is running',
    });
  },
);

/**
 * SIGINT signal handler
 *
 * Handles Ctrl+C (SIGINT) for graceful shutdown during development.
 * Logs the shutdown event and exits with code 0.
 *
 * In production, consider implementing a more sophisticated shutdown
 * that waits for active connections to complete.
 */
process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

/**
 * SIGTERM signal handler
 *
 * Handles SIGTERM signal (commonly used by container orchestrators
 * and process managers) for graceful shutdown.
 * Logs the shutdown event and exits with code 0.
 *
 * In production, consider implementing a more sophisticated shutdown
 * that:
 * - Stops accepting new connections
 * - Waits for active requests to complete (with timeout)
 * - Closes database connections
 * - Cleans up resources
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});
