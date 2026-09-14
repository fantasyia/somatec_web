import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// =============================================================================
// /api/health ERA UM MAPA DA ARQUITETURA, ABERTO E SEM TETO.
//
// Medido em produção em 13/09: devolvia `error.message` do Supabase e do
// ioredis, os NOMES das envs faltando ("faltando: SUPABASE_SERVICE_ROLE_KEY"),
// estatística da fila e o histórico de degrades — com
// `Access-Control-Allow-Origin: *`, sem auth e sem rate limit. Cada hit fazia
// 3 consultas ao banco, então um `curl` em laço era carga direta no Postgres.
//
// O conserto não é esconder o status (monitor de uptime precisa dele): é
// separar STATUS de DIAGNÓSTICO. Público vê se está de pé; quem tem o
// CRON_SECRET vê por quê.
// =============================================================================

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: () => ({
    from: () => ({
      select: () => ({ limit: async () => ({ data: [], error: null }) }),
    }),
  }),
}));
vi.mock('@/lib/redis', () => ({
  getRedis: () => null,
  idadeDoRedisS: () => null,
}));

const ORIGINAL = { ...process.env };

function req(headers: Record<string, string> = {}) {
  return new Request('https://www.somatecblocking.com.br/api/health', { headers }) as never;
}

beforeEach(() => {
  process.env.CRON_SECRET = 'segredo-do-cron';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://iwtltrzpzidehumypepy.supabase.co';
});

afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.clearAllMocks();
});

describe('sem o Bearer: só status e horário', () => {
  it('não vaza mensagem interna, nome de env, fila nem histórico', async () => {
    const { GET } = await import('@/app/api/health/route');
    const corpo = await (await GET(req())).json();

    expect(corpo.status).toBeTruthy();
    expect(corpo.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // O que não pode aparecer:
    expect(corpo.checks).toBeUndefined();
    expect(corpo.queue_stats).toBeUndefined();
    expect(corpo.degrades_recentes).toBeUndefined();
    expect(JSON.stringify(corpo)).not.toMatch(/SUPABASE|REDIS|BETINNA|faltando/i);
  });

  it('é cacheável na borda — curl em laço não vira carga no banco', async () => {
    const { GET } = await import('@/app/api/health/route');
    const res = await GET(req());
    expect(res.headers.get('cache-control')).toMatch(/s-maxage=\d+/);
  });
});

describe('com o Bearer certo: o diagnóstico inteiro', () => {
  it('volta checks, fila e histórico', async () => {
    const { GET } = await import('@/app/api/health/route');
    const corpo = await (
      await GET(req({ authorization: 'Bearer segredo-do-cron' }))
    ).json();

    expect(corpo.checks).toBeDefined();
    expect(corpo.degrades_recentes).toBeDefined();
  });

  it('Bearer errado NÃO abre o diagnóstico', async () => {
    const { GET } = await import('@/app/api/health/route');
    const corpo = await (await GET(req({ authorization: 'Bearer chute' }))).json();
    expect(corpo.checks).toBeUndefined();
  });
});
