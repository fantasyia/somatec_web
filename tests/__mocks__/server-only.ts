// Mock vazio do `server-only` para vitest. Em produção o Next.js bloqueia
// importação em código client; em testes Node não precisamos dessa proteção.
export {};
