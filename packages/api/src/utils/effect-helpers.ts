/**
 * Effect helpers for Hono integration
 *
 * Provides utilities to run Effect programs in Hono route handlers
 *
 * @module utils/effect-helpers
 */

import { Effect } from 'effect';
import type { Context } from 'hono';
import type { AppError } from '@/utils/effect-errors';
import { logger } from '@/utils/logger';

/**
 * Run an Effect program and handle errors appropriately
 *
 * This function executes an Effect and converts failures to HTTP responses.
 * It handles all AppError types and converts them to proper HTTP status codes.
 *
 * @param effect - The Effect program to run
 * @returns Promise that resolves with the Effect's success value or rejects with error
 */
export async function runEffect<A>(effect: Effect.Effect<A, AppError>): Promise<A> {
  return Effect.runPromise(effect);
}

/**
 * Create an error response from an AppError
 *
 * @param c - Hono context
 * @param error - The error to convert
 * @returns Response with appropriate status code and error message
 */
export function errorResponse(c: Context, error: AppError) {
  logger.error({ error, errorType: error._tag }, 'Request failed with error');

  // Get status code - fallback to 500 if not defined
  const statusCode = 'statusCode' in error ? error.statusCode : 500;

  return c.json(
    {
      success: false,
      error: {
        code: error._tag,
        message: error.message,
        details: 'details' in error ? error.details : undefined,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    statusCode,
  );
}

/**
 * Run an Effect in a Hono route handler with automatic error handling
 *
 * @param c - Hono context
 * @param effect - The Effect program to run
 * @param onSuccess - Callback to create response on success
 * @returns Response
 */
export async function runEffectHandler<A>(
  c: Context,
  effect: Effect.Effect<A, AppError>,
  onSuccess: (result: A) => Response | Promise<Response>,
): Promise<Response> {
  const result = await Effect.runPromise(Effect.either(effect));

  if (result._tag === 'Left') {
    return errorResponse(c, result.left);
  }

  return onSuccess(result.right);
}
