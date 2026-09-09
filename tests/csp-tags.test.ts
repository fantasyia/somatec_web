import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// =============================================================================
// CSP × TAGS — a falha mais silenciosa do site.
//
// Em 08/09 o container GTM foi ligado (`seo_gtm_id` no banco) e ninguém pensou
// no CSP. O `gtm.js` passou a ser BLOQUEADO: o console dizia "violates Content
// Security Policy" e mais nada. Pior, a validação por requisição de rede
// parecia certa — o pedido chega a sair antes de o navegador recusar o script.
// Resultado: um dia inteiro de trabalho de tracking inerte, com dois relatórios
// dizendo "funcionando".
//
// O mesmo mecanismo derrubaria o Turnstile: o desafio monta em IFRAME, e sem
// `frame-src` o token nunca sai — e token vazio é 400 em TODO formulário.
//
// Esta guarda existe pra que "tag nova" e "liberar no CSP" andem juntas.
// =============================================================================

/**
 * Lê o CSP como ele SAI, chamando o `headers()` do próprio next.config — e não
 * lendo o texto do arquivo. Ler texto daria falso vermelho aqui (os valores são
 * template literals com `${...}`) e, pior, falso VERDE no dia em que alguém
 * montasse a diretiva de outro jeito.
 */
async function csp(): Promise<Record<string, string>> {
  const mod = await import(pathToFileURL(resolve(process.cwd(), 'next.config.js')).href);
  const config = (mod.default ?? mod) as {
    headers: () => Promise<{ headers: { key: string; value: string }[] }[]>;
  };
  const grupos = await config.headers();
  const valor = grupos
    .flatMap((g) => g.headers)
    .find((h) => h.key.toLowerCase() === 'content-security-policy')?.value;
  if (!valor) throw new Error('next.config não serve Content-Security-Policy');
  const mapa: Record<string, string> = {};
  for (const diretiva of valor.split(';')) {
    const limpa = diretiva.trim();
    if (limpa) mapa[limpa.split(' ')[0]] = limpa;
  }
  return mapa;
}

const D = await csp();

describe('CSP libera as tags que o site realmente carrega', () => {
  it('Google Tag Manager pode carregar — senão o container morre calado', () => {
    expect(D['script-src'], 'gtm.js seria bloqueado').toContain('googletagmanager.com');
  });

  it('GA4 consegue reportar (fetch e pixel de imagem)', () => {
    // Quando o fetch é bloqueado, o GA4 cai pro pixel 1x1 — os dois precisam passar.
    expect(D['connect-src']).toContain('google-analytics.com');
    expect(D['img-src']).toContain('google-analytics.com');
  });

  it('Meta Pixel pode carregar e reportar', () => {
    expect(D['script-src']).toContain('connect.facebook.net');
    expect(D['img-src']).toContain('facebook.com');
  });
});

describe('CSP não pode quebrar o Turnstile', () => {
  it('o script do desafio é permitido', () => {
    expect(D['script-src']).toContain('challenges.cloudflare.com');
  });

  it('o IFRAME do desafio é permitido — sem ele, token vazio e 400 em todo form', () => {
    expect(D['frame-src']).toContain('challenges.cloudflare.com');
  });

  it('a verificação server-side sai pelo connect-src', () => {
    expect(D['connect-src']).toContain('challenges.cloudflare.com');
  });

  it('os SUBDOMÍNIOS do desafio também passam', () => {
    // O desafio conversa com `hagen.challenges.cloudflare.com` e afins. Liberar
    // só o host principal deixa a chamada abortar e o token nunca sai.
    for (const nome of ['script-src', 'connect-src', 'frame-src']) {
      expect(D[nome], `${nome} não cobre subdomínio do desafio`).toContain(
        '*.challenges.cloudflare.com',
      );
    }
  });
});

describe('o CSP continua fechado onde importa', () => {
  it('não vira coringa', () => {
    for (const nome of ['script-src', 'connect-src', 'frame-src', 'img-src']) {
      expect(D[nome], `${nome} virou coringa`).not.toMatch(/\s\*(\s|$)/);
    }
  });

  it('o site não pode ser embutido em iframe de terceiro', () => {
    expect(D['frame-ancestors']).toContain("'none'");
  });

  it('formulário só posta pra origem própria', () => {
    expect(D['form-action']).toContain("'self'");
  });
});
