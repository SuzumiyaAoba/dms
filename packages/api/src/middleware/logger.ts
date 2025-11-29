import type { Context, Next } from 'hono';
import { logger } from '../utils/logger';

export const loggerMiddleware = async (c: Context, next: Next) => {
  const start = Date.now();
  const { method, url } = c.req;

  // Generate request ID
  const requestId = crypto.randomUUID();
  c.set('requestId', requestId);

  logger.info({
    requestId,
    method,
    url,
    msg: 'Incoming request',
  });

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  logger.info({
    requestId,
    method,
    url,
    status,
    duration: `${duration}ms`,
    msg: 'Request completed',
  });
};
