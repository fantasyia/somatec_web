import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';

const log = createLogger('melhorenvio');

// =============================================================================
// Token do Melhor Envio — guardado no banco porque EXPIRA.
//
// Não existe token permanente lá: o access vale 30 dias, o refresh 45, e a
// renovação ROTACIONA os dois. Guardar em env var significaria o frete parar
// de cotar sozinho um mês depois do lançamento, sem erro na tela — o checkout
// só voltaria a dizer "prazo informado na confirmação" e ninguém notaria.
//
// Então: autoriza UMA vez no navegador (/api/melhorenvio/autorizar) e a partir
// daí o site se vira. A renovação acontece em dois lugares, de propósito:
//   1. quando alguém cota (aqui, com margem larga);
//   2. no cron de 5 min — porque o risco real é o oposto do movimento: 45 dias
//      SEM ninguém cotar matam a conexão, e aí só autorização manual resolve.
// =============================================================================

/** Renova quando falta menos que isto pro access vencer. Margem larga de
 *  propósito: com 30 dias de validade, renovar 5 dias antes custa nada e dá
 *  centenas de chances de acertar antes de virar problema. */
const MARGEM_MS = 5 * 24 * 60 * 60 * 1000;

/** Quanto tempo uma renovação em curso segura a trava. */
const TRAVA_MS = 2 * 60 * 1000;

/** Janela de validade do `state` do OAuth. */
const STATE_MS = 15 * 60 * 1000;

export const ESCOPO = 'shipping-calculate';

export type TokenGuardado = {
  access_token: string;
  refresh_token: string;
  escopo: string | null;
  expira_em: string;
  refresh_expira_em: string;
  renovando_ate: string | null;
};

export function baseMelhorEnvio(): string {
  return process.env.MELHOR_ENVIO_SANDBOX === 'true'
    ? 'https://sandbox.melhorenvio.com.br'
    : 'https://melhorenvio.com.br';
}

function credenciais(): { id: string; secret: string; callback: string } | null {
  const id = process.env.MELHOR_ENVIO_CLIENT_ID;
  const secret = process.env.MELHOR_ENVIO_CLIENT_SECRET;
  const callback = process.env.MELHOR_ENVIO_REDIRECT_URI;
  return id && secret && callback ? { id, secret, callback } : null;
}

export function configurado(): boolean {
  return credenciais() !== null;
}

// ── state do OAuth: assinado, não guardado ──────────────────────────────────
//
// O `state` volta do Melhor Envio pelo navegador. Assinar em vez de guardar
// evita uma linha de banco com prazo de validade — e evita o caso chato de o
// callback chegar antes do commit da linha. A chave é o próprio client secret:
// quem não a tem não forja state, e quem a tem já é dono da integração.

export function assinarState(): string {
  const cred = credenciais();
  if (!cred) throw new Error('Melhor Envio sem credenciais');
  const nonce = randomBytes(9).toString('base64url');
  const corpo = `${Date.now()}.${nonce}`;
  const mac = createHmac('sha256', cred.secret).update(corpo).digest('base64url');
  return `${corpo}.${mac}`;
}

export function stateValido(state: string | null): boolean {
  const cred = credenciais();
  if (!cred || !state) return false;
  const partes = state.split('.');
  if (partes.length !== 3) return false;
  const [ts, nonce, mac] = partes;

  const esperado = createHmac('sha256', cred.secret).update(`${ts}.${nonce}`).digest('base64url');
  const a = Buffer.from(mac);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  // Assinatura boa mas velha é tentativa de reuso de link antigo.
  const emitido = Number(ts);
  return Number.isFinite(emitido) && Date.now() - emitido < STATE_MS;
}

export function urlDeAutorizacao(): string {
  const cred = credenciais();
  if (!cred) throw new Error('Melhor Envio sem credenciais');
  const q = new URLSearchParams({
    client_id: cred.id,
    redirect_uri: cred.callback,
    response_type: 'code',
    state: assinarState(),
    scope: ESCOPO,
  });
  return `${baseMelhorEnvio()}/oauth/authorize?${q.toString()}`;
}

// ── troca e renovação ───────────────────────────────────────────────────────

type RespostaToken = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  message?: string;
};

async function pedirToken(corpo: Record<string, string>): Promise<RespostaToken> {
  const r = await fetch(`${baseMelhorEnvio()}/oauth/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent':
        process.env.MELHOR_ENVIO_UA ?? 'Somatec Blocking (comercial@somatecblocking.com.br)',
    },
    body: JSON.stringify(corpo),
    signal: AbortSignal.timeout(10_000),
  });
  const j = (await r.json().catch(() => ({}))) as RespostaToken;
  if (!r.ok || !j.access_token || !j.refresh_token) {
    throw new Error(`oauth/token ${r.status}: ${j.error ?? j.message ?? 'resposta sem token'}`);
  }
  return j;
}

async function gravar(t: RespostaToken): Promise<void> {
  const agora = Date.now();
  // `expires_in` vem em segundos; o refresh a doc dá como 45 dias e a resposta
  // não informa — 45 dias a partir de agora é a leitura conservadora.
  const expiraEm = new Date(agora + (t.expires_in ?? 30 * 24 * 3600) * 1000).toISOString();
  const refreshExpiraEm = new Date(agora + 45 * 24 * 3600 * 1000).toISOString();

  const { error } = await getSupabaseAdminClient()
    .from('melhor_envio_token')
    .upsert({
      id: 1,
      access_token: t.access_token!,
      refresh_token: t.refresh_token!,
      escopo: t.scope ?? ESCOPO,
      expira_em: expiraEm,
      refresh_expira_em: refreshExpiraEm,
      renovando_ate: null,
      atualizado_em: new Date().toISOString(),
    });
  if (error) throw new Error(`nao consegui gravar o token: ${error.message}`);
}

/** Fecha o fluxo: troca o `code` do callback pelo primeiro par de tokens. */
export async function trocarCodePorToken(code: string): Promise<void> {
  const cred = credenciais();
  if (!cred) throw new Error('Melhor Envio sem credenciais');
  await gravar(
    await pedirToken({
      grant_type: 'authorization_code',
      client_id: cred.id,
      client_secret: cred.secret,
      redirect_uri: cred.callback,
      code,
    }),
  );
  log.info('melhor envio autorizado');
}

async function lerLinha(): Promise<TokenGuardado | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from('melhor_envio_token')
    .select('access_token, refresh_token, escopo, expira_em, refresh_expira_em, renovando_ate')
    .eq('id', 1)
    .maybeSingle();
  if (error) {
    log.warn('leitura do token falhou', undefined, error);
    return null;
  }
  return (data as TokenGuardado | null) ?? null;
}

/**
 * Pega a trava de renovação de forma atômica.
 *
 * O UPDATE condicional é a trava: quem conseguir mudar a linha renova; quem
 * não conseguir vê 0 linhas e segue com o token atual, que ainda vale (a
 * margem existe justamente pra isso). Sem essa trava, duas renovações
 * simultâneas queimariam o mesmo refresh — que é de uso único — e a segunda
 * derrubaria a conexão de vez.
 */
async function pegarTrava(): Promise<boolean> {
  const agora = new Date().toISOString();
  const { data, error } = await getSupabaseAdminClient()
    .from('melhor_envio_token')
    .update({ renovando_ate: new Date(Date.now() + TRAVA_MS).toISOString() })
    .eq('id', 1)
    .or(`renovando_ate.is.null,renovando_ate.lt.${agora}`)
    .select('id');
  if (error) {
    log.warn('trava de renovacao falhou', undefined, error);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

async function soltarTrava(): Promise<void> {
  await getSupabaseAdminClient()
    .from('melhor_envio_token')
    .update({ renovando_ate: null })
    .eq('id', 1);
}

async function renovar(linha: TokenGuardado): Promise<string | null> {
  const cred = credenciais();
  if (!cred) return null;

  if (new Date(linha.refresh_expira_em).getTime() <= Date.now()) {
    // Passou dos 45 dias sem renovar: não há o que fazer por código, alguém
    // precisa autorizar de novo no navegador.
    log.error('refresh do Melhor Envio venceu — precisa autorizar de novo');
    return null;
  }

  // Alguém já está renovando: seguir com o token atual é o certo, ele ainda
  // vale — a margem de 5 dias existe pra esta situação.
  if (!(await pegarTrava())) return linha.access_token;

  try {
    const novo = await pedirToken({
      grant_type: 'refresh_token',
      client_id: cred.id,
      client_secret: cred.secret,
      refresh_token: linha.refresh_token,
      scope: ESCOPO,
    });
    await gravar(novo);
    log.info('token do melhor envio renovado');
    return novo.access_token!;
  } catch (err) {
    // Solta a trava: segurar por 2 min uma renovação que falhou só atrasaria a
    // próxima tentativa, e ainda sobram dias de margem.
    await soltarTrava();
    log.error('renovacao falhou', { erro: err instanceof Error ? err.message : String(err) });
    return linha.access_token;
  }
}

/**
 * O token pra usar agora — renovando antes de vencer, se for o caso.
 *
 * `null` significa "não dá pra cotar": sem autorização, ou refresh vencido. O
 * chamador trata como ausência de credencial, e o checkout segue com frete
 * grátis e prazo confirmado no pedido.
 */
export async function obterTokenValido(): Promise<string | null> {
  // Sem client id/secret, o token de env ainda vale: é a ponte pra quem colou
  // um token do painel antes de a gente rodar o OAuth. Env VAZIA conta como
  // ausente — `''` passaria adiante e viraria um Bearer vazio na cotação.
  const doEnv = process.env.MELHOR_ENVIO_TOKEN || null;
  if (!configurado()) return doEnv;

  const linha = await lerLinha();
  if (!linha) return doEnv;

  const vence = new Date(linha.expira_em).getTime();
  if (vence - Date.now() > MARGEM_MS) return linha.access_token;
  return renovar(linha);
}

/**
 * Renova AGORA, sem olhar a margem. Existe pro caso do 401 inesperado.
 *
 * A margem de 5 dias supõe que o `expires_in` do Melhor Envio é verdade. Se
 * não for — ou se o token for revogado do lado de lá — a cotação toma 401
 * antes da hora, e sem isto o frete ficaria mudo até a margem alcançar.
 */
export async function renovarAgora(): Promise<string | null> {
  if (!configurado()) return null;
  const linha = await lerLinha();
  if (!linha) return null;
  const novo = await renovar(linha);
  return novo && novo !== linha.access_token ? novo : null;
}

/**
 * Renovação proativa, chamada pelo cron.
 *
 * O risco que isto cobre é o contrário do movimento: 45 dias sem NINGUÉM cotar
 * matam a conexão, e aí só autorização manual traz de volta. Devolve o que
 * aconteceu pra o cron logar — é assim que se descobre o problema antes de o
 * frete parar.
 */
export async function renovarSePerto(): Promise<
  'sem_config' | 'sem_token' | 'ok' | 'renovado' | 'falhou'
> {
  if (!configurado()) return 'sem_config';
  const linha = await lerLinha();
  if (!linha) return 'sem_token';

  if (new Date(linha.expira_em).getTime() - Date.now() > MARGEM_MS) return 'ok';
  const novo = await renovar(linha);
  return novo && novo !== linha.access_token ? 'renovado' : 'falhou';
}
