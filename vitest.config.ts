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
    // ⏱️ 30s, não os 5s padrão — e o motivo NÃO é teste lento.
    //
    // Uns 17 casos fazem `await import('@/...')` DENTRO do `it()`, de propósito:
    // é assim que eles pegam o módulo depois de mexer em `process.env` ou nos
    // mocks. O que custa ali não é o teste, é resolver o grafo de import do
    // Next na primeira vez — e, com a suíte cheia rodando em paralelo, o
    // `import` somado passa de 400s (medido: 48s numa rodada folgada, 406s numa
    // disputada). Sob essa contenção o import estoura 5s sozinho.
    //
    // O efeito era o pior tipo: o `pre-commit` reprovava commit BOM de vez em
    // quando, sempre nos mesmos 4 arquivos (ratelimit/upstash, leads/entregar,
    // site-settings-erro-nao-cacheia, lgpd-consent-persistencia), e rodando
    // esses arquivos sozinhos passavam em menos de 1s. Quem não soubesse disso
    // ia caçar bug que não existe. Aconteceu comigo em 15/09 e com a sessão do
    // app em 17/09.
    //
    // ⚠️ É PALIATIVO, e não esconde travamento: teste que trava de verdade não
    // termina em 30s nem em 300s. O conserto de raiz é diminuir o custo de
    // import (menos grafo do Next dentro de teste unitário) ou limitar os
    // workers — os dois com preço próprio, e nenhum urgente.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    // tests/e2e sobe `next start` e depende de um build pronto — roda em
    // `npm run test:e2e` (vitest.e2e.config.ts), não aqui.
    exclude: ['tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: [
        'src/lib/forms/**/*.ts',
        'src/lib/mullerbot/**/*.ts',
        'src/lib/turnstile/**/*.ts',
        'src/lib/webhook-queue/**/*.ts',
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
