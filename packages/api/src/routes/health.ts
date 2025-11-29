import { Hono } from 'hono';
import { env } from '../config/env';
import { successResponse } from '../utils/response';

const health = new Hono();

health.get('/', (c) => {
  return successResponse(c, {
    status: 'healthy',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

health.get('/ready', (c) => {
  // TODO: Add readiness checks (DB connection, etc.)
  return successResponse(c, {
    status: 'ready',
    checks: {
      database: 'pending',
      storage: 'pending',
    },
  });
});

export default health;
