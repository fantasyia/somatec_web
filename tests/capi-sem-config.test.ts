import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// =============================================================================
// A CAPI DESLIGADA TEM QUE FAZER BARULHO — card de 24/09/2026.
//
// Até 24/09 o `META_CAPI_TOKEN` estava no Railway como string VAZIA. A primeira
// linha de `enviarEventoMeta` devolvia `sem-config` sem escrever nada, e o log
// só aparecia quando a Meta recusava ou a rede caía. Então "desligado" produzia
// o mesmo silêncio que "funcionando" — e foi lido como sucesso por mais de uma
// sessão, inclusive por mim, que cheguei a escrever num comentário do código que
// o arquivo "ESTAVA enviando em produção".
//
// O que este arquivo protege:
//   1. faltar config ESCREVE um aviso
//   2. o aviso diz QUAL variável e se ela está ausente ou VAZIA (foi o caso real)
//   3. o aviso sai UMA vez por processo, não a cada lead
//   4. o aviso NUNCA carrega o valor da variável — é um token de acesso
// =============================================================================

const avisos: Array<{ msg: string; ctx: Record<string, unknown> }> = [];

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: () => {},
    info: () => {},
    warn: (msg: string, ctx: Record<string, unknown> = {}) => avisos.push({ msg, ctx }),
    error: () => {},
  }),
}));
vi.mock('@/lib/redis', () => ({ getRedis: () => null }));

const { enviarEventoMeta, capiConfigurado, _reiniciarAvisoSemConfigParaTeste } = await import(
  '@/lib/meta/capi'
);

const ORIGINAL = { ...process.env };
const TOKEN_SECRETO = 'EAAsegredoQueNaoPodeVazarNoLog123';
const evento = { nome: 'Lead', eventId: 'e1', usuario: {} };
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  avisos.length = 0;
  _reiniciarAvisoSemConfigParaTeste();
  fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.unstubAllGlobals();
});

const avisosDeConfig = () => avisos.filter((a) => /CAPI DESLIGADA/.test(a.msg));

describe('🔴 faltar config faz barulho', () => {
  it('token VAZIO — o caso real de 24/09 — avisa e diz que está vazia', async () => {
    process.env.META_PIXEL_ID = '2632485547169632';
    process.env.META_CAPI_TOKEN = '';
    const r = await enviarEventoMeta(evento);
    expect(r).toEqual({ enviado: false, motivo: 'sem-config' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(avisosDeConfig()).toHaveLength(1);
    expect(avisosDeConfig()[0].ctx.META_CAPI_TOKEN).toBe('vazia');
    expect(avisosDeConfig()[0].ctx.META_PIXEL_ID).toBe('ok');
  });

  it('token AUSENTE diz ausente — é outra falha, e o aviso distingue', async () => {
    process.env.META_PIXEL_ID = '2632485547169632';
    delete process.env.META_CAPI_TOKEN;
    await enviarEventoMeta(evento);
    expect(avisosDeConfig()[0].ctx.META_CAPI_TOKEN).toBe('ausente');
  });

  it('token só com espaço conta como vazio — antes ia pra Meta e era recusado', async () => {
    process.env.META_PIXEL_ID = '2632485547169632';
    process.env.META_CAPI_TOKEN = '   ';
    await enviarEventoMeta(evento);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(avisosDeConfig()[0].ctx.META_CAPI_TOKEN).toBe('vazia');
  });

  it('pixel faltando também avisa', async () => {
    delete process.env.META_PIXEL_ID;
    process.env.META_CAPI_TOKEN = TOKEN_SECRETO;
    await enviarEventoMeta(evento);
    expect(avisosDeConfig()[0].ctx.META_PIXEL_ID).toBe('ausente');
  });
});

describe('uma vez por processo', () => {
  it('🔴 dez leads sem config = UM aviso, não dez', async () => {
    // Repetido a cada lead, o aviso vira ruído que ninguém lê mais — e aí volta
    // a ser o mesmo silêncio de antes, só que barulhento.
    process.env.META_PIXEL_ID = '2632485547169632';
    process.env.META_CAPI_TOKEN = '';
    for (let i = 0; i < 10; i++) await enviarEventoMeta(evento);
    expect(avisosDeConfig()).toHaveLength(1);
  });

  it('com config certa não avisa nada', async () => {
    process.env.META_PIXEL_ID = '2632485547169632';
    process.env.META_CAPI_TOKEN = TOKEN_SECRETO;
    await enviarEventoMeta(evento);
    expect(avisosDeConfig()).toHaveLength(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('🔒 o valor nunca vai pro log', () => {
  it('🔴 o aviso carrega o ESTADO da variável, jamais o conteúdo', async () => {
    // Pixel presente e token vazio: o aviso sai, e o pixel id (que não é
    // segredo, mas é o padrão a vigiar) aparece só como "ok".
    process.env.META_PIXEL_ID = '2632485547169632';
    process.env.META_CAPI_TOKEN = '';
    await enviarEventoMeta(evento);
    const tudo = JSON.stringify(avisos);
    expect(tudo).not.toContain('2632485547169632');
    // E com o token preenchido mas o pixel faltando, o token não pode aparecer.
    avisos.length = 0;
    _reiniciarAvisoSemConfigParaTeste();
    delete process.env.META_PIXEL_ID;
    process.env.META_CAPI_TOKEN = TOKEN_SECRETO;
    await enviarEventoMeta(evento);
    expect(JSON.stringify(avisos)).not.toContain(TOKEN_SECRETO);
    expect(avisosDeConfig()[0].ctx.META_CAPI_TOKEN).toBe('ok');
  });
});

describe('as duas funções concordam sobre "ligado"', () => {
  it.each([
    ['', 'token vazio'],
    ['   ', 'token só espaço'],
  ])('capiConfigurado é false com %p (%s)', (token) => {
    process.env.META_PIXEL_ID = '2632485547169632';
    process.env.META_CAPI_TOKEN = token;
    expect(capiConfigurado()).toBe(false);
  });

  it('capiConfigurado é true só com as duas preenchidas', () => {
    process.env.META_PIXEL_ID = '2632485547169632';
    process.env.META_CAPI_TOKEN = TOKEN_SECRETO;
    expect(capiConfigurado()).toBe(true);
  });
});

describe('o comentário do topo não afirma estado de produção', () => {
  it('🔴 a frase que mentia não volta', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const src = readFileSync(resolve(process.cwd(), 'src/lib/meta/capi.ts'), 'utf-8');
    // Ela só pode aparecer DENTRO da explicação de por que foi removida.
    const ocorrencias = src.match(/ESTÁ enviando em produção/g) ?? [];
    expect(ocorrencias.length).toBeLessThanOrEqual(1);
    expect(src).toMatch(/NÃO DIZ SE ESTÁ LIGADO EM PRODUÇÃO/);
  });
});
