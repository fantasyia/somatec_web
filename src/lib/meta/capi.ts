import 'server-only';
import { createHash } from 'node:crypto';
import { createLogger } from '@/lib/logger';

const log = createLogger('meta-capi');

// =============================================================================
// CONVERSIONS API DA META — o mesmo evento, contado uma vez só.
//
// Por que existe: o Pixel roda no navegador, e navegador é frágil — bloqueador
// de anúncio, ITP do Safari/iOS, aba fechada antes do disparo. O CAPI manda o
// MESMO evento pelo servidor, que não depende de nada disso. Quem amarra os
// dois é o `event_id`: chegando o mesmo valor pelos dois caminhos, a Meta
// entende que é um evento só. Sem ele, cada conversão contaria em dobro.
//
// ⚠️ INERTE SEM CREDENCIAL. Faltando `META_PIXEL_ID` ou `META_CAPI_TOKEN`, nada
// é enviado e nada quebra — é o estado de hoje, esperando o token da sessão de
// Ads. Ligar depois é preencher duas variáveis no Railway, sem deploy de código.
//
// 🔒 O que sai daqui é HASH, nunca dado pessoal em claro. E o hash é feito no
// SERVIDOR de propósito: hash no navegador não protege nada, porque o valor cru
// está na mesma página, ao lado.
// =============================================================================

const VERSAO_API = 'v21.0';
const TIMEOUT_MS = 4000;

export type UsuarioCapi = {
  email?: string | null;
  telefone?: string | null;
  /** Deriva do `fbclid` — é o que liga a conversão ao CLIQUE no anúncio. */
  fbc?: string | null;
  /** Cookie `_fbp`, escrito pelo próprio Pixel. */
  fbp?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};

export type EventoCapi = {
  /** Nome na Meta: `Lead`, `InitiateCheckout`, ou um custom nosso. */
  nome: string;
  /** O MESMO id emitido pelo navegador. É o que faz o dedupe. */
  eventId: string;
  urlOrigem?: string | null;
  usuario: UsuarioCapi;
  dados?: Record<string, unknown>;
};

export type ResultadoCapi =
  | { enviado: true }
  | { enviado: false; motivo: 'sem-config' | 'erro'; detalhe?: string };

/** SHA-256 do valor normalizado. Vazio devolve undefined — a Meta recusa hash de "". */
function hash(valor: string | null | undefined, normalizar: (v: string) => string) {
  if (!valor) return undefined;
  const limpo = normalizar(valor);
  if (!limpo) return undefined;
  return createHash('sha256').update(limpo).digest('hex');
}

/** minúsculo e sem espaço nas pontas — a regra da Meta pra e-mail. */
const normEmail = (v: string) => v.trim().toLowerCase();

/**
 * Só dígitos, com DDI. A Meta espera E.164 sem o `+`, e um número brasileiro
 * digitado como "(11) 99999-0000" vira 11999990000 — sem o 55, a Meta trata
 * como outro país e o match não acontece.
 */
function normTelefone(v: string): string {
  const digitos = v.replace(/\D/g, '');
  if (!digitos) return '';
  if (digitos.startsWith('55')) return digitos;
  // 10 (fixo) ou 11 (celular) dígitos = número nacional sem DDI.
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
  return digitos;
}

/**
 * Monta o `fbc` no formato que a Meta exige: `fb.1.<timestamp_ms>.<fbclid>`.
 * O `1` é o nível de subdomínio e é fixo pra domínio raiz.
 */
export function montarFbc(fbclid: string | null | undefined, capturadoEm?: string | null) {
  if (!fbclid) return null;
  const ts = capturadoEm ? Date.parse(capturadoEm) : Date.now();
  return `fb.1.${Number.isFinite(ts) ? ts : Date.now()}.${fbclid}`;
}

/** Configurado = as duas variáveis presentes. Uma só não serve pra nada. */
export function capiConfigurado(): boolean {
  return Boolean(process.env.META_PIXEL_ID && process.env.META_CAPI_TOKEN);
}

/**
 * Envia um evento pro CAPI. **Nunca lança** — analytics não pode derrubar o
 * lead nem o pedido. O caller aguarda mas ignora o resultado.
 */
export async function enviarEventoMeta(evento: EventoCapi): Promise<ResultadoCapi> {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixelId || !token) return { enviado: false, motivo: 'sem-config' };

  const u = evento.usuario;
  const user_data: Record<string, unknown> = {
    em: hash(u.email, normEmail),
    ph: hash(u.telefone, normTelefone),
    fbc: u.fbc ?? undefined,
    fbp: u.fbp ?? undefined,
    client_ip_address: u.ip ?? undefined,
    client_user_agent: u.userAgent ?? undefined,
  };
  for (const k of Object.keys(user_data)) if (user_data[k] === undefined) delete user_data[k];

  const corpo = {
    data: [
      {
        event_name: evento.nome,
        event_time: Math.floor(Date.now() / 1000),
        event_id: evento.eventId,
        action_source: 'website',
        event_source_url: evento.urlOrigem ?? undefined,
        user_data,
        custom_data: evento.dados ?? undefined,
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${VERSAO_API}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    if (!res.ok) {
      // Corpo do erro traz o motivo (token vencido, pixel errado, campo inválido).
      const detalhe = await res.text().catch(() => '');
      log.warn('CAPI recusou o evento', {
        status: res.status,
        evento: evento.nome,
        detalhe: detalhe.slice(0, 300),
      });
      return { enviado: false, motivo: 'erro', detalhe: `http_${res.status}` };
    }
    return { enviado: true };
  } catch (err) {
    log.warn('CAPI indisponível', { evento: evento.nome, erro: String(err).slice(0, 200) });
    return { enviado: false, motivo: 'erro', detalhe: 'rede' };
  }
}
