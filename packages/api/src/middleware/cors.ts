import { cors as honoCors } from 'hono/cors';
import { env } from '../config/env';

export const cors = honoCors({
  origin: env.CORS_ORIGIN.split(','),
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400, // 24 hours
  credentials: true,
});
