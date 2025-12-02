/**
 * Environment configuration module
 *
 * This module loads and validates environment variables using Zod schema.
 * It ensures type-safe access to configuration values throughout the application.
 *
 * @module config/env
 */

import { config } from 'dotenv';
import { z } from 'zod';

// Load .env file
config();

/**
 * Zod schema for environment variable validation
 *
 * Defines the structure and validation rules for all environment variables.
 * Provides default values for optional configuration.
 */
const envSchema = z.object({
  // Server
  /** Application environment (development, production, or test) */
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  /** Server port number */
  PORT: z.string().default('3000').transform(Number),
  /** Server host address */
  HOST: z.string().default('0.0.0.0'),

  // CORS
  /** Comma-separated list of allowed CORS origins */
  CORS_ORIGIN: z.string().default('*'),

  // Logging
  /** Log level (fatal, error, warn, info, debug, trace) */
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Storage
  /** Storage driver to use for documents */
  STORAGE_DRIVER: z.enum(['memory', 'file']).default('memory'),
  /** File path used when STORAGE_DRIVER=file */
  FILE_STORAGE_PATH: z.string().default('data/documents.json'),
});

/**
 * Type definition for validated environment variables
 *
 * Inferred from the envSchema to ensure type safety.
 */
export type Env = z.infer<typeof envSchema>;

// Parse and validate environment variables
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

/**
 * Validated and type-safe environment configuration object
 *
 * @example
 * ```typescript
 * import { env } from './config/env';
 *
 * console.log(`Server running on port ${env.PORT}`);
 * ```
 */
export const env = parsed.data;

/**
 * Helper function to check if the application is running in development mode
 *
 * @returns {boolean} true if NODE_ENV is 'development'
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Helper function to check if the application is running in production mode
 *
 * @returns {boolean} true if NODE_ENV is 'production'
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Helper function to check if the application is running in test mode
 *
 * @returns {boolean} true if NODE_ENV is 'test'
 */
export const isTest = env.NODE_ENV === 'test';
