import { Hono } from 'hono';
import { logger as honoLogger } from 'hono/logger';
import { API_PREFIX } from './config/constants';
import { cors } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import { loggerMiddleware } from './middleware/logger';
import { notFound } from './middleware/notFound';
import routes from './routes';

const app = new Hono();

// Global middleware
app.use('*', honoLogger());
app.use('*', loggerMiddleware);
app.use('*', cors);
app.use('*', errorHandler);

// Routes
app.route('/', routes);

// API versioned routes (to be added)
// app.route(API_PREFIX, apiRoutes);

// 404 handler
app.notFound(notFound);

export default app;
