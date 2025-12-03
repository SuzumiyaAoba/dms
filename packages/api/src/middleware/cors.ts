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
 * CORS middleware configuration
 *
 * Configures Cross-Origin Resource Sharing with the following settings:
 * - **origin**: Comma-separated list from CORS_ORIGIN environment variable
 * - **allowMethods**: GET, POST, PUT, PATCH, DELETE, OPTIONS
 * - **allowHeaders**: Content-Type, Authorization
 * - **exposeHeaders**: Content-Length, X-Request-Id
 * - **maxAge**: 86400 seconds (24 hours) for preflight cache
 * - **credentials**: true (allows cookies and authentication headers)
 *
 * @example
 * Environment configuration:
 * ```env
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
export const cors = honoCors({
  origin: env.CORS_ORIGIN.split(','),
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400, // 24 hours
  credentials: true,
});
