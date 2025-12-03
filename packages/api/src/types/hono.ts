/**
 * Hono type extensions
 *
 * Extends Hono's context types to include custom properties
 *
 * @module types/hono
 */

import type { Layer } from 'effect';
import type { DocumentRepositoryService, StorageAdapter } from '@/services/context';

declare module 'hono' {
  interface ContextVariableMap {
    appLayer: Layer.Layer<DocumentRepositoryService | StorageAdapter, never, never>;
    requestId: string;
  }
}
