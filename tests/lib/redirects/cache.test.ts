import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

async function freshModule() {
  vi.resetModules();
  return await import('@/lib/redirects/cache');
}

describe('rowsToMap', () => {
  it('converte array de redirects em Map indexado por from_path', async () => {
    const { rowsToMap } = await freshModule();
    const map = rowsToMap([
      { from_path: '/old', to_path: '/new', status_code: 301 },
      { from_path: '/x', to_path: '/y', status_code: 302 },
    ]);
    expect(map.size).toBe(2);
    expect(map.get('/old')).toEqual({ to_path: '/new', status_code: 301 });
    expect(map.get('/x')).toEqual({ to_path: '/y', status_code: 302 });
  });

  it('Map vazio para input vazio', async () => {
    const { rowsToMap } = await freshModule();
    expect(rowsToMap([]).size).toBe(0);
  });
});

describe('getRedirects — L3 Supabase fallback (sem Redis configurado)', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('busca direto do Supabase quando Redis off', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify([{ from_path: '/a', to_path: '/b', status_code: 301 }]), { status: 200 }),
    );
    const { getRedirects } = await freshModule();
    const map = await getRedirects();
    expect(map.get('/a')).toEqual({ to_path: '/b', status_code: 301 });
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toContain('/rest/v1/redirects');
  });

  it('cacheia em memória — segunda chamada não atinge Supabase', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify([{ from_path: '/a', to_path: '/b', status_code: 301 }]), { status: 200 }),
    );
    const { getRedirects, __resetMemCacheForTests } = await freshModule();
    __resetMemCacheForTests();
    await getRedirects();
    await getRedirects();
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('retorna Map vazio se Supabase falhar e não tem cache', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('', { status: 500 }));
    const { getRedirects, __resetMemCacheForTests } = await freshModule();
    __resetMemCacheForTests();
    const map = await getRedirects();
    expect(map.size).toBe(0);
  });

  it('retorna Map vazio se Supabase URL ausente', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    const { getRedirects, __resetMemCacheForTests } = await freshModule();
    __resetMemCacheForTests();
    const map = await getRedirects();
    expect(map.size).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('getRedirects — L2 Redis configurado', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.test');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'tk');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('hit no Redis: usa cached, não chama Supabase', async () => {
    const cachedRows = JSON.stringify([
      { from_path: '/redis-hit', to_path: '/dest', status_code: 301 },
    ]);
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ result: cachedRows }), { status: 200 }),
    );
    const { getRedirects, __resetMemCacheForTests } = await freshModule();
    __resetMemCacheForTests();
    const map = await getRedirects();
    expect(map.get('/redis-hit')).toEqual({ to_path: '/dest', status_code: 301 });
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(String(fetchSpy.mock.calls[0]![0])).toContain('redis.test/get/');
  });

  it('miss no Redis: vai ao Supabase e repopula L2', async () => {
    // 1. Redis GET → null
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ result: null }), { status: 200 }),
    );
    // 2. Supabase REST → rows
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify([{ from_path: '/a', to_path: '/b', status_code: 301 }]), { status: 200 }),
    );
    // 3. Redis SETEX (response ignorada)
    fetchSpy.mockResolvedValueOnce(new Response('', { status: 200 }));

    const { getRedirects, __resetMemCacheForTests } = await freshModule();
    __resetMemCacheForTests();
    const map = await getRedirects();
    expect(map.get('/a')).toEqual({ to_path: '/b', status_code: 301 });
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(String(fetchSpy.mock.calls[2]![0])).toContain('redis.test/setex/');
  });

  it('Redis com JSON inválido: degrada silenciosamente para Supabase', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ result: 'not-json{' }), { status: 200 }),
    );
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify([{ from_path: '/x', to_path: '/y', status_code: 301 }]), { status: 200 }),
    );
    fetchSpy.mockResolvedValueOnce(new Response('', { status: 200 }));
    const { getRedirects, __resetMemCacheForTests } = await freshModule();
    __resetMemCacheForTests();
    const map = await getRedirects();
    expect(map.get('/x')).toEqual({ to_path: '/y', status_code: 301 });
  });
});

describe('invalidateRedirectsCache', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue(new Response('', { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('chama Redis DEL quando configurado', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.test');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'tk');
    const { invalidateRedirectsCache } = await freshModule();
    await invalidateRedirectsCache();
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(String(fetchSpy.mock.calls[0]![0])).toContain('redis.test/del/');
  });

  it('no-op silencioso quando Redis não configurado', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    const { invalidateRedirectsCache } = await freshModule();
    await invalidateRedirectsCache();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('força reload no próximo getRedirects (limpa memória)', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'k');
    const { getRedirects, invalidateRedirectsCache, __resetMemCacheForTests } = await freshModule();
    __resetMemCacheForTests();

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify([{ from_path: '/v1', to_path: '/dest', status_code: 301 }]), { status: 200 }),
    );
    await getRedirects(); // popula
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await invalidateRedirectsCache(); // limpa memória

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify([{ from_path: '/v2', to_path: '/dest', status_code: 301 }]), { status: 200 }),
    );
    const map2 = await getRedirects(); // novo fetch
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(map2.get('/v2')).toBeDefined();
    expect(map2.get('/v1')).toBeUndefined();
  });
});
