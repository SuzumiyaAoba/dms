/**
 * Hono type extensions
 *
 * Extends Hono's context types to include custom properties
 *
 * @module types/hono
 */

import type { Layer } from 'effect';

declare module 'hono' {
  interface ContextVariableMap {
    appLayer: Layer.Layer<unknown, never, never>;
    requestId: string;
  }
}
