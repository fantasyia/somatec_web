import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// =============================================================================
// O `event_id` DO LEAD — o que impede a mesma pessoa de contar como duas.
//
// Todo lead é disparado DUAS vezes de propósito: o navegador empurra
// `generate_lead` (que o GTM leva ao Pixel) e o servidor manda `Lead` pelo
// CAPI, porque o navegador é frágil — bloqueador, ITP do iOS, aba fechada.
// Quem amarra os dois num evento só é o `event_id` idêntico.
//
// Quando ele NÃO viaja, o servidor cai no fallback e sorteia outro. Aí não
// existe erro em lugar nenhum: os dois eventos chegam, os dois são válidos, e
// a Meta simplesmente entende que foram dois leads. O CPL do relatório vira
// metade do real, e a campanha é otimizada com base nisso.
//
// ⚠️ Foi exatamente o que acontecia até 18/09 em DOIS caminhos — a calculadora
// industrial e o orçamento do checkout —, porque os dois mandam o lead pelo
// `enviarLeadOrcamento`, e o `enviarLeadOrcamento` não repassava o campo.
// Ficou invisível porque os outros três formulários fazem `fetch` próprio e
// sempre mandaram certo: quem grepasse `event_id` achava, e concluía errado.
//
// ⛔ Só o `checkout-ni-abandono` sai sem id de propósito: ele nasce no
// `pagehide`, não existe disparo de navegador nenhum pra parear, e ali o
// servidor gerar o id é o certo.
// =============================================================================

const fetchMock = vi.fn();

vi.mock('@/lib/attribution', () => ({ getAtribuicao: () => null }));

const { enviarLeadOrcamento } = await import('@/lib/forms/enviar-lead-orcamento');

const fonte = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf-8');
const semComentarios = (s: string) =>
  s
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n');

const corpo = () => JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);

const base = {
  formulario: 'orcamento-industrial' as const,
  nome: 'Marina',
  email: 'marina@exemplo.com.br',
  whatsapp: '11988887777',
  empresa: 'Exemplo',
  segmento: 'Industrial · locação',
  resumo: 'resumo',
  sourcePage: '/protecao-industrial',
  lgpdConsent: true,
  honeypot: '',
  captchaToken: 'tok',
};

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  vi.stubGlobal('fetch', fetchMock);
});

describe('o caminho compartilhado repassa o id', () => {
  it('🔴 o event_id do navegador chega no payload do servidor', async () => {
    await enviarLeadOrcamento({ ...base, eventId: 'id-do-navegador' });
    expect(corpo().event_id).toBe('id-do-navegador');
  });

  it('sem id, o campo nem vai — o servidor sabe gerar, string vazia ele aceitaria', async () => {
    // Mandar `event_id: undefined` some no JSON, mas `''` passaria pelo schema
    // (`z.string().max(64).optional()`) e viraria um id vazio compartilhado por
    // TODOS os leads sem id — que é pior que não mandar: a Meta colapsaria
    // leads de pessoas diferentes num evento só.
    await enviarLeadOrcamento(base);
    expect('event_id' in corpo()).toBe(false);
  });

  it('id vazio é tratado como ausência, não como id', async () => {
    await enviarLeadOrcamento({ ...base, eventId: '' });
    expect('event_id' in corpo()).toBe(false);
  });
});

describe('🔴 os dois caminhos que duplicavam', () => {
  it('a calculadora industrial usa o MESMO id nos dois disparos', () => {
    const src = semComentarios(fonte('src/components/tools/OrcamentoIndustrial.tsx'));
    // Um id só, gerado antes do envio, usado no payload E no evento do
    // navegador. Se alguém gerar um segundo `novoEventId()` aqui, os dois
    // disparos voltam a divergir sem nada quebrar.
    expect(src.match(/novoEventId\(\)/g)?.length ?? 0).toBe(1);
    expect(src).toMatch(/enviarLeadOrcamento\(\{[\s\S]*?\beventId,/);
    expect(src).toMatch(/rastrearLead\(\{[^}]*eventId[^}]*\}\)/);
  });

  it('o orçamento do checkout manda o id do lead que ele já tinha', () => {
    const src = semComentarios(fonte('src/components/tools/CheckoutNI.tsx'));
    expect(src).toMatch(/formulario: 'checkout-ni-orcamento',\s*eventId: eventIdLead,/);
  });

  it('⛔ o abandono continua SEM id — ele não tem par no navegador', () => {
    const src = semComentarios(fonte('src/components/tools/CheckoutNI.tsx'));
    const trecho = src.slice(src.indexOf("formulario: 'checkout-ni-abandono'"));
    expect(trecho.slice(0, 400)).not.toContain('eventId');
  });
});

describe('quem faz fetch próprio continua mandando', () => {
  it.each([
    ['src/components/forms/ContactForm.tsx'],
    ['src/components/forms/RepresentanteForm.tsx'],
    ['src/components/tools/CostCalculator.tsx'],
  ])('%s', (arquivo) => {
    expect(semComentarios(fonte(arquivo))).toContain('event_id: eventId');
  });
});

describe('a ponta do servidor', () => {
  it('o schema aceita o campo — sem isso o payload seria descartado calado', () => {
    expect(semComentarios(fonte('src/lib/forms/schemas.ts'))).toMatch(/event_id: z\.string\(\)/);
  });

  it('🔴 o CAPI usa o id recebido, e só sorteia quando não veio', () => {
    const src = semComentarios(fonte('src/app/api/forms/submit/route.ts'));
    expect(src).toMatch(/eventId: parsed\.data\.event_id \?\? randomUUID\(\)/);
  });
});
