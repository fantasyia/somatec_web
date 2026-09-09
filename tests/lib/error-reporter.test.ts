import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ErrorEvent } from '@sentry/nextjs';
import { limparEvento } from '@/lib/observabilidade/sentry-limpeza';

// =============================================================================
// ⚠️ ESTE ARQUIVO EXISTE POR CAUSA DE UM VAZAMENTO QUE PASSOU DESPERCEBIDO.
//
// Até 09/09, `reportError` montava o envelope do Sentry à mão e mandava por
// `fetch`. Foi escrito antes do SDK existir aqui, e funcionava.
//
// O problema apareceu quando o SDK entrou, no mesmo dia, trazendo o `beforeSend`
// que varre dado pessoal. `beforeSend` é do SDK: **evento que sai por fetch
// próprio não passa por ele**. Como todo `log.error` do site (33 chamadas)
// passava por aqui, o filtro que a gente acabara de instalar não cobria
// praticamente nada do que realmente era enviado.
//
// A versão anterior DESTE arquivo travava o comportamento errado: afirmava, com
// teste verde, que `user.email` chegava intacto no Sentry. Certo sobre o fato,
// errado sobre o que devia acontecer.
//
// Agora `reportError` só chama o SDK. Os testes abaixo travam as duas metades:
// que ele usa o SDK (e não fetch), e que o que sai por ele é limpo.
// =============================================================================

const captureException = vi.fn();

vi.mock('@sentry/nextjs', () => ({
  captureException: (...a: unknown[]) => captureException(...a),
}));

const { reportError } = await import('@/lib/error-reporter');

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchSpy = vi.fn().mockResolvedValue(new Response('', { status: 200 }));
  vi.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('o evento sai pelo SDK — que é o que faz o filtro valer', () => {
  it('chama captureException com o erro', () => {
    const erro = new Error('boom');
    reportError(erro);

    expect(captureException).toHaveBeenCalledOnce();
    expect(captureException.mock.calls[0][0]).toBe(erro);
  });

  it('⛔ NÃO manda envelope na mão — era esse caminho que escapava do beforeSend', () => {
    reportError(new Error('boom'), { extra: { email: 'cliente@empresa.com.br' } });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('leva scope, tags, extra e user pro SDK', () => {
    reportError(new Error('x'), {
      scope: 'forms',
      tags: { route: '/api/forms/submit' },
      extra: { setor: 'metalurgia' },
      user: { id: 'u1', email: 'u@empresa.com.br' },
    });

    const ctx = captureException.mock.calls[0][1] as {
      tags: Record<string, string>;
      extra: Record<string, unknown>;
      user: { email?: string };
    };
    expect(ctx.tags.scope).toBe('forms');
    expect(ctx.tags.route).toBe('/api/forms/submit');
    expect(ctx.extra.setor).toBe('metalurgia');
    expect(ctx.user.email).toBe('u@empresa.com.br');
  });

  it('sem scope, o padrão é "app"', () => {
    reportError(new Error('x'));
    const ctx = captureException.mock.calls[0][1] as { tags: Record<string, string> };
    expect(ctx.tags.scope).toBe('app');
  });
});

describe('reporter quebrado não pode quebrar quem chamou', () => {
  it('SDK lançando não propaga', () => {
    captureException.mockImplementation(() => {
      throw new Error('sdk fora do ar');
    });

    expect(() => reportError(new Error('boom'))).not.toThrow();
  });
});

describe('a outra metade: o que sai por essa porta é limpo', () => {
  // O `reportError` entrega ao SDK; o SDK aplica `beforeSend`. Aqui o evento é
  // montado como o SDK monta, com o que a versão antiga deixava passar cru.
  it('e-mail em user e em extra não chega ao Sentry', () => {
    const evento = {
      exception: { values: [{ type: 'Error', value: 'falha ao entregar lead' }] },
      tags: { scope: 'forms' },
      extra: { msg: 'falha ao entregar lead', email: 'cliente@empresa.com.br', setor: 'metalurgia' },
      user: { id: 'u1', email: 'u@empresa.com.br' },
    } as unknown as ErrorEvent;

    const limpo = JSON.stringify(limparEvento(evento));

    expect(limpo).not.toContain('cliente@empresa.com.br');
    expect(limpo).not.toContain('u@empresa.com.br');
    // e o que dá contexto ao erro continua legível
    expect(limpo).toContain('metalurgia');
    expect(limpo).toContain('falha ao entregar lead');
  });
});
