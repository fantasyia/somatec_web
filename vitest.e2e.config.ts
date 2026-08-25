import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Config separada do vitest.config.ts porque os testes de tests/e2e/ sobem
// `next start` de verdade — exigem `next build` antes e são lentos demais para
// o `npm test` do dia a dia. Rodam em `npm run test:e2e`, depois do build.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'server-only': path.resolve(__dirname, './tests/__mocks__/server-only.ts'),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/e2e/**/*.test.ts'],
    // Um servidor por arquivo, sem disputa de porta.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
