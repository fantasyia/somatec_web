import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// =============================================================================
// A4 DA AUDITORIA 13/09 — ERRO DE BANCO NÃO PODE VIRAR NOINDEX CACHEADO 1H.
//
// O `loadKeys` de site_settings descartava o `error` do Supabase: um timeout
// devolvia {}, o unstable_cache guardava por 3600s, e por uma hora o site
// inteiro saía com robots noindex (robots_index ?? false), sem GTM e com
// título de fallback — sem nada acusar. É a falha que derruba o go-live em
// silêncio.
//
// O conserto tem duas metades e este arquivo testa as duas:
//   1. no ERRO, o getter LANÇA (o unstable_cache não guarda nada → a próxima
//      requisição tenta o banco de novo, em vez de ficar 1h no vazio);
//   2. o `comFallback` do chamador entrega o fallback SÓ desta requisição, sem
//      500 pro visitante.
//
// A distinção que importa: "banco vazio" (sem linhas) é resultado legítimo e
// cacheável; "banco fora" (error) é transitório e não pode grudar.
// =============================================================================

const select = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: () => ({
    from: () => ({ select: (...a: unknown[]) => select(...a) }),
  }),
}));

// unstable_cache no ambiente de teste: chama a função direto (sem persistir).
// O ponto do teste é o comportamento de LANÇAR vs RETORNAR, não a persistência
// do cache do Next — que é justamente o que não queremos exercitar aqui.
vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...a: unknown[]) => unknown) => fn,
}));

const ORIGINAL = { ...process.env };

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://iwtltrzpzidehumypepy.supabase.co';
  // a query é `.select(...).in(...)` — devolvemos um thenable que resolve no
  // formato { data, error } que o supabase-js entrega.
  select.mockImplementation(() => ({
    in: (..._a: unknown[]) => Promise.resolve({ data: null, error: { message: 'Gateway Timeout' } }),
  }));
});

afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.clearAllMocks();
});

describe('erro do banco em site_settings', () => {
  it('getSeoSettings LANÇA no erro — nada é cacheado', async () => {
    const { getSeoSettings } = await import('@/lib/data/site-settings');
    await expect(getSeoSettings()).rejects.toThrow(/site_settings load falhou/);
  });

  it('comFallback devolve o fallback nesta requisição, sem propagar o erro', async () => {
    const { getSeoSettings, comFallback, SEO_FALLBACK } = await import('@/lib/data/site-settings');
    const seo = await comFallback(getSeoSettings, SEO_FALLBACK, 'teste');
    expect(seo).toEqual(SEO_FALLBACK);
    // robots_index null → generateMetadata faz `?? false` = noindex por ESTA
    // requisição só. É o preço aceitável; o inaceitável era 1h.
    expect(seo.robots_index).toBeNull();
    expect(seo.gtm_id).toBeNull();
  });

  it('banco VAZIO (sem erro) NÃO lança — resultado legítimo e cacheável', async () => {
    select.mockImplementation(() => ({
      in: (..._a: unknown[]) => Promise.resolve({ data: [], error: null }),
    }));
    const { getSeoSettings } = await import('@/lib/data/site-settings');
    const seo = await getSeoSettings();
    expect(seo.title).toBeNull(); // cai no fallback de SITE.* no layout, sem erro
  });

  it('sem env de Supabase NÃO lança — build estático/CI', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const { getSocials } = await import('@/lib/data/site-settings');
    const socials = await getSocials();
    expect(socials).toHaveProperty('linkedin');
  });
});

describe('comFallback em geral', () => {
  it('retorna o valor quando o getter resolve', async () => {
    const { comFallback } = await import('@/lib/data/site-settings');
    expect(await comFallback(async () => 42, 0, 'x')).toBe(42);
  });

  it('retorna o fallback quando o getter lança', async () => {
    const { comFallback } = await import('@/lib/data/site-settings');
    expect(
      await comFallback(
        async () => {
          throw new Error('fora');
        },
        99,
        'x',
      ),
    ).toBe(99);
  });
});
