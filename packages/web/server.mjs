/**
 * Custom Next.js server with dynamic port allocation
 *
 * This server script uses get-port-please to find an available port
 * and reads the API server port from .env.port file to configure
 * the API_URL environment variable.
 */

import { getPort } from 'get-port-please';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node:url';
import next from 'next';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';

// Preferred port for web server
const preferredPort = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3001;

// Read API port from .env.port file (with retry logic)
const apiEnvPortPath = join(__dirname, '../api/.env.port');
let apiPort = 3000; // Default fallback

// Wait for API server to write .env.port file (max 10 seconds)
const maxWaitTime = 10000; // 10 seconds
const checkInterval = 500; // 500ms
let waited = 0;

while (!existsSync(apiEnvPortPath) && waited < maxWaitTime) {
  console.log(`[Web Server] Waiting for API server to start... (${waited}ms)`);
  await new Promise(resolve => setTimeout(resolve, checkInterval));
  waited += checkInterval;
}

if (existsSync(apiEnvPortPath)) {
  try {
    const content = readFileSync(apiEnvPortPath, 'utf-8');
    const match = content.match(/API_PORT=(\d+)/);
    if (match) {
      apiPort = Number.parseInt(match[1], 10);
      console.log(`[Web Server] Read API port from .env.port: ${apiPort}`);
    }
  } catch (error) {
    console.warn('[Web Server] Failed to read API port from .env.port, using default 3000');
  }
} else {
  console.warn('[Web Server] .env.port not found after waiting, using default API port 3000');
}

// Set API URL environment variables for Next.js
process.env.NEXT_PUBLIC_API_URL = `http://localhost:${apiPort}/api/v1`;
process.env.API_URL = `http://localhost:${apiPort}/api/v1`;

console.log(`[Web Server] API URL: ${process.env.NEXT_PUBLIC_API_URL}`);

// Get available port for web server
const port = await getPort({ port: preferredPort, host: hostname });

if (port !== preferredPort) {
  console.log(`[Web Server] Port ${preferredPort} is occupied, using ${port} instead`);
}

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

// Create HTTP server
createServer(async (req, res) => {
  try {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  } catch (err) {
    console.error('Error occurred handling', req.url, err);
    res.statusCode = 500;
    res.end('internal server error');
  }
}).listen(port, hostname, () => {
  console.log(`[Web Server] Ready on http://${hostname}:${port}`);
  console.log(`[Web Server] Environment: ${dev ? 'development' : 'production'}`);
});
