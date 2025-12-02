/**
 * Vitest configuration
 *
 * @see https://vitest.dev/config/
 */

import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['reflect-metadata'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.ts',
        '**/*.d.ts',
        '**/index.ts',
        '**/__tests__/**',
        '**/*.test.ts',
      ],
    },
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules/', 'dist/'],
  },
});
