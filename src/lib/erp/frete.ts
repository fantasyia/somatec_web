import 'server-only';
import { MASTER_BLOCK_MODELS } from '@/lib/constants/masterblock';

// =============================================================================
// Cotação de frete pelo ERP (Olist/Tiny) — não pelo Melhor Envio direto.
//
// A escolha não é de conveniência, é de coerência: o ERP cota usando as formas
// de envio configuradas em Integrações → Mapeamentos, com uma PREFERENCIAL
// (hoje Jadlog) e as outras como alternativa. São exatamente as transportadoras
// que vão emitir a etiqueta. Cotando direto no Melhor Envio, o site mostraria a
// mais barata e a expedição despacharia pela preferencial — prazo diferente na
// tela e na realidade, no único número que o cliente leva a sério.
//
// De quebra some o problema do token: aqui é um token de conta no header, não
// OAuth de 30/45 dias com rotação. E quando o Léo trocar a transportadora
// preferencial no painel, o site segue sozinho, sem deploy.
//
// ⛔ Sem credencial (ou com o ERP fora do ar) o checkout NÃO trava: devolve
// lista vazia e a tela cai no "frete grátis, prazo confirmado no pedido".
// Cotação é melhoria, não requisito da venda.
//
// Contrato (API 2.0 — "Cotação de fretes"):
//   POST {ERP_COTACAO_URL}   header `Token: <token da conta>`
//   { cep_origem?, cep_destino, itens: [{ sku, quantidade, peso,
//     altura, largura, comprimento }], opcoes? }
//   → [{ tipo_entrega, preco, prazo, id_forma_envio, nome_forma_envio,
//        id_forma_frete, nome_forma_frete }]
// =============================================================================

const TIMEOUT_MS = 8000;

export type ItemCotacao = { model: string; quantidade: number };

export type OpcaoFrete = {
  id: string;
  nome: string;
  transportadora: string;
  valor: number;
  prazoDias: number | null;
};

export type ResultadoCotacao =
  | { ok: true; opcoes: OpcaoFrete[] }
  | { ok: false; motivo: 'sem_credencial' | 'indisponivel' | 'dados_invalidos'; opcoes: [] };

/** "150 × 100 × 60" (mm) → cm, que é a unidade da cotação. */
export function dimensoesCm(dim: string): {
  comprimento: number;
  largura: number;
  altura: number;
} {
  const [a = 0, b = 0, c = 0] = dim.split(/[×x]/).map((n) => parseFloat(n.trim()) || 0);
  const cm = (mm: number) => Math.max(1, Math.round(mm / 10));
  return { comprimento: cm(a), largura: cm(b), altura: cm(c) };
}

type RespostaCotacao = {
  tipo_entrega?: string;
  preco?: number | string;
  prazo?: number | string;
  id_forma_envio?: number | string;
  nome_forma_envio?: string;
  id_forma_frete?: number | string;
  nome_forma_frete?: string;
  erro?: string;
};

/**
 * Monta os itens no formato da cotação.
 *
 * Peso e dimensões saem de `masterblock.ts`, que hoje guarda a medida do
 * PRODUTO, não da caixa. O prazo aguenta esse erro (depende muito mais de
 * origem/destino que de peso); o custo sai subestimado até as medidas reais
 * entrarem. Decisão consciente do Léo pra não segurar o lançamento.
 */
export function montarItens(itens: ItemCotacao[]) {
  return itens.flatMap((i) => {
    const m = MASTER_BLOCK_MODELS.find((x) => x.model === i.model);
    if (!m) return [];
    const d = dimensoesCm(m.dim);
    return [
      {
        sku: m.model,
        quantidade: Math.max(1, i.quantidade),
        peso: parseFloat(m.weight.replace(',', '.')) || 1,
        altura: d.altura,
        largura: d.largura,
        comprimento: d.comprimento,
      },
    ];
  });
}

/** Normaliza a resposta do ERP pro formato que o checkout já consome. */
export function normalizar(bruto: unknown): OpcaoFrete[] {
  const lista = Array.isArray(bruto)
    ? bruto
    : Array.isArray((bruto as { cotacoes?: unknown[] })?.cotacoes)
      ? ((bruto as { cotacoes: unknown[] }).cotacoes as unknown[])
      : [];

  return (lista as RespostaCotacao[])
    .filter((s) => !s.erro && s.preco != null)
    .map((s) => ({
      id: String(s.id_forma_envio ?? s.id_forma_frete ?? s.nome_forma_envio ?? ''),
      nome: s.nome_forma_envio ?? s.nome_forma_frete ?? 'Entrega',
      // `nome_forma_frete` é a transportadora ("Jadlog via Melhor Envio");
      // `nome_forma_envio` é o serviço. Quando só um vem, ele serve pros dois.
      transportadora: s.nome_forma_frete ?? s.nome_forma_envio ?? '',
      valor: Number(s.preco) || 0,
      prazoDias: s.prazo == null ? null : Number(s.prazo) || null,
    }));
  // NÃO reordenar. O ERP devolve na ordem da preferência configurada no
  // painel, e a alternativa só entra quando a preferencial não cotou — quem
  // vem primeiro é quem vai despachar. Ordenar por prazo (ou por preço) faria
  // a tela prometer o prazo de uma transportadora e a expedição usar outra,
  // que é exatamente o problema que cotar pelo ERP veio resolver.
}

export async function cotarFreteErp(
  cepDestino: string,
  itens: ItemCotacao[],
): Promise<ResultadoCotacao> {
  const url = process.env.ERP_COTACAO_URL;
  const token = process.env.ERP_API_TOKEN;
  if (!url || !token) return { ok: false, motivo: 'sem_credencial', opcoes: [] };

  const produtos = montarItens(itens);
  if (produtos.length === 0) return { ok: false, motivo: 'dados_invalidos', opcoes: [] };

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Token: token,
      },
      body: JSON.stringify({
        ...(process.env.ERP_CEP_ORIGEM
          ? { cep_origem: process.env.ERP_CEP_ORIGEM.replace(/\D/g, '') }
          : {}),
        cep_destino: cepDestino.replace(/\D/g, ''),
        itens: produtos,
        opcoes: {
          // Uma cotação pro carrinho inteiro: é uma entrega só, e somar caixas
          // separadas mostraria um frete que ninguém vai cobrar.
          cotar_agrupado: true,
          // O prazo tem que incluir a montagem — a operação é sob encomenda, e
          // prometer o prazo da transportadora sozinho seria promessa curta.
          considerar_dias_preparacao: true,
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!r.ok) return { ok: false, motivo: 'indisponivel', opcoes: [] };

    const opcoes = normalizar(await r.json());
    return { ok: true, opcoes };
  } catch {
    return { ok: false, motivo: 'indisponivel', opcoes: [] };
  }
}
