import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// =============================================================================
// O token do Melhor Envio — a parte que ninguém vê falhar.
//
// Dois riscos moram aqui, e nenhum dá erro na tela:
//
//  1. **O refresh é de uso único e ROTACIONA.** Duas renovações simultâneas
//     queimam o mesmo refresh e a segunda invalida a conexão — que só volta
//     com alguém autorizando no navegador. A trava é o que impede isso.
//  2. **O callback é público.** Sem `state` assinado, um estranho troca o
//     token do site pelo da conta dele e as cotações passam a sair de outra
//     carteira, calado.
// =============================================================================

const { fromMock, estado } = vi.hoisted(() => {
  const estado: {
    linha: Record<string, unknown> | null;
    travaLivre: boolean;
    upsertado: Record<string, unknown> | null;
  } = { linha: null, travaLivre: true, upsertado: null };

  const fromMock = vi.fn(() => ({
    select: () => ({
      eq: () => ({ maybeSingle: async () => ({ data: estado.linha, error: null }) }),
    }),
    upsert: async (v: Record<string, unknown>) => {
      estado.upsertado = v;
      estado.linha = { ...(estado.linha ?? {}), ...v };
      return { error: null };
    },
    update: (patch: Record<string, unknown>) => ({
      eq: () => ({
        or: () => ({
          // A trava é este UPDATE condicional: 0 linhas = alguém já está renovando.
          select: async () => ({ data: estado.travaLivre ? [{ id: 1 }] : [], error: null }),
        }),
        then: (r: (v: unknown) => unknown) => {
          Object.assign(estado.linha ?? {}, patch);
          return Promise.resolve(r({ error: null }));
        },
      }),
    }),
  }));
  return { fromMock, estado };
});

vi.mock('@/lib/supabase/admin', () => ({ getSupabaseAdminClient: () => ({ from: fromMock }) }));

const DIA = 24 * 60 * 60 * 1000;

function linhaComVencimento(dias: number, refreshDias = 45) {
  return {
    access_token: 'token-antigo',
    refresh_token: 'refresh-antigo',
    escopo: 'shipping-calculate',
    expira_em: new Date(Date.now() + dias * DIA).toISOString(),
    refresh_expira_em: new Date(Date.now() + refreshDias * DIA).toISOString(),
    renovando_ate: null,
  };
}

async function mod() {
  return import('@/lib/melhorenvio/token');
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.stubEnv('MELHOR_ENVIO_CLIENT_ID', '123');
  vi.stubEnv('MELHOR_ENVIO_CLIENT_SECRET', 'segredo-do-app');
  vi.stubEnv('MELHOR_ENVIO_REDIRECT_URI', 'https://somatecblocking.com.br/api/melhorenvio/callback');
  vi.stubEnv('MELHOR_ENVIO_TOKEN', '');
  estado.linha = null;
  estado.travaLivre = true;
  estado.upsertado = null;
  vi.restoreAllMocks();
});

afterEach(() => vi.unstubAllEnvs());

describe('state do OAuth', () => {
  it('aceita o state que ele mesmo assinou', async () => {
    const { assinarState, stateValido } = await mod();

    expect(stateValido(assinarState())).toBe(true);
  });

  it('recusa state adulterado — é o que separa o callback público de uma porta aberta', async () => {
    const { assinarState, stateValido } = await mod();
    const s = assinarState();

    expect(stateValido(s.slice(0, -3) + 'aaa')).toBe(false);
    expect(stateValido('qualquer.coisa.aqui')).toBe(false);
    expect(stateValido(null)).toBe(false);
  });

  it('recusa state assinado com OUTRO secret (app de terceiro)', async () => {
    const { assinarState } = await mod();
    const s = assinarState();

    vi.resetModules();
    vi.stubEnv('MELHOR_ENVIO_CLIENT_SECRET', 'outro-segredo');
    const { stateValido } = await mod();

    expect(stateValido(s)).toBe(false);
  });

  it('recusa state VELHO (link antigo reaproveitado)', async () => {
    const { assinarState, stateValido } = await mod();
    const s = assinarState();

    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 20 * 60 * 1000);

    expect(stateValido(s)).toBe(false);
  });
});

describe('URL de autorização', () => {
  it('pede o escopo de cálculo e o callback cadastrado', async () => {
    const { urlDeAutorizacao } = await mod();
    const u = new URL(urlDeAutorizacao());

    expect(u.origin + u.pathname).toBe('https://melhorenvio.com.br/oauth/authorize');
    expect(u.searchParams.get('scope')).toBe('shipping-calculate');
    expect(u.searchParams.get('response_type')).toBe('code');
    expect(u.searchParams.get('redirect_uri')).toBe(
      'https://somatecblocking.com.br/api/melhorenvio/callback',
    );
    expect(u.searchParams.get('state')).toBeTruthy();
  });

  it('sandbox troca o host (não dá pra testar contra a conta real)', async () => {
    vi.stubEnv('MELHOR_ENVIO_SANDBOX', 'true');
    const { urlDeAutorizacao } = await mod();

    expect(urlDeAutorizacao()).toContain('sandbox.melhorenvio.com.br');
  });
});

describe('obterTokenValido', () => {
  it('token longe de vencer NÃO renova (renovar à toa queima refresh)', async () => {
    estado.linha = linhaComVencimento(20);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { obterTokenValido } = await mod();

    expect(await obterTokenValido()).toBe('token-antigo');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('perto de vencer, renova e GRAVA o novo par (o refresh rotaciona)', async () => {
    estado.linha = linhaComVencimento(2);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ access_token: 'novo', refresh_token: 'refresh-novo', expires_in: 2592000 }),
        { status: 200 },
      ),
    );
    const { obterTokenValido } = await mod();

    expect(await obterTokenValido()).toBe('novo');
    expect(estado.upsertado).toMatchObject({ access_token: 'novo', refresh_token: 'refresh-novo' });
  });

  it('com a trava tomada, usa o token atual em vez de renovar em paralelo', async () => {
    estado.linha = linhaComVencimento(2);
    estado.travaLivre = false;
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { obterTokenValido } = await mod();

    expect(await obterTokenValido()).toBe('token-antigo');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('refresh VENCIDO devolve null — só autorização manual resolve', async () => {
    estado.linha = linhaComVencimento(-1, -1);
    const { obterTokenValido } = await mod();

    expect(await obterTokenValido()).toBeNull();
  });

  it('renovação que falha não perde o token atual (ainda há margem)', async () => {
    estado.linha = linhaComVencimento(2);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 401 }),
    );
    const { obterTokenValido } = await mod();

    expect(await obterTokenValido()).toBe('token-antigo');
  });

  it('sem autorização ainda aceita token de env (ponte pra token do painel)', async () => {
    vi.stubEnv('MELHOR_ENVIO_TOKEN', 'token-do-painel');
    const { obterTokenValido } = await mod();

    expect(await obterTokenValido()).toBe('token-do-painel');
  });

  it('sem nada configurado devolve null, e o checkout segue sem cotação', async () => {
    vi.stubEnv('MELHOR_ENVIO_CLIENT_ID', '');
    vi.stubEnv('MELHOR_ENVIO_CLIENT_SECRET', '');
    const { obterTokenValido, configurado } = await mod();

    expect(configurado()).toBe(false);
    expect(await obterTokenValido()).toBeNull();
  });
});

describe('renovarSePerto (o cron)', () => {
  it('sem linha no banco não inventa renovação', async () => {
    const { renovarSePerto } = await mod();

    expect(await renovarSePerto()).toBe('sem_token');
  });

  it('token novo em folha: nada a fazer', async () => {
    estado.linha = linhaComVencimento(20);
    const { renovarSePerto } = await mod();

    expect(await renovarSePerto()).toBe('ok');
  });

  it('token perto de vencer é renovado ANTES de alguém cotar', async () => {
    estado.linha = linhaComVencimento(3);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ access_token: 'novo', refresh_token: 'refresh-novo', expires_in: 2592000 }),
        { status: 200 },
      ),
    );
    const { renovarSePerto } = await mod();

    expect(await renovarSePerto()).toBe('renovado');
  });
});

describe('trocarCodePorToken', () => {
  it('manda client_secret e redirect_uri — os dois que o Melhor Envio confere', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ access_token: 'a', refresh_token: 'r', expires_in: 2592000 }),
        { status: 200 },
      ),
    );
    const { trocarCodePorToken } = await mod();

    await trocarCodePorToken('code-do-callback');

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://melhorenvio.com.br/oauth/token');
    expect(JSON.parse(String(init.body))).toMatchObject({
      grant_type: 'authorization_code',
      client_secret: 'segredo-do-app',
      redirect_uri: 'https://somatecblocking.com.br/api/melhorenvio/callback',
      code: 'code-do-callback',
    });
  });

  it('resposta sem token vira erro — gravar lixo deixaria o frete mudo depois', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'invalid_client' }), { status: 401 }),
    );
    const { trocarCodePorToken } = await mod();

    await expect(trocarCodePorToken('x')).rejects.toThrow();
    expect(estado.upsertado).toBeNull();
  });
});
