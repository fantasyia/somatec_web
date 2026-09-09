import 'server-only';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';
import {
  normalizarNumero,
  numeroValido,
  type ItemPedido,
  type PedidoPublico,
  type StatusPedido,
} from '@/lib/pedidos/tipos';

const log = createLogger('pedidos');

// =============================================================================
// Acesso a pedido — SEMPRE por função do banco, nunca por SELECT direto.
//
// A tabela `pedidos` está com RLS ligado e ZERO políticas: ela é invisível
// para a chave que o site carrega (que é a ANON, apesar do nome da variável).
// Todo acesso passa por função SECURITY DEFINER, que devolve só o que deve.
//
// Por que isso importa: o cliente consulta pelo NÚMERO e nada mais — então o
// número é a credencial. Se a tabela fosse legível pela anon, "consultar pelo
// número" viraria "listar o pedido de todo mundo", porque a anon é pública:
// ela vai no bundle do site, qualquer um lê.
//
// Pela mesma razão, `consultar_pedido` não devolve e-mail, WhatsApp nem o
// endereço completo — só cidade/UF. Se um número vazar, o estrago é saber que
// alguém comprou, não o cadastro dela.
// =============================================================================

export type ResultadoCriacao =
  | { ok: true; numero: string }
  | { ok: false; erro: string; excedeuLimite?: boolean };

export async function criarPedido(dados: {
  nome: string;
  email: string;
  whatsapp?: string | null;
  empresa?: string | null;
  itens: ItemPedido[];
  totalCentavos: number;
  freteCentavos: number;
  formaPagamento?: string | null;
  endereco?: Record<string, unknown> | null;
  setor?: string | null;
  origem?: string | null;
}): Promise<ResultadoCriacao> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.rpc('criar_pedido', {
      p_nome: dados.nome,
      p_email: dados.email,
      p_whatsapp: dados.whatsapp ?? null,
      p_empresa: dados.empresa ?? null,
      p_itens: dados.itens ?? [],
      p_total_centavos: Math.max(0, Math.round(dados.totalCentavos || 0)),
      p_frete_centavos: Math.max(0, Math.round(dados.freteCentavos || 0)),
      p_forma_pagamento: dados.formaPagamento ?? null,
      p_endereco: dados.endereco ?? {},
      p_setor: dados.setor ?? null,
      p_origem: dados.origem ?? null,
    });

    if (error) {
      // O freio por e-mail vem do banco (10/hora). Não é erro do servidor —
      // devolver 500 aqui mandaria a pessoa "tentar de novo", que é
      // exatamente o que não resolve.
      const excedeuLimite = /muitos pedidos/i.test(error.message || '');
      if (!excedeuLimite) log.error('falha criando pedido', { error });
      return {
        ok: false,
        erro: excedeuLimite ? 'muitos pedidos para este e-mail' : 'nao foi possivel registrar o pedido',
        excedeuLimite,
      };
    }
    const numero = typeof data === 'string' ? data : String(data ?? '');
    if (!numero) return { ok: false, erro: 'banco nao devolveu numero' };
    return { ok: true, numero };
  } catch (e) {
    log.error('excecao criando pedido', { error: e });
    return { ok: false, erro: 'nao foi possivel registrar o pedido' };
  }
}

type LinhaConsulta = {
  numero: string;
  status: StatusPedido;
  criado_em: string;
  atualizado_em: string;
  itens: ItemPedido[] | null;
  total_centavos: number;
  frete_centavos: number;
  forma_pagamento: string | null;
  transportadora: string | null;
  rastreio_codigo: string | null;
  rastreio_url: string | null;
  historico: PedidoPublico['historico'] | null;
  primeiro_nome: string | null;
  cidade: string | null;
  uf: string | null;
};

/** `undefined` = não existe. Erro de banco também devolve `undefined`, de
 *  propósito: a tela não pode dizer "erro no servidor" pra quem digitou um
 *  número errado, nem dizer "não existe" de um jeito diferente de "existe mas
 *  falhou" — isso é o que permite descobrir números válidos por tentativa. */
export async function consultarPedido(numeroBruto: string): Promise<PedidoPublico | undefined> {
  const numero = normalizarNumero(numeroBruto);
  // Nem chega no banco se o formato não bate — corta a maior parte da força
  // bruta antes de gastar consulta.
  if (!numeroValido(numero)) return undefined;

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.rpc('consultar_pedido', { p_numero: numero });
    if (error) {
      log.error('falha consultando pedido', { error });
      return undefined;
    }
    const linha = (Array.isArray(data) ? data[0] : data) as LinhaConsulta | undefined;
    if (!linha) return undefined;

    return {
      numero: linha.numero,
      status: linha.status,
      criadoEm: linha.criado_em,
      atualizadoEm: linha.atualizado_em,
      itens: Array.isArray(linha.itens) ? linha.itens : [],
      totalCentavos: linha.total_centavos ?? 0,
      freteCentavos: linha.frete_centavos ?? 0,
      formaPagamento: linha.forma_pagamento,
      transportadora: linha.transportadora,
      rastreioCodigo: linha.rastreio_codigo,
      rastreioUrl: linha.rastreio_url,
      historico: Array.isArray(linha.historico) ? linha.historico : [],
      primeiroNome: linha.primeiro_nome,
      cidade: linha.cidade,
      uf: linha.uf,
    };
  } catch (e) {
    log.error('excecao consultando pedido', { error: e });
    return undefined;
  }
}

export type ResultadoStatus =
  | { ok: true; numero: string; status: StatusPedido }
  | { ok: false; erro: string };

/** Move o pedido. Não existe tela pra isso — o /admin do site saiu em 25/08 —
 *  então o caminho é a rota `/api/pedidos/status`, com segredo.
 *
 *  O segredo em claro vive só no ambiente; o banco guarda apenas o SHA-256
 *  dele, e a comparação acontece dentro da função. */
export async function atualizarStatus(args: {
  numero: string;
  status: StatusPedido;
  nota?: string | null;
  transportadora?: string | null;
  rastreioCodigo?: string | null;
  rastreioUrl?: string | null;
}): Promise<ResultadoStatus> {
  const segredo = process.env.PEDIDOS_STATUS_SECRET;
  if (!segredo) return { ok: false, erro: 'PEDIDOS_STATUS_SECRET ausente' };

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.rpc('atualizar_status_pedido', {
      p_segredo: segredo,
      p_numero: normalizarNumero(args.numero),
      p_status: args.status,
      p_nota: args.nota ?? null,
      p_transportadora: args.transportadora ?? null,
      p_rastreio_codigo: args.rastreioCodigo ?? null,
      p_rastreio_url: args.rastreioUrl ?? null,
    });
    if (error) {
      log.error('falha atualizando status', { error });
      return { ok: false, erro: error.message };
    }
    const linha = (Array.isArray(data) ? data[0] : data) as
      | { numero: string; status: StatusPedido }
      | undefined;
    if (!linha) return { ok: false, erro: 'pedido nao encontrado' };
    return { ok: true, numero: linha.numero, status: linha.status };
  } catch (e) {
    log.error('excecao atualizando status', { error: e });
    return { ok: false, erro: 'falha ao atualizar' };
  }
}

// =============================================================================
// O CONTATO DO COMPRADOR — e por que ele NÃO passa pela `consultar_pedido`.
//
// O webhook do gateway avisa que o pedido SB… foi pago, e só. Pra escrever pro
// comprador falta o e-mail dele, e a `consultar_pedido` não devolve isso de
// propósito (ver o bloco no topo do arquivo): ela é consultável por qualquer um
// que tenha — ou adivinhe — um número de pedido. Acrescentar o e-mail ali
// transformaria a página de acompanhamento num coletor de endereço.
//
// Então o contato vem por leitura direta, que só existe no servidor:
//
//   • a tabela está com RLS ligado e ZERO políticas — pra chave ANON (a que vai
//     no navegador) esta consulta devolve VAZIO, não erro
//   • em produção o site roda com a chave `service_role`, que nunca sai daqui
//
// Isso é o oposto de uma função no banco: uma função `SECURITY DEFINER` que
// devolvesse e-mail seria chamável por quem tem a anon — ou seja, por qualquer
// visitante. A leitura direta falha FECHADA: onde a chave não tem poder, ela
// não devolve nada.
//
// ⚠️ Efeito colateral aceito: em desenvolvimento (chave anon no `.env.local`)
// isto sempre volta `undefined`, e o e-mail ao cliente não sai. É o mesmo
// motivo pelo qual o localhost também não cria lead no CRM.
// =============================================================================

export type ContatoDoPedido = {
  email: string;
  primeiroNome: string | null;
  /** Quando o pedido nasceu — é o que decide se o aviso de pagamento sai. */
  criadoEm: string;
  formaPagamento: string | null;
};

/** `undefined` = não achou, ou a chave não enxerga. Quem chama trata como
 *  "não dá pra avisar" e registra — nunca como "não precisa avisar". */
export async function contatoDoPedido(numeroBruto: string): Promise<ContatoDoPedido | undefined> {
  const numero = normalizarNumero(numeroBruto);
  if (!numeroValido(numero)) return undefined;

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from('pedidos')
      .select('email, nome, criado_em, forma_pagamento')
      .eq('numero', numero)
      .maybeSingle();

    if (error) {
      log.error('falha lendo contato do pedido', { numero, error });
      return undefined;
    }
    const linha = data as
      | { email: string; nome: string | null; criado_em: string; forma_pagamento: string | null }
      | null;
    if (!linha?.email) return undefined;

    return {
      email: linha.email,
      primeiroNome: String(linha.nome || '').trim().split(/\s+/)[0] || null,
      criadoEm: linha.criado_em,
      formaPagamento: linha.forma_pagamento,
    };
  } catch (e) {
    log.error('excecao lendo contato do pedido', { error: e });
    return undefined;
  }
}
