import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // 'server-only' é um shim do Next.js que bloqueia importação no client.
      // Em testes (Node puro) substituímos por módulo vazio.
      'server-only': path.resolve(__dirname, './tests/__mocks__/server-only.ts'),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: [
        'src/lib/forms/**/*.ts',
        'src/lib/mullerbot/**/*.ts',
        'src/lib/turnstile/**/*.ts',
        'src/lib/webhook-queue/**/*.ts',
        'src/lib/admin/schemas.ts',
        'src/lib/logger.ts',
        'src/lib/error-reporter.ts',
      ],
      exclude: ['**/*.d.ts', '**/index.ts'],
      // Threshold mínimo para módulos críticos de business logic.
      // CI falha se cair abaixo — protege regressões de teste.
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
