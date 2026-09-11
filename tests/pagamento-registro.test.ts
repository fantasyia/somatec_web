import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// =============================================================================
// A FIAÇÃO do e-mail de pagamento — o que este arquivo protege é dinheiro e
// silêncio, nos dois sentidos.
//
// O e-mail ao cliente pendura num webhook de gateway, e webhook de gateway
// REENTREGA. Os três jeitos de isso dar errado:
//
//   1. mandar duas vezes  → reentrega do Asaas virando dois e-mails iguais
//   2. mandar cedo demais → no cartão, chega segundos depois do e-mail de
//      pedido; dois e-mails quase idênticos ensinam a pessoa a ignorar o
//      remetente logo antes da fase em que ela precisa abrir (o rastreio)
//   3. não mandar         → quem pagou por PIX meia hora depois fica sem sinal
//      nenhum, e isso vira mensagem no WhatsApp perguntando se o dinheiro caiu
//
// E um quarto, mais caro que os três: o e-mail falhar e derrubar o webhook.
// Nesse caso o Asaas reentrega, a chave de idempotência JÁ está gravada, a
// reentrega sai pelo 'repetido' — e o pagamento fica sem registro nenhum.
// =============================================================================

const redisSet = vi.fn();
const enviar = vi.fn();
const contato = vi.fn();

vi.mock('@/lib/redis', () => ({
  getRedis: () => ({ set: (...a: unknown[]) => redisSet(...a) }),
}));

vi.mock('@/lib/email/enviar', () => ({
  enviarEmail: (...a: unknown[]) => enviar(...a),
}));

vi.mock('@/lib/pedidos/servidor', () => ({
  contatoDoPedido: (...a: unknown[]) => contato(...a),
  // Este arquivo cuida do E-MAIL. `consultarPedido` é o que alimenta o
  // `purchase` do GA4 — devolvendo undefined, aquele caminho sai cedo e não
  // entra no meio das asserções daqui. O GA4 tem arquivo próprio
  // (`ga4-purchase.test.ts`).
  //
  // ⚠️ Precisa estar no mock mesmo assim: sem a chave, a chamada estoura, o
  // `.catch` do registro engole, e os testes continuariam verdes com o caminho
  // do GA4 quebrado.
  consultarPedido: () => undefined,
}));

/** O que o código registrou, com o NÍVEL — é o nível que separa as issues. */
const logs: Array<{ nivel: string; msg: string }> = [];

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: () => {},
    info: (msg: string) => logs.push({ nivel: 'info', msg }),
    warn: (msg: string) => logs.push({ nivel: 'warn', msg }),
    error: (msg: string) => logs.push({ nivel: 'error', msg }),
    child: () => ({ debug: () => {}, info: () => {}, warn: () => {}, error: () => {} }),
  }),
}));

const { registrarEventoPagamento } = await import('@/lib/pagamento/registro');

const ORIGINAL = { ...process.env };

/** Um pedido nascido há `min` minutos. */
const criadoHa = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

const evento = (extra: Record<string, unknown> = {}) => ({
  eventoId: 'evt_1',
  evento: 'PAYMENT_RECEIVED',
  numeroPedido: 'SB0001',
  cobrancaId: 'pay_1',
  situacao: 'pago' as const,
  valorCentavos: 435000,
  ...extra,
});

/** O e-mail que foi pro comprador (o outro é o aviso interno da operação). */
const paraCliente = () =>
  enviar.mock.calls.map((c) => c[0] as { para: string; assunto: string; html: string }).find((a) =>
    a.para.includes('cliente@'),
  );

beforeEach(() => {
  logs.length = 0;
  process.env.PAGAMENTO_ALERTA_EMAIL = 'operacao@somatecblocking.com.br';
  redisSet.mockResolvedValue('OK'); // primeiro a gravar = evento novo
  enviar.mockResolvedValue({ enviado: true, id: 'x' });
  contato.mockResolvedValue({
    email: 'cliente@empresa.com.br',
    primeiroNome: 'João',
    criadoEm: criadoHa(60),
    formaPagamento: 'PIX',
  });
});

afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.clearAllMocks();
});

describe('avisa quem pagou', () => {
  it('PIX pago uma hora depois: o cliente recebe, com valor e número', async () => {
    await registrarEventoPagamento(evento());

    const email = paraCliente();
    expect(email).toBeDefined();
    expect(email!.assunto).toContain('SB0001');
    expect(email!.html).toContain('4.350,00');
    expect(email!.html).toContain('João');
  });

  it('não promete despacho — o pedido ainda está "recebido"', async () => {
    await registrarEventoPagamento(evento());
    const html = paraCliente()!.html.toLowerCase();
    for (const proibido of ['a caminho', 'enviado', 'despachado', 'saiu para entrega']) {
      expect(html).not.toContain(proibido);
    }
  });

  it('o aviso interno continua saindo, e para outro destino', async () => {
    await registrarEventoPagamento(evento());
    const destinos = enviar.mock.calls.map((c) => (c[0] as { para: string }).para);
    expect(destinos).toContain('operacao@somatecblocking.com.br');
    expect(destinos).toContain('cliente@empresa.com.br');
  });
});

describe('cala quando calar é o certo', () => {
  it('cartão: confirmado 2 min depois do pedido → cliente NÃO recebe de novo', async () => {
    contato.mockResolvedValue({
      email: 'cliente@empresa.com.br',
      primeiroNome: 'João',
      criadoEm: criadoHa(2),
      formaPagamento: 'Cartão de crédito',
    });

    await registrarEventoPagamento(evento());

    expect(paraCliente()).toBeUndefined();
    // mas a operação continua sabendo que o dinheiro entrou
    expect(enviar).toHaveBeenCalledTimes(1);
  });

  it('pagamento NÃO concluído nunca vira e-mail pro cliente', async () => {
    await registrarEventoPagamento(evento({ situacao: 'nao_pago' as const }));

    expect(paraCliente()).toBeUndefined();
    expect(contato).not.toHaveBeenCalled();
  });

  it('reentrega do gateway não manda nada — a idempotência vem antes', async () => {
    redisSet.mockResolvedValue(null); // NX falhou: alguém já gravou

    const efeito = await registrarEventoPagamento(evento());

    expect(efeito).toBe('repetido');
    expect(enviar).not.toHaveBeenCalled();
  });
});

describe('nada disso pode derrubar o webhook', () => {
  it('e-mail ao cliente estourando ainda devolve "registrado"', async () => {
    enviar.mockImplementation(async (args: { para: string }) => {
      if (args.para.includes('cliente@')) throw new Error('resend fora do ar');
      return { enviado: true, id: 'x' };
    });

    await expect(registrarEventoPagamento(evento())).resolves.toBe('registrado');
  });

  it('sem contato do pedido: não manda, não quebra — e o interno sai', async () => {
    contato.mockResolvedValue(undefined);

    await expect(registrarEventoPagamento(evento())).resolves.toBe('registrado');
    expect(paraCliente()).toBeUndefined();
    expect(enviar).toHaveBeenCalledTimes(1);
  });
});

describe('venda parcelada', () => {
  const parcelado = {
    eventoId: 'evt_parcela_1',
    evento: 'PAYMENT_CONFIRMED',
    numeroPedido: 'SB-PARC',
    cobrancaId: 'pay_1',
    situacao: 'pago' as const,
    valorCentavos: 725_00,
    parcelamento: { id: 'parc_abc', totalCentavos: 4_350_00, parcelas: 6 },
  };

  it('avisa UMA vez por venda, não uma por parcela', async () => {
    // Pagar em 6x confirma as seis parcelas de uma vez e o Asaas manda seis
    // eventos, cada um com id próprio. Casando por evento, o operador recebia
    // seis e-mails de "pagamento confirmado" pela mesma venda.
    redisSet.mockResolvedValueOnce('OK').mockResolvedValueOnce(null);

    expect(await registrarEventoPagamento(parcelado)).toBe('registrado');
    expect(await registrarEventoPagamento({ ...parcelado, eventoId: 'evt_parcela_2' })).toBe(
      'repetido',
    );

    // A chave é do PARCELAMENTO, não do evento — é isso que junta as seis.
    expect(String(redisSet.mock.calls[0][0])).toContain('parc_abc');
  });

  it('o aviso mostra o TOTAL da venda, não o valor da parcela', async () => {
    // "R$ 725,00 confirmados" num pedido de R$ 4.350 faz quem separa achar que
    // entrou menos do que entrou.
    redisSet.mockResolvedValueOnce('OK');

    await registrarEventoPagamento(parcelado);

    // calls[0] é o aviso INTERNO (quem separa e fatura); o do cliente vem depois.
    const interno = enviar.mock.calls[0]?.[0] as { assunto: string; html: string };
    expect(interno.assunto).toContain('4.350,00');
    expect(interno.html).toContain('6x');

    // E o cliente recebe o total da compra, não a parcela.
    const doCliente = enviar.mock.calls.at(-1)?.[0] as { html: string; texto: string };
    expect(`${doCliente.html}${doCliente.texto}`).toContain('4.350,00');
  });

  it('estorno depois do pagamento ainda avisa — a situação faz parte da chave', async () => {
    redisSet.mockResolvedValue('OK');

    await registrarEventoPagamento(parcelado);
    await registrarEventoPagamento({
      ...parcelado,
      evento: 'PAYMENT_REFUNDED',
      situacao: 'nao_pago',
    });

    const chaves = redisSet.mock.calls.map((c) => String(c[0]));
    expect(new Set(chaves).size).toBe(chaves.length);
  });
});

describe('os três silêncios são distinguíveis — senão o grave se esconde no ruído', () => {
  // O Sentry agrupa por MENSAGEM. Enquanto os três motivos de não sair e-mail
  // dividiam a mesma frase, viravam a MESMA issue — e como webhook de teste com
  // número inventado acontece às dezenas, o dia em que um cliente real pagasse
  // sem e-mail no cadastro, o evento dele cairia numa issue já descartada.
  //
  // Achado na primeira triagem do Sentry (SOMATEC-WEB-4, 09/09: 5 eventos, todos
  // `SB-TESTE-PARC-C`). Estes testes travam a distinção.

  const frases = () =>
    logs.map((l) => `${l.nivel}:${l.msg}`);

  it('pedido que não existe aqui é WARN — não há ninguém sem resposta', async () => {
    contato.mockResolvedValue(undefined);

    await registrarEventoPagamento(evento({ numeroPedido: 'SB-TESTE-PARC-C' }));

    expect(frases().some((f) => f.startsWith('warn:') && f.includes('nao existe aqui'))).toBe(true);
    expect(frases().some((f) => f.startsWith('error:'))).toBe(false);
  });

  it('🔴 pedido que EXISTE e está sem e-mail é ERROR — alguém pagou e não recebe nada', async () => {
    contato.mockResolvedValue({
      email: null,
      primeiroNome: 'João',
      criadoEm: criadoHa(60),
      formaPagamento: 'PIX',
    });

    await registrarEventoPagamento(evento());

    expect(frases().some((f) => f.startsWith('error:') && f.includes('sem e-mail'))).toBe(true);
    expect(paraCliente()).toBeUndefined();
  });

  it('as duas mensagens são DIFERENTES — é isso que separa as issues no Sentry', async () => {
    contato.mockResolvedValue(undefined);
    await registrarEventoPagamento(evento());
    const semPedido = logs.find((l) => l.nivel !== 'info')?.msg;

    logs.length = 0;
    contato.mockResolvedValue({
      email: null,
      primeiroNome: null,
      criadoEm: criadoHa(60),
      formaPagamento: null,
    });
    await registrarEventoPagamento(evento({ eventoId: 'evt_2' }));
    const semEmail = logs.find((l) => l.nivel !== 'info')?.msg;

    expect(semPedido).toBeTruthy();
    expect(semEmail).toBeTruthy();
    expect(semPedido).not.toBe(semEmail);
  });

  it('dentro da janela de silêncio, e-mail faltando NÃO vira erro — não íamos mandar', async () => {
    contato.mockResolvedValue({
      email: null,
      primeiroNome: 'João',
      criadoEm: criadoHa(2), // cartão: confirmou logo depois do pedido
      formaPagamento: 'Cartão de crédito',
    });

    await registrarEventoPagamento(evento());

    expect(frases().some((f) => f.startsWith('error:'))).toBe(false);
  });
});
