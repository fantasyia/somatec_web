import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendToBetinna } from '@/lib/betinna/client';
import type { MullerBotPayload } from '@/lib/mullerbot/payload';

// =============================================================================
// O NOME DA PESSOA no lead.
//
// O Betinna guarda DOIS nomes, independentes: `nome` é o título do lead (o
// "negócio") e `contatoNome` é o nome da PESSOA. O site mandava só o primeiro,
// então `contatoNome` nascia vazio em todo lead do checkout.
//
// Isso não é campo decorativo: `contatoNome` é o que o bot usa pra saudar.
// Vazio, a saudação cai no genérico — quem comprou pelo site e digitou o
// próprio nome nunca era chamado por ele.
//
// O site é quem manda porque é o site que SABE que aquilo é nome de gente: o
// formulário pediu "Seu nome". Deixar o Betinna adivinhar seria magia
// implícita, e é assim que nasce "Olá Electro." saudando uma razão social.
// =============================================================================

function payload(over: Partial<MullerBotPayload> = {}): MullerBotPayload {
  return {
    form_type: 'b2b',
    name: 'Marcelo Harada',
    email: 'marcelo@exemplo.test',
    whatsapp: '11999999999',
    interest_type: 'b2b',
    company: 'Indústria Exemplo Ltda',
    city: null,
    state: null,
    message: 'resumo do wizard',
    extra_fields: {},
    source_page: '/protecao-residencial',
    lgpd_consent: {
      accepted: true,
      timestamp: '2026-08-31T04:00:00.000Z',
      ip: '1.2.3.4',
      text_version: 'v1.0',
      text_hash: 'abc',
    },
    captcha_token: 'tok',
    captcha_unverified: false,
    site_metadata: { user_agent: 'teste', referer: null, submitted_at: '2026-08-31T04:00:00.000Z' },
    ...over,
  } as MullerBotPayload;
}

/** Roda o envio de verdade com fetch mockado e devolve o corpo enviado. */
async function corpoEnviado(p: MullerBotPayload): Promise<Record<string, unknown>> {
  const espiao = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
  await sendToBetinna(p);
  // A ÚLTIMA chamada, não a primeira: dentro de um laço o espião acumula, e
  // ler `calls[0]` faria a 2ª iteração conferir o corpo da 1ª — passando ou
  // falhando pelo motivo errado.
  const init = espiao.mock.calls.at(-1)?.[1] as RequestInit | undefined;
  return JSON.parse(String(init?.body ?? '{}'));
}

beforeEach(() => {
  vi.stubEnv('BETINNA_LEADS_URL', 'https://betinna.example/public/leads');
  vi.stubEnv('BETINNA_API_KEY', 'chave');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('contatoNome vai junto', () => {
  it('o nome da pessoa viaja em contatoNome, não só em nome', async () => {
    const corpo = await corpoEnviado(payload());
    expect(corpo.contatoNome).toBe('Marcelo Harada');
  });

  it('os DOIS campos vão — um não substitui o outro', async () => {
    // `nome` é o título do lead e `contatoNome` é a pessoa. Trocar um pelo
    // outro quebraria a listagem do CRM ou a saudação do bot.
    const corpo = await corpoEnviado(payload());
    expect(corpo.nome).toBe('Marcelo Harada');
    expect(corpo.contatoNome).toBe('Marcelo Harada');
  });

  it('a EMPRESA não vaza pro contatoNome — é o que produz "Olá Electro."', async () => {
    const corpo = await corpoEnviado(payload({ company: 'Electro Componentes S.A.' }));
    expect(corpo.contatoNome).not.toBe('Electro Componentes S.A.');
    expect(corpo.empresa).toBe('Electro Componentes S.A.');
  });

  it('vale pro lead do PEDIDO e pro de ABANDONO', async () => {
    for (const formulario of ['checkout-ni-pedido', 'checkout-ni-abandono'] as const) {
      const corpo = await corpoEnviado(payload({ formulario } as Partial<MullerBotPayload>));
      expect(corpo.contatoNome, formulario).toBe('Marcelo Harada');
      expect(corpo.formulario, formulario).toBe(formulario);
    }
  });

  it('nome vazio não vira string vazia — o campo é omitido', async () => {
    // Mandar "" faria o CRM guardar um nome em branco, que é pior que ausente:
    // o bot leria como nome válido e saudaria com nada.
    const corpo = await corpoEnviado(payload({ name: '   ' }));
    expect(corpo.contatoNome).toBeUndefined();
  });
});
