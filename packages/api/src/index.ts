import { serve } from '@hono/node-server';
import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const port = env.PORT;
const host = env.HOST;

logger.info({
  env: env.NODE_ENV,
  port,
  host,
  msg: 'Starting DMS API Server',
});

serve(
  {
    fetch: app.fetch,
    port,
    hostname: host,
  },
  (info) => {
    logger.info({
      port: info.port,
      address: `http://${host}:${info.port}`,
      msg: 'Server is running',
    });
  },
);

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});
