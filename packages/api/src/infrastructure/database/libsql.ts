/**
 * LibSQL Client Configuration and Layer
 *
 * Provides LibSQL client initialization and Effect Layer for dependency injection.
 *
 * @module infrastructure/database/libsql
 */

import { readFile } from 'node:fs/promises';
import { type Client, createClient } from '@libsql/client';
import { Effect, Layer } from 'effect';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';
import { LibsqlClient } from './LibsqlDocumentRepository';

/**
 * Read SQL schema file
 */
const readSchemaFile = async (): Promise<string> => {
  const schemaPath = new URL('./schema.sql', import.meta.url);
  return await readFile(schemaPath, 'utf-8');
};

/**
 * Initialize LibSQL database schema
 */
const initializeSchema = async (client: Client): Promise<void> => {
  try {
    const schema = await readSchemaFile();
    await client.execute(schema);
    logger.info('LibSQL schema initialized');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize LibSQL schema');
    throw error;
  }
};

/**
 * Create LibSQL client with configuration from environment
 */
const createLibsqlClient = (): Effect.Effect<Client, never> => {
  return Effect.sync(() => {
    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required when DATABASE_TYPE is libsql');
    }

    logger.info({ url: env.DATABASE_URL }, 'Creating LibSQL client');

    const client = createClient({
      url: env.DATABASE_URL,
      authToken: env.DATABASE_AUTH_TOKEN,
    });

    return client;
  });
};

/**
 * Layer for LibSQL Client with schema initialization
 */
export const LibsqlClientLayer = Layer.effect(
  LibsqlClient,
  Effect.gen(function* () {
    const client = yield* createLibsqlClient();

    // Initialize schema
    yield* Effect.tryPromise({
      try: () => initializeSchema(client),
      catch: (error) => {
        logger.error({ error }, 'Failed to initialize database schema');
        return error;
      },
    });

    logger.info('LibSQL client initialized');

    return client;
  }),
);
