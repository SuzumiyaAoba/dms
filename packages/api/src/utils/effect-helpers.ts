/**
 * Effect helpers for Hono integration
 *
 * Provides utilities to run Effect programs in Hono route handlers
 *
 * @module utils/effect-helpers
 */

import { Effect, Either, Runtime } from 'effect';
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

  // Get error message
  const message = 'message' in error ? error.message : 'An error occurred';

  return c.json(
    {
      success: false,
      error: {
        code: error._tag,
        message,
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
export async function runEffectHandler<A, E extends AppError, R>(
  c: Context,
  effect: Effect.Effect<A, E, R>,
  onSuccess: (result: A) => Response | Promise<Response>,
): Promise<Response> {
  // Get the app runtime (preferred) or layer from context (fallback)
  const appRuntime = c.get('appRuntime') as Runtime.Runtime<unknown> | undefined;
  const appLayer = c.get('appLayer');

  const run = async () => {
    if (appRuntime) {
      return Runtime.runPromise(appRuntime, effect.pipe(Effect.either));
    }

    return Effect.runPromise(
      effect.pipe(Effect.provide(appLayer), Effect.either) as Effect.Effect<
        Either.Either<A, E>,
        never,
        never
      >,
    );
  };

  const result = await run();

  if (Either.isLeft(result)) {
    return errorResponse(c, result.left as AppError);
  }

  return onSuccess(result.right);
}
