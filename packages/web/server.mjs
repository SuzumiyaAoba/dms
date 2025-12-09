/**
 * Custom Next.js server with dynamic port allocation
 *
 * This server script uses get-port-please to find an available port
 * and reads the API server port from .env.port file to configure
 * the API_URL environment variable.
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath, parse } from 'node:url';
import { getPort } from 'get-port-please';
import next from 'next';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';

// Preferred port for web server
const preferredPort = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;

// Read API port from .env.port file (with retry logic)
const apiEnvPortPath = join(__dirname, '../api/.env.port');
const fallbackApiPort = 3000; // Align with API default
const maxWaitTime = 10000; // 10 seconds
const checkInterval = 500; // 500ms
const staleFileThreshold = 30000; // 30 seconds

/**
 * Wait for a short period
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Attempt to read API port from .env.port file when it's fresh
 */
function readApiPortFromFile() {
  if (!existsSync(apiEnvPortPath)) {
    return null;
  }

  try {
    const stats = statSync(apiEnvPortPath);
    const age = Date.now() - stats.mtimeMs;
    if (age > staleFileThreshold) {
      console.warn(
        `[Web Server] .env.port looks stale (${Math.round(age)}ms old). Waiting for a fresh value...`,
      );
      return null;
    }

    const content = readFileSync(apiEnvPortPath, 'utf-8');
    const match = content.match(/API_PORT=(\d+)/);
    if (!match) {
      console.warn('[Web Server] .env.port is missing API_PORT entry');
      return null;
    }

    return Number.parseInt(match[1], 10);
  } catch (_error) {
    console.warn('[Web Server] Failed to read API port from .env.port');
    return null;
  }
}

/**
 * Check if the API server is responding on the given port
 */
async function isApiReachable(port) {
  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      signal: AbortSignal.timeout(1500),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Resolve API port with freshness and reachability checks
 */
async function resolveApiPort() {
  const startedAt = Date.now();
  let lastError = '';

  while (Date.now() - startedAt < maxWaitTime) {
    const port = readApiPortFromFile();
    if (port) {
      const reachable = await isApiReachable(port);
      if (reachable) {
        console.log(`[Web Server] Using API port from .env.port: ${port}`);
        return port;
      }

      lastError = `API not responding on ${port}`;
      console.warn(`[Web Server] ${lastError}, retrying...`);
    } else {
      console.log(
        `[Web Server] Waiting for API server to start... (${Date.now() - startedAt}ms)`,
      );
    }

    await sleep(checkInterval);
  }

  console.warn(
    `[Web Server] Could not determine API port (${lastError || 'no .env.port found'}), falling back to ${fallbackApiPort}`,
  );
  return fallbackApiPort;
}

const apiPort = await resolveApiPort();

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

// Create API proxy middleware
const apiProxy = createProxyMiddleware({
  target: `http://localhost:${apiPort}`,
  changeOrigin: true,
  pathFilter: '/api/v1/**',
  logLevel: 'silent',
});

// Create HTTP server
createServer(async (req, res) => {
  try {
    // Proxy API requests
    if (req.url?.startsWith('/api/v1')) {
      apiProxy(req, res);
      return;
    }

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
  console.log(`[Web Server] API proxy enabled: /api/v1 -> http://localhost:${apiPort}`);
});
