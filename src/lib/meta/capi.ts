import 'server-only';
import { createLogger } from '@/lib/logger';
import { getRedis } from '@/lib/redis';

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
// ⚠️ INERTE SEM CREDENCIAL: faltando `META_PIXEL_ID` ou `META_CAPI_TOKEN` — ou
// com qualquer uma das duas VAZIA —, nada é enviado e nada quebra. Nesse caso o
// processo escreve UM aviso (`avisarSemConfig`, abaixo) dizendo qual falta.
//
// ⛔ ESTE COMENTÁRIO NÃO DIZ SE ESTÁ LIGADO EM PRODUÇÃO, e não deve dizer. Até
// 24/09 ele afirmava "Este arquivo ESTÁ enviando em produção" — e estava errado:
// o `META_CAPI_TOKEN` existia no Railway mas VAZIO, e o no-op era calado. A
// frase foi escrita a partir de um redeploy sem mudança de código, que prova que
// ALGUMA variável mudou, não que ela tem valor. Estado de produção não mora em
// comentário: ele envelhece e mente. Pra saber, olhe o log (o aviso de falta de
// config) ou o Gerenciador de Eventos (integração "Navegador e servidor").
//
// 🔒 NADA QUE A PESSOA DIGITOU sai daqui (a partir de 23/09/2026). O que vai é
// identificador de ANÚNCIO — `fbc` (do clique) e `fbp` (cookie do Pixel) — mais
// IP e user-agent da requisição. E-mail e telefone saíam com hash até 23/09;
// a decisão e o motivo estão no comentário do `UsuarioCapi`, abaixo.
// =============================================================================

const VERSAO_API = 'v21.0';
const TIMEOUT_MS = 4000;

// ⛔ E-MAIL E TELEFONE SAÍRAM DAQUI EM 23/09/2026 — decisão do Léo, e os campos
// foram removidos do TIPO de propósito, não só das chamadas.
//
// O que acontecia: o CAPI roda no servidor, servidor não passa pelo banner de
// cookies, e ele mandava hash de e-mail e telefone à Meta mesmo de quem clicou
// "Apenas essenciais". Os dois documentos do site diziam outra coisa — a
// Política de Privacidade condiciona ao aceite e fala em "dados da sua
// navegação", e o aviso do formulário consente com "contato comercial".
//
// A escolha foi alinhar o CÓDIGO ao que os documentos já dizem, em vez de
// reescrever os documentos. Custo real e aceito: a taxa de casamento cai em
// quem trocou de aparelho ou limpou cookie. O que NÃO se perde é a conversão —
// ela continua chegando e continua atribuída à campanha pelo `fbc`/`fbp`.
//
// Por que fora do tipo: enquanto `email` existisse em `UsuarioCapi`, bastava
// alguém passar o campo de novo e nada acusaria — o payload aceitaria calado. Sem
// o campo, o TypeScript recusa antes de rodar. Guarda estrutural é mais forte que
// teste, porque não depende de ninguém ter escrito o teste certo.
export type UsuarioCapi = {
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

// ⛔ O `hash()`, o `normEmail` e o `normTelefone` foram REMOVIDOS junto com os
// campos, em 23/09. Existiam só pra e-mail e telefone, e deixá-los aqui sem uso
// seria um convite: o próximo que quisesse "melhorar a atribuição" encontraria a
// ferramenta pronta e a reconectaria sem passar por decisão nenhuma.
//
// Se algum dia a decisão mudar, o caminho é reescrever com os documentos na mão
// — não desenterrar função órfã. `tests/capi-sem-dado-pessoal.test.ts` reprova o
// retorno delas.

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
  // Mesma régua do `enviarEventoMeta`: as duas decidem "ligado" do mesmo jeito,
  // senão uma diria que está configurado enquanto a outra fica calada.
  return configurada(process.env.META_PIXEL_ID) && configurada(process.env.META_CAPI_TOKEN);
}

// -----------------------------------------------------------------------------
// IDENTIDADE DE ANÚNCIO GUARDADA ATÉ O DINHEIRO ENTRAR
//
// O `Purchase` nasce no webhook do Asaas, e webhook não tem navegador: nada de
// cookie, nada de `fbclid`. Sem `fbp`/`fbc` a Meta ainda recebe a venda, mas
// não consegue ligá-la ao CLIQUE no anúncio — e aí a campanha que gerou a
// compra não recebe o crédito. O relatório fica certo no total e errado em
// tudo que importa pra decidir onde investir.
//
// Então o pedido guarda os dois na criação, quando os cookies existem, e o
// webhook lê depois. Mesmo desenho do `client_id` do GA4, em chave separada:
// são identidades de plataformas diferentes e expiram por motivos diferentes.
//
// 🔒 Só cookie de anúncio aqui — nenhum dado pessoal, e desde 23/09 nenhum
// dado pessoal sai do CAPI em forma nenhuma, nem com hash.
// -----------------------------------------------------------------------------

/** 30 dias: o Asaas reentrega evento muito depois, e boleto vence em 3 dias. */
const TTL_IDENTIDADE_SEGUNDOS = 30 * 24 * 60 * 60;

const chaveIdentidade = (numeroPedido: string) => `somatec:meta:id:${numeroPedido}`;

export type IdentidadeMeta = { fbp: string | null; fbc: string | null };

/** Guarda quem clicou, pra quando o pagamento confirmar. Nunca lança. */
export async function guardarIdentidadeMeta(
  numeroPedido: string,
  identidade: IdentidadeMeta,
): Promise<void> {
  // Sem nenhum dos dois não há o que guardar — e gravar `{null,null}` faria o
  // webhook achar que consultou e não achou, em vez de saber que nunca houve.
  if (!identidade.fbp && !identidade.fbc) return;
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(
      chaveIdentidade(numeroPedido),
      JSON.stringify(identidade),
      'EX',
      TTL_IDENTIDADE_SEGUNDOS,
    );
  } catch (err) {
    // O pior caso é o `Purchase` sair sem atribuição. Não pode derrubar pedido.
    log.warn('nao guardei a identidade Meta do pedido', {
      pedido: numeroPedido,
      erro: String(err).slice(0, 200),
    });
  }
}

export async function lerIdentidadeMeta(numeroPedido: string): Promise<IdentidadeMeta> {
  const vazio: IdentidadeMeta = { fbp: null, fbc: null };
  const redis = getRedis();
  if (!redis) return vazio;
  try {
    const cru = await redis.get(chaveIdentidade(numeroPedido));
    if (!cru) return vazio;
    const d = JSON.parse(cru) as Partial<IdentidadeMeta>;
    return { fbp: d.fbp ?? null, fbc: d.fbc ?? null };
  } catch {
    return vazio;
  }
}

/**
 * Envia um evento pro CAPI. **Nunca lança** — analytics não pode derrubar o
 * lead nem o pedido. O caller aguarda mas ignora o resultado.
 */
/** `true` só com valor de verdade — ausente, vazia e só-espaço contam como falta.
 *  É type guard pra o TypeScript saber que, depois dele, o valor é string. */
function configurada(valor: string | undefined): valor is string {
  return estadoDa(valor) === 'ok';
}

/** Uma vez por processo — ver `avisarSemConfig`. */
let avisouSemConfig = false;

/** Como uma variável está, sem NUNCA revelar o valor. */
function estadoDa(valor: string | undefined): 'ausente' | 'vazia' | 'ok' {
  if (valor === undefined) return 'ausente';
  if (valor.trim() === '') return 'vazia';
  return 'ok';
}

/**
 * Avisa, UMA vez por processo, que a CAPI está desligada por falta de config.
 *
 * Existe porque o no-op era calado. Até 24/09 o `META_CAPI_TOKEN` estava no
 * Railway como string VAZIA, a primeira linha de `enviarEventoMeta` devolvia
 * `sem-config` sem escrever nada, e o log só aparecia quando a Meta recusava ou
 * a rede caía. Resultado: "desligado" produzia o MESMO silêncio que "funcionando"
 * — e foi lido como sucesso por mais de uma sessão.
 *
 * Uma vez por processo, e não a cada evento: o aviso é pra quem lê o log, e
 * repetido a cada lead ele vira ruído que ninguém lê mais.
 *
 * Distingue AUSENTE de VAZIA porque é a diferença que importou: a variável
 * existia no painel, então quem olhava via o nome e achava que estava pronta.
 */
function avisarSemConfig(pixelId: string | undefined, token: string | undefined): void {
  if (avisouSemConfig) return;
  avisouSemConfig = true;
  log.warn('CAPI DESLIGADA — faltando configuração, nenhum evento vai pro servidor da Meta', {
    META_PIXEL_ID: estadoDa(pixelId),
    META_CAPI_TOKEN: estadoDa(token),
  });
}

/** Só pra teste: zera o "já avisei". Não usar em código de produção. */
export function _reiniciarAvisoSemConfigParaTeste(): void {
  avisouSemConfig = false;
}

export async function enviarEventoMeta(evento: EventoCapi): Promise<ResultadoCapi> {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!configurada(pixelId) || !configurada(token)) {
    avisarSemConfig(pixelId, token);
    return { enviado: false, motivo: 'sem-config' };
  }

  const u = evento.usuario;
  // Só identificador de ANÚNCIO e dado de requisição. Nada que a pessoa digitou.
  const user_data: Record<string, unknown> = {
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
