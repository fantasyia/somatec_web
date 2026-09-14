import { describe, it, expect, vi } from 'vitest';

// =============================================================================
// O APEX SERVIA O SITE INTEIRO, COM 200.
//
// Medido em produção em 13/09:
//
//   https://somatecblocking.com.br/          → 200 (281.065 bytes, mesmo HTML)
//   https://somatecblocking.com.br/produtos  → 200
//   http://somatecblocking.com.br/           → 301 pro HTTPS do PRÓPRIO apex
//
// Duas origens rastreáveis com o mesmo conteúdo. O canonical apontava pro www
// nas duas — mas canonical é dica, 301 é diretiva: link externo pro apex não
// consolidava, e o Google podia escolher o apex em parte das URLs.
//
// ⚠️ A parte que este teste protege de verdade é o ESCOPO: o redirect vale só
// pro apex de produção. Se ele pegar localhost ou o host do Railway, derruba o
// desenvolvimento e a verificação de deploy pelo host interno.
// =============================================================================

vi.mock('@/lib/supabase/middleware', () => ({
  updateSession: async () => ({ __passouDireto: true }),
}));
vi.mock('@/lib/redirects/cache', () => ({
  getRedirects: async () => new Map(),
}));

const { proxy } = await import('@/proxy');

function req(url: string, host: string) {
  // NextRequest é um Request com extras; o proxy usa `headers.get('host')`,
  // `request.url` e `request.nextUrl`.
  const r = new Request(url, { headers: { host } }) as unknown as {
    url: string;
    headers: Headers;
    nextUrl: URL;
  };
  r.nextUrl = new URL(url);
  return r as never;
}

describe('apex vai pro www com 301', () => {
  it('apex redireciona, preservando caminho e query', async () => {
    const res = await proxy(
      req('https://somatecblocking.com.br/produtos?utm_source=x', 'somatecblocking.com.br'),
    );
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe(
      'https://www.somatecblocking.com.br/produtos?utm_source=x',
    );
  });

  it('a raiz do apex também', async () => {
    const res = await proxy(req('https://somatecblocking.com.br/', 'somatecblocking.com.br'));
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('https://www.somatecblocking.com.br/');
  });

  it('host com porta ainda é reconhecido como apex', async () => {
    const res = await proxy(req('https://somatecblocking.com.br/faq', 'somatecblocking.com.br:443'));
    expect(res.status).toBe(301);
  });
});

describe('⛔ o redirect NÃO pega quem não é o apex de produção', () => {
  it.each([
    ['www (o destino — redirecionar seria laço)', 'https://www.somatecblocking.com.br/produtos', 'www.somatecblocking.com.br'],
    ['localhost do dev', 'http://localhost:3000/produtos', 'localhost:3000'],
    ['host interno do Railway', 'https://api-production-29e1f.up.railway.app/produtos', 'api-production-29e1f.up.railway.app'],
  ])('%s passa direto', async (_nome, url, host) => {
    const res = (await proxy(req(url, host))) as unknown as { __passouDireto?: boolean };
    expect(res.__passouDireto, 'deveria seguir pro updateSession, sem redirect').toBe(true);
  });
});
