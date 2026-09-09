import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// =============================================================================
// O QUE ESTE ARQUIVO PROTEGE: o alarme de "cliente pagou e não foi avisado".
//
// SOMATEC-WEB-4 (09/09): o webhook recebeu 5 eventos com
// `externalReference: "SB-TESTE-PARC-C"` — número sintético de teste, que não
// existe e não PODE existir (não bate o `PADRAO_NUMERO`). O evento seguia até
// `avisarCliente`, que não achava contato e registrava `log.error` — e todo
// `log.error` vai pro Sentry.
//
// O estrago não é o ruído em si: é que aquele `log.error` existe pra UM caso
// grave — pedido de verdade, número válido, e mesmo assim sem contato (a linha
// sumiu da tabela, ou a chave perdeu poder de leitura). Um pagamento real sem
// aviso é a pessoa que pagou e ficou no silêncio. Se o mesmo alarme dispara
// pra disparo de teste, ele deixa de significar alguma coisa.
//
// Então a separação é feita ANTES, aqui na porta: referência que não é pedido
// nosso não entra. E — o outro lado, igualmente importante — pedido de verdade
// TEM que entrar. Um filtro largo demais aqui engoliria pagamento em silêncio,
// que é pior do que o ruído que ele veio consertar.
// =============================================================================

const registrar = vi.fn();
vi.mock('@/lib/pagamento/registro', () => ({
  registrarEventoPagamento: (...a: unknown[]) => registrar(...a),
}));

const { POST } = await import('@/app/api/webhooks/asaas/route');

const TOKEN = 'token-secreto-do-webhook';

function chamar(corpo: unknown, token: string | null = TOKEN): Promise<Response> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (token !== null) headers['asaas-access-token'] = token;
  return POST(
    new NextRequest('http://localhost:3000/api/webhooks/asaas', {
      method: 'POST',
      headers,
      body: JSON.stringify(corpo),
    }),
  ) as unknown as Promise<Response>;
}

const pagamentoDe = (referencia: string | null) => ({
  id: 'evt_1',
  event: 'PAYMENT_RECEIVED',
  payment: { id: 'pay_1', externalReference: referencia, value: 4350, status: 'RECEIVED' },
});

beforeEach(() => {
  registrar.mockReset().mockResolvedValue('registrado');
  vi.stubEnv('ASAAS_WEBHOOK_TOKEN', TOKEN);
});

afterEach(() => vi.unstubAllEnvs());

describe('POST /api/webhooks/asaas — referência que não é pedido nosso', () => {
  it.each([
    ['disparo de teste', 'SB-TESTE-PARC-C'],
    ['referência de outro sistema', 'PEDIDO-123'],
    ['string vazia', ''],
  ])('ignora %s sem registrar pagamento', async (_, referencia) => {
    const res = await chamar(pagamentoDe(referencia));

    expect(res.status).toBe(200); // 200 sempre: erro pendura a fila do Asaas
    expect(await res.json()).toMatchObject({ ok: true, efeito: 'ignorado' });
    // O ponto: não entra no registro, então não chega em `avisarCliente` e não
    // vira `log.error` → não vira issue no Sentry.
    expect(registrar).not.toHaveBeenCalled();
  });
});

describe('POST /api/webhooks/asaas — pedido de verdade continua passando', () => {
  it('registra o pagamento de um número válido', async () => {
    // SB2609ZHX5FD é a forma real: SB + 4 dígitos + 6 do alfabeto sem I L O U 0 1.
    const res = await chamar(pagamentoDe('SB2609ZHX5FD'));

    expect(res.status).toBe(200);
    expect(registrar).toHaveBeenCalledTimes(1);
    expect(registrar.mock.calls[0][0]).toMatchObject({
      numeroPedido: 'SB2609ZHX5FD',
      situacao: 'pago',
      valorCentavos: 435000,
    });
  });

  it('aceita o número como o cliente digita — minúsculo e com hífen', async () => {
    // `normalizarNumero` já resolve isso lá dentro; a guarda não pode ser mais
    // exigente que ele, senão recusa pagamento por causa de formatação.
    const res = await chamar(pagamentoDe('sb2609-zhx5fd'));

    expect(res.status).toBe(200);
    expect(registrar).toHaveBeenCalledTimes(1);
  });

  it('cancelamento de pedido válido também passa', async () => {
    const res = await chamar({
      ...pagamentoDe('SB2609ZHX5FD'),
      event: 'PAYMENT_REFUNDED',
    });

    expect(res.status).toBe(200);
    expect(registrar.mock.calls[0][0]).toMatchObject({ situacao: 'nao_pago' });
  });
});

describe('POST /api/webhooks/asaas — o que já era assim continua', () => {
  it('recusa quem não traz o token', async () => {
    const res = await chamar(pagamentoDe('SB2609ZHX5FD'), null);
    expect(res.status).toBe(401);
    expect(registrar).not.toHaveBeenCalled();
  });

  it('evento sem efeito no pedido é ignorado', async () => {
    const res = await chamar({ id: 'evt_2', event: 'PAYMENT_CREATED', payment: { id: 'pay_2' } });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ efeito: 'ignorado' });
    expect(registrar).not.toHaveBeenCalled();
  });
});
