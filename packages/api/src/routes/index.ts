import { Hono } from 'hono';
import health from './health';

const routes = new Hono();

// Health check routes (no /api prefix)
routes.route('/health', health);

// API routes will be added here
// routes.route('/documents', documents);
// routes.route('/search', search);
// etc.

export default routes;
