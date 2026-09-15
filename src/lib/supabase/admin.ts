import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { createLogger } from '@/lib/logger';

const log = createLogger('supabase-admin');

// =============================================================================
// RETENTATIVA ÚNICA EM 5xx DE GATEWAY — card do 504 em rajadas (15/09/2026).
//
// O que foi MEDIDO nos logs do Supabase (24h até 14/09 20:15 UTC): 31 respostas
// 5xx em ~1.640 requisições, TODAS 504, todas parando em `origin_time` ≈ 5.000
// ms, concentradas em 4 rajadas. Tráfego ≤270 req/h — não é carga. Nas rajadas
// caem tabelas triviais (`site_settings`, `home_hero`, `footer_links`,
// `posts`), então é o processo do PostgREST parado, não query lenta. O próprio
// PostgREST loga `Thread killed by timeout manager` 550×/24h.
//
// O site não quebrava: home renderiza sem as seções do banco, blog cai no
// arquivo. O sintoma é conteúdo degradado sem ninguém ver. Quem NÃO tem
// fallback é o INSERT do pedido — uma rajada em cima de um checkout real vira
// erro pro cliente.
//
// ⚠️ SÓ GET/HEAD. Repetir POST/PATCH/DELETE aqui é diferente de repetir no
// nível da aplicação: se a primeira tentativa GRAVOU e só a resposta se perdeu,
// a segunda grava de novo. A idempotência do pedido vive na camada de cima
// (por chave de cobrança) e é ela que pode reenviar com segurança — o
// transporte não sabe o que é seguro repetir.
//
// ⚠️ Só status de gateway (502/503/504). Erro lançado pelo fetch e 500 do
// PostgREST ficam de fora de propósito: 500 é erro real de query, e repetir
// esconderia o defeito em vez de mostrá-lo.
//
// 🔍 ISTO É PALIATIVO E PRECISA SER MEDIDO. Uma rajada de 5 s não some com
// espera de 400 ms — só resolve se a rajada for de uma requisição. É pra isso
// que existem os três logs abaixo: `repetiu` conta quantas vezes entrou,
// `deu certo` quantas o retry salvou. Se as duas ficarem coladas, a rajada é
// curta e isto basta; se `deu certo` for perto de zero, a resposta é a outra
// metade do card — o porte de compute do projeto (Nano → Micro), que é do Léo.
// =============================================================================

const ESPERA_PADRAO_MS = 400;
const STATUS_QUE_REPETE = new Set([502, 503, 504]);
const METODOS_QUE_REPETEM = new Set(['GET', 'HEAD']);

/** Só o caminho, nunca a query. O filtro do PostgREST vai na query string
 *  (`?id=eq.<uuid>`, `?email=eq.<...>`) e isso é dado de pessoa. */
function caminhoDe(input: RequestInfo | URL): string {
  try {
    const bruto = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    return new URL(bruto).pathname;
  } catch {
    return '(desconhecido)';
  }
}

function metodoDe(input: RequestInfo | URL, init?: RequestInit): string {
  const bruto = init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : '');
  return (bruto || 'GET').toUpperCase();
}

/**
 * Envolve um `fetch` com UMA retentativa em 5xx de gateway.
 *
 * Exportado com as duas dependências injetáveis por causa do teste: sem isso a
 * guarda teria de esperar 400 ms de verdade a cada caso.
 */
export function criarFetchComRetentativa(
  fetchBase: typeof fetch = (...args) => fetch(...args),
  esperaMs: number = ESPERA_PADRAO_MS,
): typeof fetch {
  return async function fetchComRetentativa(input, init) {
    const primeira = await fetchBase(input, init);
    if (!STATUS_QUE_REPETE.has(primeira.status)) return primeira;

    const metodo = metodoDe(input, init);
    if (!METODOS_QUE_REPETEM.has(metodo)) return primeira;

    const caminho = caminhoDe(input);
    log.warn('supabase respondeu 5xx, repetindo uma vez', {
      status: primeira.status,
      metodo,
      caminho,
    });

    await new Promise((resolve) => setTimeout(resolve, esperaMs));
    const segunda = await fetchBase(input, init);

    if (STATUS_QUE_REPETE.has(segunda.status)) {
      log.warn('retentativa do supabase também caiu — a rajada durou mais que a espera', {
        status: segunda.status,
        metodo,
        caminho,
        esperaMs,
      });
    } else {
      log.info('retentativa do supabase deu certo', { metodo, caminho, esperaMs });
    }
    return segunda;
  };
}

/**
 * Client Supabase com service_role.
 * BYPASSA RLS — usar somente em API routes/Server Actions de confiança.
 * NUNCA importar a partir de código client.
 */
export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes. Verifique .env.local.',
    );
  }
  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    // `fetch` é resolvido a CADA chamada, não capturado agora: em Next o
    // `fetch` global é instrumentado, e guardar a referência aqui tiraria as
    // requisições do Supabase dessa instrumentação.
    global: { fetch: criarFetchComRetentativa() },
  });
}
