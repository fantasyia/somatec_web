import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { enviarLeadOrcamento, type LeadOrcamento } from '@/lib/forms/enviar-lead-orcamento';

const { getAtribuicaoMock } = vi.hoisted(() => ({ getAtribuicaoMock: vi.fn() }));
vi.mock('@/lib/attribution', () => ({ getAtribuicao: getAtribuicaoMock }));

/** Lead mínimo: só o que os dois wizards sempre mandam. Cada teste sobrescreve
 *  o campo que está sob análise. */
function lead(over: Partial<LeadOrcamento> = {}): LeadOrcamento {
  return {
    formulario: 'orcamento-industrial',
    nome: 'Fulano',
    email: 'fulano@empresa.com.br',
    whatsapp: '+5511999999999',
    empresa: 'Empresa X',
    segmento: 'Industrial · locação',
    resumo: '3 quadros, 220V',
    sourcePage: '/orcamento-industrial',
    lgpdConsent: true,
    honeypot: null,
    captchaToken: 'tk',
    ...over,
  };
}

let fetchSpy: ReturnType<typeof vi.fn>;

function respondeCom(status: number, body: unknown): void {
  fetchSpy.mockResolvedValue({
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as unknown as Response);
}

/** O corpo que foi realmente enviado ao /api/forms/submit. */
function corpoEnviado(): Record<string, unknown> {
  return JSON.parse((fetchSpy.mock.calls[0]?.[1] as RequestInit).body as string);
}

beforeEach(() => {
  fetchSpy = vi.fn();
  vi.stubGlobal('fetch', fetchSpy);
  getAtribuicaoMock.mockReturnValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('enviarLeadOrcamento — sucesso', () => {
  it('devolve ok quando a API aceita', async () => {
    respondeCom(200, { ok: true });
    await expect(enviarLeadOrcamento(lead())).resolves.toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalledWith('/api/forms/submit', expect.objectContaining({ method: 'POST' }));
  });

  it('manda o formulario que converteu — é o que roteia no Betinna', async () => {
    respondeCom(200, { ok: true });
    await enviarLeadOrcamento(lead({ formulario: 'custo-de-parada' }));
    expect(corpoEnviado()).toMatchObject({
      formulario: 'custo-de-parada',
      form_type: 'b2b',
      interest_type: 'b2b',
      segment: 'Industrial · locação',
      message: '3 quadros, 220V',
    });
  });
});

describe('enviarLeadOrcamento — campos opcionais', () => {
  it('inclui publico só quando o wizard sabe o público', async () => {
    respondeCom(200, { ok: true });
    await enviarLeadOrcamento(lead({ publico: 'residencia' }));
    expect(corpoEnviado().publico).toBe('residencia');
  });

  it('omite publico quando o wizard não passa', async () => {
    respondeCom(200, { ok: true });
    await enviarLeadOrcamento(lead());
    expect(corpoEnviado()).not.toHaveProperty('publico');
  });

  it('inclui atribuicao quando existe cookie de UTM', async () => {
    const atribuicao = {
      primeiro: { utm_source: 'google' },
      ultimo: { utm_source: 'meta' },
    };
    getAtribuicaoMock.mockReturnValue(atribuicao);
    respondeCom(200, { ok: true });
    await enviarLeadOrcamento(lead());
    expect(corpoEnviado().atribuicao).toEqual(atribuicao);
  });

  it('omite atribuicao quando não há cookie', async () => {
    respondeCom(200, { ok: true });
    await enviarLeadOrcamento(lead());
    expect(corpoEnviado()).not.toHaveProperty('atribuicao');
  });

  it('manda string vazia (não null) em empresa e honeypot ausentes', async () => {
    respondeCom(200, { ok: true });
    await enviarLeadOrcamento(lead({ empresa: null, honeypot: null }));
    expect(corpoEnviado()).toMatchObject({ company: '', website: '' });
  });

  it('repassa o honeypot preenchido — quem decide se é bot é o servidor', async () => {
    respondeCom(200, { ok: true });
    await enviarLeadOrcamento(lead({ honeypot: 'preenchido-por-bot' }));
    expect(corpoEnviado().website).toBe('preenchido-por-bot');
  });
});

describe('enviarLeadOrcamento — falha', () => {
  it('repassa a mensagem da API quando ela recusa', async () => {
    respondeCom(200, { ok: false, message: 'Captcha inválido.' });
    await expect(enviarLeadOrcamento(lead())).resolves.toEqual({
      ok: false,
      mensagem: 'Captcha inválido.',
    });
  });

  it('usa mensagem padrão quando a API recusa sem explicar', async () => {
    respondeCom(200, { ok: false });
    const r = await enviarLeadOrcamento(lead());
    expect(r).toEqual({ ok: false, mensagem: 'Não foi possível enviar agora. Tente novamente.' });
  });

  it('trata HTTP 500 como falha mesmo com ok:true no corpo', async () => {
    respondeCom(500, { ok: true });
    const r = await enviarLeadOrcamento(lead());
    expect(r.ok).toBe(false);
  });

  it('não estoura quando a rede cai', async () => {
    fetchSpy.mockRejectedValue(new Error('network down'));
    await expect(enviarLeadOrcamento(lead())).resolves.toEqual({
      ok: false,
      mensagem: 'Não foi possível enviar agora. Tente novamente em instantes.',
    });
  });

  it('não estoura quando a resposta não é JSON', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error('Unexpected token < in JSON');
      },
    } as unknown as Response);
    const r = await enviarLeadOrcamento(lead());
    expect(r.ok).toBe(false);
  });
});
