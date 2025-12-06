/**
 * Server entry point module
 *
 * This module serves as the main entry point for the DMS API server.
 * It starts the HTTP server using Hono with Node.js adapter and sets up
 * graceful shutdown handlers for SIGINT and SIGTERM signals.
 *
 * @module index
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { serve } from '@hono/node-server';
import { getPort } from 'get-port-please';
import app from '@/app';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

const host = env.HOST;

// Log server startup information
logger.info({
  env: env.NODE_ENV,
  host,
  msg: 'Starting DMS API Server',
});

/**
 * Start the HTTP server with dynamic port allocation
 *
 * Uses get-port-please to find an available port, preferring the configured
 * PORT from environment but falling back to an available port if occupied.
 * Writes the allocated port to a .env.port file for other processes to consume.
 *
 * Configuration is loaded from environment variables:
 * - HOST: Server hostname (default: 0.0.0.0)
 * - PORT: Preferred server port (default: 3000)
 *
 * @example
 * Server startup log output:
 * ```
 * INFO: Starting DMS API Server
 *   env: "development"
 *   host: "0.0.0.0"
 *
 * INFO: Server is running
 *   port: 3000
 *   address: "http://0.0.0.0:3000"
 * ```
 */
(async () => {
  // Get available port, preferring env.PORT
  const port = await getPort({ port: env.PORT, host });

  // Write port to .env.port file for web server to read
  const envPortPath = join(process.cwd(), '.env.port');
  writeFileSync(envPortPath, `API_PORT=${port}\n`);

  logger.info({
    port,
    preferredPort: env.PORT,
    msg: 'Port allocated',
  });

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
})();

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
