/**
 * Structured logging module
 *
 * This module provides a configured Pino logger instance for structured logging
 * throughout the application. It automatically adjusts output format based on
 * the environment (pretty-printed in development, JSON in production).
 *
 * @module utils/logger
 */

import pino from 'pino';
import { env, isDevelopment } from '../config/env';

/**
 * Configured Pino logger instance
 *
 * Features:
 * - Configurable log level via LOG_LEVEL environment variable
 * - Pretty-printed output in development mode with colorization
 * - Structured JSON output in production mode
 * - ISO 8601 timestamps
 * - Omits pid and hostname in development for cleaner output
 *
 * @example
 * ```typescript
 * import { logger } from './utils/logger';
 *
 * logger.info({ userId: '123', action: 'login' }, 'User logged in');
 * logger.error({ err, requestId }, 'Request failed');
 * ```
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Type definition for the logger instance
 *
 * Provides type safety when passing the logger as a parameter.
 */
export type Logger = typeof logger;
