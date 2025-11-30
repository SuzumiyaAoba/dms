import { describe, expect, it } from 'vitest';
import app from '../app';

describe('Health Routes', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const req = new Request('http://localhost/health');
      const res = await app.request(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.status).toBe('healthy');
      expect(json.version).toBe('1.0.0');
      expect(json.environment).toBeDefined();
      expect(['development', 'production', 'test']).toContain(json.environment);
      expect(json.timestamp).toBeDefined();
      expect(new Date(json.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('should return valid ISO timestamp', async () => {
      const req = new Request('http://localhost/health');
      const res = await app.request(req);
      const json = await res.json();

      const timestamp = new Date(json.timestamp);
      expect(timestamp.toISOString()).toBe(json.timestamp);
    });

    it('should have application/json content type', async () => {
      const req = new Request('http://localhost/health');
      const res = await app.request(req);

      expect(res.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness status', async () => {
      const req = new Request('http://localhost/health/ready');
      const res = await app.request(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.status).toBe('ready');
      expect(json.checks).toBeDefined();
      expect(json.checks.database).toBeDefined();
      expect(json.checks.storage).toBeDefined();
    });

    it('should return pending status for checks (until implemented)', async () => {
      const req = new Request('http://localhost/health/ready');
      const res = await app.request(req);
      const json = await res.json();

      // Current implementation returns 'pending' for all checks
      expect(json.checks.database).toBe('pending');
      expect(json.checks.storage).toBe('pending');
    });

    it('should have application/json content type', async () => {
      const req = new Request('http://localhost/health/ready');
      const res = await app.request(req);

      expect(res.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('Error cases', () => {
    it('should return 404 for non-existent route', async () => {
      const req = new Request('http://localhost/health/nonexistent');
      const res = await app.request(req);

      expect(res.status).toBe(404);
    });

    it('should return 404 for wrong HTTP method on health endpoint', async () => {
      const req = new Request('http://localhost/health', { method: 'POST' });
      const res = await app.request(req);

      expect(res.status).toBe(404);
    });

    it('should return 404 for wrong HTTP method on ready endpoint', async () => {
      const req = new Request('http://localhost/health/ready', { method: 'DELETE' });
      const res = await app.request(req);

      expect(res.status).toBe(404);
    });
  });
});
