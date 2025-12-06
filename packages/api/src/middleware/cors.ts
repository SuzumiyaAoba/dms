/**
 * CORS (Cross-Origin Resource Sharing) middleware module
 *
 * This module configures and exports CORS middleware to control which origins
 * can access the API, what methods are allowed, and what headers can be used.
 * Configuration is loaded from environment variables.
 *
 * @module middleware/cors
 */

import { cors as honoCors } from 'hono/cors';
import { env } from '@/config/env';

/**
 * Parse CORS origin configuration
 *
 * Handles the special case where CORS_ORIGIN is "*" (allow all origins).
 * In this case, we return "*" as a string instead of splitting it into an array.
 *
 * @returns {string | string[]} CORS origin configuration
 */
function parseCorsOrigin(): string | string[] {
  const corsOrigin = env.CORS_ORIGIN.trim();
  // If CORS_ORIGIN is "*", return it as-is for wildcard support
  if (corsOrigin === '*') {
    return '*';
  }
  // Otherwise, split by comma for multiple origins
  return corsOrigin.split(',').map((origin) => origin.trim());
}

/**
 * CORS middleware configuration
 *
 * Configures Cross-Origin Resource Sharing with the following settings:
 * - **origin**: Comma-separated list from CORS_ORIGIN environment variable, or "*" for all origins
 * - **allowMethods**: GET, POST, PUT, PATCH, DELETE, OPTIONS
 * - **allowHeaders**: Content-Type, Authorization
 * - **exposeHeaders**: Content-Length, X-Request-Id
 * - **maxAge**: 86400 seconds (24 hours) for preflight cache
 * - **credentials**: true (allows cookies and authentication headers)
 *
 * @example
 * Environment configuration:
 * ```env
 * # Allow all origins (development)
 * CORS_ORIGIN=*
 *
 * # Allow specific origins (production)
 * CORS_ORIGIN=http://localhost:3000,https://example.com
 * ```
 *
 * @example
 * Usage in Hono app:
 * ```typescript
 * import { cors } from './middleware/cors';
 *
 * app.use('*', cors);
 * ```
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS | MDN CORS Documentation}
 */
/**
 * Determine if credentials should be enabled
 *
 * Credentials cannot be used with wildcard origin ("*").
 * When CORS_ORIGIN is "*", we disable credentials to avoid CORS errors.
 *
 * @returns {boolean} whether to enable credentials
 */
function shouldEnableCredentials(): boolean {
  const corsOrigin = env.CORS_ORIGIN.trim();
  // Cannot use credentials with wildcard origin
  return corsOrigin !== '*';
}

export const cors = honoCors({
  origin: parseCorsOrigin(),
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400, // 24 hours
  credentials: shouldEnableCredentials(),
});
