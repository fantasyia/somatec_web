import 'server-only';
import { MASTER_BLOCK_MODELS } from '@/lib/constants/masterblock';
import { withTiming } from '@/lib/perf/timing';
import type { SendOutcome } from '@/lib/mullerbot/client';

// =============================================================================
// O pedido do checkout entrando no Betinna — e, de lá, no ERP.
//
// O site é dono da TELA do cliente (número SB…, acompanhamento); o Betinna é
// quem fala com o Tiny. Por isso o pedido sobe pra lá em vez de o site falar
// com o ERP direto: o refresh token do Tiny dura 1 dia e não tem por que viver
// na borda, em dois lugares, expirando em dobro.
//
// POST {BETINNA_PEDIDOS_URL} com header `x-api-key` — a MESMA chave dos leads.
// **Idempotente por `numeroSite`**: reenvio devolve o pedido que já existe, em
// vez de duplicar. É o que torna a fila de retry segura.
// =============================================================================

const TIMEOUT_MS = 8000;

/** Só o que o Betinna tem cadastrado como Produto vira item de pedido.
 *  "acima-da-linha" e "nao-sei" são quadros a dimensionar: viram contexto na
 *  observação, não linha de venda (o Betinna recusaria o pedido INTEIRO por
 *  SKU inexistente, e um item a dimensionar derrubaria a venda toda). */
const SKUS_VALIDOS = new Set(MASTER_BLOCK_MODELS.map((m) => m.model));

export type ItemDoCheckout = {
  descricao: string;
  modelo?: string | null;
  quantidade: number;
  precoCentavos: number;
};

export type EntradaPedidoBetinna = {
  numero: string;
  nome: string;
  email: string;
  whatsapp?: string | null;
  empresa?: string | null;
  itens: ItemDoCheckout[];
  freteCentavos: number;
  formaPagamento?: string | null;
  endereco?: Record<string, unknown> | null;
  setor?: string | null;
  origem?: string | null;
};

export type PedidoBetinna = {
  numeroSite: string;
  cliente: { nome: string; email?: string; telefone?: string };
  itens: Array<{ sku: string; quantidade: number; valorUnitario: number }>;
  valorFrete: number;
  observacoes: string;
};

/** Endereço de entrega em uma linha. Duplica `enderecoEmUmaLinha` de propósito:
 *  aqui o objeto chega como JSON solto (veio do corpo da requisição), sem a
 *  garantia de tipo que a tela tem. */
function enderecoEmTexto(e: Record<string, unknown> | null | undefined): string {
  if (!e) return '';
  const v = (k: string) => String(e[k] ?? '').trim();
  if (!v('logradouro') || !v('cidade')) return '';
  const compl = v('complemento') ? `, ${v('complemento')}` : '';
  return `${v('logradouro')}, ${v('numero')}${compl} — ${v('bairro')}, ${v('cidade')}/${v('uf')} — CEP ${v('cep')}`;
}

/**
 * Traduz o pedido do site para o contrato do Betinna.
 *
 * Devolve `null` quando não sobrou nenhum item com SKU real — pedido só de
 * quadro a dimensionar não é venda fechada, é orçamento, e subir isso pro ERP
 * criaria pedido sem o que faturar.
 */
export function montarPedidoBetinna(p: EntradaPedidoBetinna): PedidoBetinna | null {
  const itens = p.itens
    .filter((i) => i.modelo && SKUS_VALIDOS.has(i.modelo))
    .map((i) => ({
      sku: i.modelo as string,
      quantidade: Math.max(1, Math.round(i.quantidade || 1)),
      valorUnitario: Math.max(0, i.precoCentavos) / 100,
    }));
  if (itens.length === 0) return null;

  const aDimensionar = p.itens.filter((i) => !i.modelo || !SKUS_VALIDOS.has(i.modelo));

  const observacoes = [
    `Pedido ${p.numero} — checkout do site`,
    p.empresa ? `Empresa: ${p.empresa}` : '',
    p.formaPagamento ? `Pagamento: ${p.formaPagamento}` : '',
    enderecoEmTexto(p.endereco) ? `Entrega: ${enderecoEmTexto(p.endereco)}` : '',
    p.setor ? `Setor: ${p.setor}` : '',
    p.origem ? `Origem: ${p.origem}` : '',
    // A expedição precisa saber que o cliente marcou quadro sem corrente: é
    // conversa pendente, não item esquecido.
    aDimensionar.length > 0
      ? `A dimensionar (não faturado): ${aDimensionar.map((i) => i.descricao).join('; ')}`
      : '',
  ]
    .filter(Boolean)
    .join(' — ')
    .slice(0, 2000);

  return {
    numeroSite: p.numero,
    cliente: {
      nome: p.nome.trim().slice(0, 160),
      ...(p.email ? { email: p.email.trim().slice(0, 160) } : {}),
      ...(p.whatsapp ? { telefone: p.whatsapp.trim().slice(0, 30) } : {}),
    },
    itens,
    valorFrete: Math.max(0, p.freteCentavos) / 100,
    observacoes,
  };
}

/** URL do endpoint de pedidos. Derivada da dos leads quando não configurada —
 *  são vizinhas no mesmo backend, e uma env a menos é uma env a menos pra
 *  esquecer de setar (e pra apontar pro ambiente errado). */
function urlPedidos(): string | undefined {
  const explicita = process.env.BETINNA_PEDIDOS_URL;
  if (explicita) return explicita;
  const leads = process.env.BETINNA_LEADS_URL;
  return leads?.includes('/leads') ? leads.replace(/\/leads(\/)?$/, '/pedidos') : undefined;
}

export async function enviarPedidoBetinna(pedido: PedidoBetinna): Promise<SendOutcome> {
  const url = urlPedidos();
  const apiKey = process.env.BETINNA_API_KEY;
  if (!url || !apiKey) return { result: 'not_configured' };

  return withTiming('betinna:pedido', async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(pedido),
        signal: controller.signal,
      });

      if (res.ok) {
        let externalId: string | null = null;
        try {
          const j = (await res.json()) as {
            data?: { pedidoId?: string; numero?: string; numeroErp?: string | null };
          };
          externalId = j?.data?.numeroErp ?? j?.data?.numero ?? j?.data?.pedidoId ?? null;
        } catch {
          // corpo não-JSON — pedido aceito mesmo assim
        }
        return { result: 'sent', status: res.status, externalId };
      }

      const text = await res.text().catch(() => '');
      // 4xx é erro nosso (SKU, chave, contrato): repetir não conserta e ainda
      // enche a fila. 5xx é o Betinna fora do ar — esse volta.
      if (res.status >= 400 && res.status < 500) {
        return { result: 'client_error', status: res.status, body: text.slice(0, 500) };
      }
      return { result: 'server_error', status: res.status, body: text.slice(0, 500) };
    } catch (err) {
      return {
        result: 'network_error',
        message: err instanceof Error ? err.message : 'fetch failed',
      };
    } finally {
      clearTimeout(timer);
    }
  });
}
