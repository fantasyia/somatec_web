import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// =============================================================================
// O RASTRO DOS DEGRADES.
//
// Em 30/08 o /api/health respondeu `degraded` numa chamada e `ok` nas seis
// seguintes. Não sobrou nada pra investigar: cada chamada é um retrato do
// instante, e o incidente já tinha passado.
//
// O que se protege aqui é o que torna o rastro útil de verdade: ele registra
// MUDANÇA de estado, não amostra. O monitoramento bate de minuto em minuto —
// gravar toda chamada encheria a lista com o mesmo degrade repetido e
// esconderia justamente o que importa: quando começou e quando voltou.
// =============================================================================

const redisMock = vi.fn();
vi.mock('@/lib/redis', () => ({ getRedis: () => ({ ping: () => redisMock() }) }));

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: () => ({
    from: () => ({
      select: () => ({ limit: () => Promise.resolve({ error: null, data: [] }) }),
    }),
  }),
}));

function req() {
  return new NextRequest('http://localhost:3000/api/health');
}

async function chamar(GET: (r: NextRequest) => Promise<Response>) {
  return (await GET(req())).json();
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abcdefghijklmnop.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
  vi.stubEnv('BETINNA_LEADS_URL', 'https://betinna.example/leads');
  vi.stubEnv('BETINNA_API_KEY', 'chave');
  redisMock.mockResolvedValue('PONG');
});
afterEach(() => {
  vi.unstubAllEnvs();
  // o spy de process.uptime nao pode vazar pro proximo teste
  vi.restoreAllMocks();
});

describe('rastro de degrade', () => {
  it('tudo saudável não inventa evento nenhum', async () => {
    const { GET } = await import('@/app/api/health/route');
    const a = await chamar(GET);
    expect(a.status).toBe('ok');
    expect(a.degrades_recentes.eventos).toEqual([]);
  });

  it('grava o degrade com O QUE estava ruim — não só que ficou ruim', async () => {
    redisMock.mockRejectedValue(new Error('connect ECONNREFUSED'));
    const { GET } = await import('@/app/api/health/route');
    const r = await chamar(GET);

    expect(r.status).toBe('degraded');
    const [ev] = r.degrades_recentes.eventos;
    expect(ev.status).toBe('degraded');
    expect(ev.ruins.map((x: { check: string }) => x.check)).toContain('redis');
    // a mensagem do erro vai junto: é ela que diz se foi recusa, timeout ou outra coisa
    expect(JSON.stringify(ev.ruins)).toMatch(/ECONNREFUSED/);
    expect(ev.quando).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('degrade que PERSISTE não vira lista de repetição', async () => {
    // O monitoramento bate de minuto em minuto. Se cada chamada virasse
    // evento, oito batidas apagariam o histórico inteiro com o mesmo degrade.
    redisMock.mockRejectedValue(new Error('caiu'));
    const { GET } = await import('@/app/api/health/route');
    for (let i = 0; i < 6; i++) await chamar(GET);
    const r = await chamar(GET);
    expect(r.degrades_recentes.eventos).toHaveLength(1);
  });

  it('a VOLTA pro normal também é evento — é ela que fecha a janela', async () => {
    const { GET } = await import('@/app/api/health/route');
    redisMock.mockRejectedValue(new Error('caiu'));
    await chamar(GET);
    redisMock.mockResolvedValue('PONG');
    const r = await chamar(GET);

    expect(r.status).toBe('ok');
    expect(r.degrades_recentes.eventos).toHaveLength(2);
    // o mais recente primeiro: a recuperação, sem nada ruim na lista
    expect(r.degrades_recentes.eventos[0].status).toBe('ok');
    expect(r.degrades_recentes.eventos[0].ruins).toEqual([]);
    expect(r.degrades_recentes.eventos[1].status).toBe('degraded');
  });

  it('só o que está RUIM entra no evento', async () => {
    redisMock.mockRejectedValue(new Error('caiu'));
    const { GET } = await import('@/app/api/health/route');
    const r = await chamar(GET);
    const nomes = r.degrades_recentes.eventos[0].ruins.map((x: { check: string }) => x.check);
    // supabase está ok nesta montagem — listar o que está bem não ajuda a investigar
    expect(nomes).not.toContain('supabase');
  });

  it('a lista não cresce sem fim', async () => {
    const { GET } = await import('@/app/api/health/route');
    for (let i = 0; i < 12; i++) {
      redisMock[i % 2 === 0 ? 'mockRejectedValue' : 'mockResolvedValue'](
        i % 2 === 0 ? new Error('flap') : 'PONG',
      );
      await chamar(GET);
    }
    expect(r_len(await chamar(GET))).toBeLessThanOrEqual(8);
  });

  it('diz DESDE QUANDO a memória vale — lista vazia não é prova de calmaria', async () => {
    // O rastro vive na memória do processo: deploy ou restart zera. Sem o
    // `desde`, uma lista vazia logo após subir leria como "nunca degradou".
    const { GET } = await import('@/app/api/health/route');
    const r = await chamar(GET);
    expect(r.degrades_recentes.desde).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

function r_len(r: { degrades_recentes: { eventos: unknown[] } }) {
  return r.degrades_recentes.eventos.length;
}

// =============================================================================
// JANELA DE PARTIDA.
//
// Medido em produção: o Redis responde `down` por ~13 s depois do processo
// subir — é a conexão do ioredis que ainda não estabeleceu, não o Redis caído.
// Acontece a cada deploy.
//
// Decisão do Léo (30/08): quem ignora a janela é o MONITOR, não o endpoint. O
// check continua dizendo a verdade; o que se entrega aqui é o GANCHO pra quem
// monta o alerta. Fazer o check mentir por 30 s esconderia um Redis que caiu
// de verdade logo após um deploy — que é justamente quando é mais provável.
// =============================================================================

describe('janela de partida', () => {
  it('o corpo carrega uptime e o tamanho da janela — sem precisar de outro endpoint', async () => {
    const { GET } = await import('@/app/api/health/route');
    const r = await chamar(GET);
    expect(typeof r.uptime_s).toBe('number');
    expect(r.janela_partida_s).toBe(30);
  });

  it('degrade logo depois de subir vem marcado como `na_partida`', async () => {
    vi.spyOn(process, 'uptime').mockReturnValue(4);
    redisMock.mockRejectedValue(new Error('Stream is not writeable'));
    const { GET } = await import('@/app/api/health/route');
    const r = await chamar(GET);
    expect(r.degrades_recentes.eventos[0].na_partida).toBe(true);
  });

  it('degrade com o processo já rodando NÃO vem marcado — este o alerta tem que pegar', async () => {
    vi.spyOn(process, 'uptime').mockReturnValue(3600);
    redisMock.mockRejectedValue(new Error('connect ECONNREFUSED'));
    const { GET } = await import('@/app/api/health/route');
    const r = await chamar(GET);
    expect(r.degrades_recentes.eventos[0].na_partida).toBe(false);
  });

  it('o status NÃO é maquiado dentro da janela — o check continua honesto', async () => {
    // O endpoint não pode virar `ok` só porque acabou de subir: isso esconderia
    // um Redis que caiu de verdade logo após o deploy.
    vi.spyOn(process, 'uptime').mockReturnValue(2);
    redisMock.mockRejectedValue(new Error('caiu de verdade'));
    const { GET } = await import('@/app/api/health/route');
    const r = await chamar(GET);
    expect(r.status).toBe('degraded');
    expect(r.checks.redis.status).toBe('down');
    expect(JSON.stringify(r.degrades_recentes.eventos[0].ruins)).toMatch(/caiu de verdade/);
  });
});
