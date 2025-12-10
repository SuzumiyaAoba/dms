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
const hostname = '127.0.0.1';

// Preferred port for web server
const preferredPort = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;

// Read API port from .env.port file (with retry logic)
const apiEnvPortPath = join(__dirname, '../api/.env.port');
const maxWaitTime = 5000; // 5 seconds timeout for detecting API server
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
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
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
    `[Web Server] Could not determine API port (${lastError || 'no .env.port found'}), falling back to 3001`,
  );
  return 3001;
}

let apiPort = await resolveApiPort();

// Configure API URLs: client uses same-origin /api/v1, server-side fetch uses API_URL.
if (apiPort) {
  process.env.API_URL = `http://127.0.0.1:${apiPort}/api/v1`;
  delete process.env.NEXT_PUBLIC_API_URL;
  console.log(`[Web Server] API URL (server-side): ${process.env.API_URL}`);
} else {
  delete process.env.API_URL;
  delete process.env.NEXT_PUBLIC_API_URL;
  console.error('[Web Server] API server not reachable. API proxy disabled.');
}

// Get available port for web server.
// If API also wants 3000, prefer the next port to avoid binding the same.
const portCandidates = apiPort && preferredPort === apiPort
  ? [preferredPort + 1, preferredPort + 2, preferredPort + 3]
  : preferredPort;
const port = await getPort({ port: portCandidates, host: hostname });

// Avoid self-proxy: if API port equals web port, disable proxy to prevent loops
if (apiPort && apiPort === port) {
  console.warn(
    `[Web Server] API port (${apiPort}) is the same as web port (${port}). Disabling API proxy.`,
  );
  apiPort = null;
}

if (port !== preferredPort) {
  console.log(`[Web Server] Port ${preferredPort} is occupied, using ${port} instead`);
}

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

// Create API proxy middleware (only when API is reachable)
const apiProxy = apiPort
  ? createProxyMiddleware({
      target: `http://127.0.0.1:${apiPort}`,
      changeOrigin: true,
      pathFilter: '/api/v1/**',
      logLevel: 'silent',
      onError(err, _req, res) {
        console.error('[Web Server] API proxy error', err?.message || err);
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'API proxy unavailable' }));
      },
    })
  : null;

// Create HTTP server
createServer(async (req, res) => {
  try {
    // Proxy API requests
    if (req.url?.startsWith('/api/v1')) {
      if (apiProxy) {
        apiProxy(req, res);
      } else {
        res.statusCode = 503;
        res.end('API server unavailable');
      }
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
  if (apiProxy && apiPort) {
    console.log(`[Web Server] API proxy enabled: /api/v1 -> http://localhost:${apiPort}`);
  } else {
    console.log('[Web Server] API proxy disabled (API not reachable)');
  }
});
