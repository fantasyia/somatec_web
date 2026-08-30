import 'server-only';
import { MASTER_BLOCK_MODELS } from '@/lib/constants/masterblock';
import { createLogger } from '@/lib/logger';

const log = createLogger('erp-frete');

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

// Cotação real bate em transportadora, não em cache: 8s era otimista, e um
// timeout apareceria como "indisponível" — indistinguível de ERP fora do ar.
const TIMEOUT_MS = 15_000;

export type ItemCotacao = { model: string; quantidade: number };

export type OpcaoFrete = {
  id: string;
  nome: string;
  transportadora: string;
  valor: number;
  prazoDias: number | null;
};

export type MotivoFalha =
  /** Nenhuma env configurada — integração ainda desligada. */
  | 'sem_credencial'
  /** O ERP recusou o token. É erro de CONFIGURAÇÃO, não indisponibilidade. */
  | 'credencial_invalida'
  /** O ERP está de pé e respondeu, mas não conhece o SKU: os produtos não
   *  estão vinculados ao cadastro da integração. Também é CONFIGURAÇÃO. */
  | 'produto_nao_vinculado'
  /** ERP fora do ar, lento, ou resposta que não dá pra ler. */
  | 'indisponivel'
  /** Carrinho sem nenhum item cotável. */
  | 'dados_invalidos';

export type ResultadoCotacao =
  | { ok: true; opcoes: OpcaoFrete[]; detalhe?: string }
  /** `detalhe` é diagnóstico e NUNCA vai pro cliente — só pra quem manda o
   *  segredo na rota. Pode conter mensagem interna do ERP. */
  | { ok: false; motivo: MotivoFalha; opcoes: []; detalhe?: string };

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

/**
 * "Jadlog via Melhor Envio" → "Jadlog".
 *
 * Quem compra quer saber quem entrega. O agregador de frete é detalhe nosso —
 * na tela ele só faz a frase parecer erro de sistema.
 */
function limparTransportadora(nome?: string): string {
  return (nome ?? '').replace(/\s+via\s+melhor\s+envio\s*$/i, '').trim();
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
      // Conferido contra a resposta real: `nome_forma_envio` é a
      // TRANSPORTADORA ("Jadlog via Melhor Envio") e `nome_forma_frete` é o
      // serviço (".Package"). Eu tinha suposto o contrário, e a tela mostrava
      // "entrega em 5 dias — .Package", que não diz nada pra quem compra.
      nome: s.nome_forma_frete ?? s.nome_forma_envio ?? 'Entrega',
      transportadora: limparTransportadora(s.nome_forma_envio ?? s.nome_forma_frete),
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
  if (!url || !token) {
    return {
      ok: false,
      motivo: 'sem_credencial',
      opcoes: [],
      detalhe: `faltando: ${[!url && 'ERP_COTACAO_URL', !token && 'ERP_API_TOKEN'].filter(Boolean).join(', ')}`,
    };
  }

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

    // ⚠️ O ERP responde **200 com texto puro** quando o token não presta
    // ("token invalido"). Confiar em `r.ok` e ir direto pro `.json()` faz a
    // exceção cair no catch e virar "indisponível" — que é mentira: o ERP
    // está de pé, quem está errado é a configuração. E como o checkout degrada
    // sozinho, ninguém descobriria até alguém reparar que o prazo sumiu.
    const bruto = await r.text();

    let corpo: unknown;
    try {
      corpo = JSON.parse(bruto);
    } catch {
      const texto = bruto.trim().slice(0, 200);
      const ehToken = /token/i.test(texto);
      log[ehToken ? 'error' : 'warn'](
        ehToken ? 'ERP recusou o token da cotação' : 'ERP respondeu algo que não é JSON',
        { status: r.status, resposta: texto },
      );
      return {
        ok: false,
        motivo: ehToken ? 'credencial_invalida' : 'indisponivel',
        opcoes: [],
        detalhe: `HTTP ${r.status} texto: ${texto}`,
      };
    }

    if (!r.ok) {
      // `{"error":"Item 'MB-01' não encontrado."}` com 400 é o MESMO tipo de
      // problema que o token recusado: o ERP está de pé, quem está errado é o
      // cadastro — os SKUs não foram vinculados à integração. Jogar isso em
      // `indisponivel` faz a falha se passar por queda do ERP, e como o
      // checkout degrada sozinho ninguém descobre até reparar que o prazo
      // sumiu. É exatamente a armadilha que o caso do token já evita.
      // Casa por "encontrad", que é ASCII puro. O "não" chega de formas
      // diferentes conforme o encoding da resposta (`não`, `nao`, e o mojibake
      // `nÃ£o` quando o ERP declara latin1 e manda utf-8) — e mojibake continua
      // sendo JSON válido, então passaria batido por um matcher acentuado e a
      // falha voltaria a se passar por queda do ERP.
      const naoConhece = /item/i.test(bruto) && /encontrad/i.test(bruto);
      if (naoConhece) {
        log.error('ERP não reconhece o SKU — produto não vinculado à integração', {
          status: r.status,
          resposta: bruto.slice(0, 200),
        });
        return {
          ok: false,
          motivo: 'produto_nao_vinculado',
          opcoes: [],
          detalhe: `HTTP ${r.status}: ${bruto.slice(0, 300)}`,
        };
      }
      log.warn('ERP recusou a cotação', { status: r.status, resposta: bruto.slice(0, 200) });
      return {
        ok: false,
        motivo: 'indisponivel',
        opcoes: [],
        detalhe: `HTTP ${r.status}: ${bruto.slice(0, 300)}`,
      };
    }

    const opcoes = normalizar(corpo);
    const vazio = opcoes.length === 0 ? `sem opções — resposta: ${bruto.slice(0, 300)}` : undefined;
    // Cotação vazia não é falha: pode ser CEP sem cobertura na preferencial nem
    // nas alternativas. A tela cai no prazo confirmado no pedido.
    if (opcoes.length === 0) {
      log.info('ERP não devolveu opção de frete', { resposta: bruto.slice(0, 200) });
    }
    return { ok: true, opcoes, ...(vazio ? { detalhe: vazio } : {}) };
  } catch (err) {
    log.warn('cotação no ERP falhou', {
      erro: err instanceof Error ? err.message : String(err),
    });
    return {
      ok: false,
      motivo: 'indisponivel',
      opcoes: [],
      detalhe: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    };
  }
}
