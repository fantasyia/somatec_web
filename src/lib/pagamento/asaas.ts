import { createLogger } from '@/lib/logger';

const log = createLogger('asaas');

// =============================================================================
// Asaas — cobrança do checkout do site.
//
// MODELO ESCOLHIDO: checkout HOSPEDADO. O site cria a cobrança e manda o cliente
// pra página de pagamento do Asaas (`invoiceUrl`). Dado de cartão nunca passa
// pelo nosso servidor — o que tira o site inteiro do escopo de PCI-DSS. A
// alternativa (cartão digitado aqui dentro) fica mais bonita e muda o patamar de
// responsabilidade: só vale quando o volume justificar a auditoria.
//
// Sandbox e produção diferem em DUAS coisas, e as duas vivem em env:
//   ASAAS_BASE_URL  — https://api-sandbox.asaas.com/v3  |  https://api.asaas.com/v3
//   ASAAS_API_KEY   — $aact_hmlg_… (homologação)        |  $aact_prod_…
// A chave de sandbox não funciona em produção e vice-versa: não existe "virar
// uma flag" sem trocar as duas.
// =============================================================================

/** Formas aceitas. Boleto NÃO entra — decisão do Léo: só PIX e cartão. */
export type FormaAsaas = 'PIX' | 'CREDIT_CARD';

export type CobrancaCriada = {
  id: string;
  /** Página de pagamento hospedada — é pra cá que o cliente vai. */
  url: string;
  status: string;
};

type Cliente = {
  nome: string;
  email: string;
  cpfCnpj: string;
  telefone?: string | null;
  /** Só pra cadastro do cliente no Asaas; a cobrança não usa. */
  cep?: string | null;
};

function config(): { base: string; key: string } | null {
  const base = (process.env.ASAAS_BASE_URL ?? '').replace(/\/+$/, '');
  const key = process.env.ASAAS_API_KEY ?? '';
  if (!base || !key) return null;
  return { base, key };
}

/** `true` quando dá pra cobrar de verdade — o checkout usa pra decidir o texto. */
export function asaasConfigurado(): boolean {
  return config() !== null;
}

async function chamar<T>(
  caminho: string,
  init: { method: 'GET' | 'POST'; body?: unknown } = { method: 'GET' },
): Promise<T> {
  const cfg = config();
  if (!cfg) throw new Error('Asaas não configurado (ASAAS_BASE_URL / ASAAS_API_KEY)');
  const r = await fetch(`${cfg.base}${caminho}`, {
    method: init.method,
    headers: {
      access_token: cfg.key,
      'Content-Type': 'application/json',
      // O Asaas exige User-Agent identificável; sem ele, chamadas caem em
      // bloqueio de bot em alguns ambientes.
      'User-Agent': 'somatec-site',
    },
    ...(init.body ? { body: JSON.stringify(init.body) } : {}),
    cache: 'no-store',
  });
  const texto = await r.text();
  const dados = texto ? (JSON.parse(texto) as T & { errors?: Array<{ description?: string }> }) : ({} as T);
  if (!r.ok) {
    // O Asaas devolve o motivo em `errors[].description` — sem isso o log vira
    // "HTTP 400" e ninguém descobre que faltou o CPF.
    const motivo =
      (dados as { errors?: Array<{ description?: string }> }).errors
        ?.map((e) => e.description)
        .filter(Boolean)
        .join('; ') || `HTTP ${r.status}`;
    throw new Error(`Asaas ${caminho}: ${motivo}`);
  }
  return dados;
}

/**
 * Cliente no Asaas — reaproveita o que já existe pelo CPF/CNPJ.
 *
 * Sem a busca, cada compra criaria um cadastro novo da mesma pessoa: o painel
 * financeiro vira uma lista de duplicatas e o histórico de quem já comprou se
 * perde, que é justamente o que a conciliação precisa.
 */
async function garantirCliente(c: Cliente): Promise<string> {
  const doc = c.cpfCnpj.replace(/\D/g, '');
  if (doc) {
    const busca = await chamar<{
      data?: Array<{ id: string; name?: string; email?: string }>;
    }>(`/customers?cpfCnpj=${encodeURIComponent(doc)}&limit=1`);
    const existente = busca.data?.[0];
    if (existente?.id) {
      // ATUALIZA nome e e-mail quando mudaram.
      //
      // Sem isto, quem foi cadastrado uma vez fica congelado: a página de
      // pagamento mostra "Dados do comprador" com o nome antigo, e as
      // notificações do gateway vão pro e-mail antigo. Peguei isso no teste — a
      // fatura de um pedido novo exibia o nome do primeiro cadastro feito com
      // aquele CNPJ, e o comprador veria um nome que não é o dele na hora de
      // pagar.
      //
      // Best-effort: falhar aqui não pode derrubar a venda — o pior caso volta
      // a ser o dado velho, que é o comportamento de antes.
      const mudou =
        (existente.name ?? '').trim() !== c.nome.trim() ||
        (existente.email ?? '').trim().toLowerCase() !== c.email.trim().toLowerCase();
      if (mudou) {
        await chamar(`/customers/${existente.id}`, {
          method: 'POST',
          body: {
            name: c.nome,
            email: c.email,
            cpfCnpj: doc,
            ...(c.telefone ? { mobilePhone: c.telefone.replace(/\D/g, '') } : {}),
          },
        }).catch((err) => {
          log.warn('cliente nao atualizado no gateway', { erro: String(err) });
        });
      }
      return existente.id;
    }
  }
  const novo = await chamar<{ id: string }>('/customers', {
    method: 'POST',
    body: {
      name: c.nome,
      email: c.email,
      cpfCnpj: doc,
      ...(c.telefone ? { mobilePhone: c.telefone.replace(/\D/g, '') } : {}),
      ...(c.cep ? { postalCode: c.cep.replace(/\D/g, '') } : {}),
      notificationDisabled: false,
    },
  });
  return novo.id;
}

/** Vencimento da cobrança: hoje + `dias`, no formato que o Asaas espera. */
function vencimento(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

/**
 * Cria a cobrança do pedido e devolve a página de pagamento.
 *
 * `externalReference` é o NÚMERO DO PEDIDO (SB…): é por ele que o webhook sabe
 * qual pedido foi pago. Sem isso, "pagamento recebido" chega sem dizer de quem,
 * e a conciliação vira trabalho manual.
 */
export async function criarCobranca(params: {
  numeroPedido: string;
  cliente: Cliente;
  valorCentavos: number;
  forma: FormaAsaas;
  /** Parcelas no cartão (1 = à vista). PIX ignora — não existe PIX parcelado. */
  parcelas?: number;
  descricao?: string;
}): Promise<CobrancaCriada> {
  const clienteId = await garantirCliente(params.cliente);
  // O Asaas trabalha em REAIS com 2 casas; o site inteiro trabalha em centavos.
  // A conversão mora só aqui.
  const valor = Number((params.valorCentavos / 100).toFixed(2));
  // PARCELAMENTO: quem manda é `installmentCount`, e ele vai na CRIAÇÃO da
  // cobrança. Sem ele a cobrança é à vista e a página do Asaas não oferece
  // parcelar — o cliente chega lá e só encontra o valor cheio. Mandamos
  // `totalValue` (o total a dividir) em vez de `installmentValue` pra não
  // arredondar parcela na nossa mão: a divisão e a sobra de centavo na última
  // são do gateway, que é quem vai cobrar.
  const parcelas = params.forma === 'CREDIT_CARD' ? Math.max(1, Math.round(params.parcelas ?? 1)) : 1;
  const cobranca = await chamar<{ id: string; invoiceUrl: string; status: string }>('/payments', {
    method: 'POST',
    body: {
      customer: clienteId,
      billingType: params.forma,
      ...(parcelas > 1
        ? { installmentCount: parcelas, totalValue: valor }
        : { value: valor }),
      // PIX vence rápido (o cliente paga na hora); cartão idem — o prazo aqui é
      // só o limite pra a página de pagamento continuar válida.
      dueDate: vencimento(params.forma === 'PIX' ? 1 : 3),
      externalReference: params.numeroPedido,
      description: params.descricao ?? `Pedido ${params.numeroPedido} — Somatec Blocking`,
    },
  });
  log.info('cobranca criada', {
    pedido: params.numeroPedido,
    cobranca: cobranca.id,
    forma: params.forma,
    parcelas,
  });
  return { id: cobranca.id, url: cobranca.invoiceUrl, status: cobranca.status };
}

/**
 * O evento do webhook é confiável? Conferimos o token que NÓS cadastramos no
 * painel do Asaas — ele devolve em todo evento.
 *
 * Sem isto, a URL do webhook é pública e qualquer um marcaria pedido como pago.
 * Sem token configurado, RECUSA: falhar fechado é a única opção quando a dúvida
 * é "esse dinheiro entrou mesmo?".
 */
export function webhookAutentico(tokenRecebido: string | null): boolean {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN ?? '';
  if (!esperado || !tokenRecebido) return false;
  if (esperado.length !== tokenRecebido.length) return false;
  // Comparação de tempo constante: o tamanho já vazou (acima), o conteúdo não.
  let diff = 0;
  for (let i = 0; i < esperado.length; i += 1) {
    diff |= esperado.charCodeAt(i) ^ tokenRecebido.charCodeAt(i);
  }
  return diff === 0;
}

/** Eventos que significam "o dinheiro entrou". O resto é ruído pro pedido. */
export const EVENTOS_PAGO = new Set([
  'PAYMENT_RECEIVED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED_IN_CASH',
]);

/** Eventos que significam "não vai entrar" — o pedido volta a aguardar. */
export const EVENTOS_CANCELADO = new Set([
  'PAYMENT_OVERDUE',
  'PAYMENT_DELETED',
  'PAYMENT_REFUNDED',
  'PAYMENT_CHARGEBACK_REQUESTED',
]);
