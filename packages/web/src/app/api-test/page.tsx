'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/shared/api';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function ApiTestPage() {
  const [health, setHealth] = useState<{ status: string; timestamp: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const result = await apiClient.getHealth();
        setHealth(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    testConnection();
  }, []);

  return (
    <main style={{ padding: '2rem' }}>
      <h1>API Connection Test</h1>

      {error && (
        <div style={{ color: 'red', marginTop: '1rem' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {health && (
        <div style={{ marginTop: '1rem' }}>
          <strong>Connection Successful!</strong>
          <pre style={{ background: '#f5f5f5', padding: '1rem', marginTop: '0.5rem' }}>
            {JSON.stringify(health, null, 2)}
          </pre>
        </div>
      )}

      {!health && !error && <div>Testing connection...</div>}
    </main>
  );
}
