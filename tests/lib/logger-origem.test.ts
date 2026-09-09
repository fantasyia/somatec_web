import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// =============================================================================
// DE ONDE O ERRO VEIO — o Sentry lê isso do topo da pilha.
//
// Achado em 09/09, olhando as três primeiras issues do site: as três apareciam
// com o mesmo culpado, `Object.error(.../api/lgpd/consent/route.js)`. Nenhuma
// delas tinha a ver com consentimento de LGPD. Aquilo era só o pedaço em que o
// bundler jogou o módulo de log — e como o `new Error(msg)` nascia DENTRO do
// logger, o quadro do topo era sempre ele.
//
// Efeito prático: os 33 `log.error` do site apontariam todos pro mesmo lugar
// errado. Numa triagem diária, isso é a diferença entre "o erro está em
// registro.ts:120" e "boa sorte".
//
// `Error.captureStackTrace(e, erroDoLog)` corta a pilha abaixo da função que
// cria o erro. Não dá pra resolver filtrando por nome de arquivo: em produção o
// nome é `chunks/6343.js`, e muda a cada build.
// =============================================================================

const reportError = vi.fn();

vi.mock('@/lib/error-reporter', () => ({
  reportError: (...a: unknown[]) => reportError(...a),
}));

const { createLogger } = await import('@/lib/logger');

/** O erro que o logger entregou ao reporter nesta chamada. */
const erroReportado = () => reportError.mock.calls[0][0] as Error;

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('o topo da pilha é quem chamou, não o logger', () => {
  it('log.error sem exceção aponta pro arquivo que chamou', () => {
    const log = createLogger('teste');

    log.error('algo quebrou');

    const topo = erroReportado().stack?.split('\n')[1] ?? '';
    expect(topo).toContain('logger-origem.test');
    // O módulo do logger não pode aparecer no topo. Comparação pelo caminho de
    // ORIGEM (`src/lib/logger.ts`) — este próprio arquivo de teste mora em
    // `tests/lib/logger-origem`, e um "contém lib/logger" reprovaria sozinho.
    expect(topo).not.toMatch(/src[\\/]lib[\\/]logger\.ts/);
  });

  it('a mensagem continua sendo a do log', () => {
    createLogger('teste').error('algo quebrou');
    expect(erroReportado().message).toBe('algo quebrou');
  });

  it('quando há exceção de verdade, é ELA que vai — com a pilha original', () => {
    const original = new Error('erro do banco');
    const log = createLogger('teste');

    log.error('falha ao gravar', { pedido: 'SB0001' }, original);

    // O erro real nunca é substituído: a pilha dele é o que diz onde quebrou.
    expect(erroReportado()).toBe(original);
  });

  it('o scope e a mensagem seguem junto no contexto', () => {
    createLogger('pedidos').error('falha ao gravar', { pedido: 'SB0001' });

    const ctx = reportError.mock.calls[0][1] as {
      scope: string;
      extra: Record<string, unknown>;
    };
    expect(ctx.scope).toBe('pedidos');
    expect(ctx.extra.msg).toBe('falha ao gravar');
    expect(ctx.extra.pedido).toBe('SB0001');
  });
});
