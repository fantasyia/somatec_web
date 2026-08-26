import 'server-only';
import { createLogger } from '@/lib/logger';

const log = createLogger('email');

// =============================================================================
// Envio de e-mail pelo Resend.
//
// Chamada HTTP direta, sem pacote: a API é um POST só, e uma dependência a
// menos num repo compartilhado é uma dependência a menos pra manter.
//
// REGRA DE OURO: e-mail é AVISO, não é a transação. Falha de envio NUNCA pode
// derrubar o que motivou o e-mail — o pedido já está registrado e o cliente já
// tem o número na tela. Por isso tudo aqui devolve resultado em vez de lançar,
// e quem chama decide (e via de regra ignora).
// =============================================================================

const ENDPOINT = 'https://api.resend.com/emails';
const TIMEOUT_MS = 8000;

export type ResultadoEnvio =
  | { enviado: true; id: string }
  | { enviado: false; motivo: 'sem-config' | 'erro'; detalhe?: string };

function remetente(): string | null {
  // Ex.: "Somatec Blocking <pedidos@somatecblocking.com.br>"
  const bruto = process.env.EMAIL_REMETENTE?.trim();
  return bruto || null;
}

export function emailConfigurado(): boolean {
  return Boolean(process.env.RESEND_API_KEY && remetente());
}

export async function enviarEmail(args: {
  para: string;
  assunto: string;
  html: string;
  texto: string;
  responderPara?: string | null;
  /** Aparece no log e ajuda a achar o envio no painel do Resend. */
  marcador?: string;
}): Promise<ResultadoEnvio> {
  const chave = process.env.RESEND_API_KEY;
  const de = remetente();

  if (!chave || !de) {
    // Não é erro: é o estado normal enquanto o Resend não está configurado.
    // Avisa uma vez, em nível de info, pra não poluir log de produção.
    log.info('e-mail não enviado — Resend sem configuração', { marcador: args.marcador });
    return { enviado: false, motivo: 'sem-config' };
  }

  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${chave}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: de,
        to: [args.para],
        subject: args.assunto,
        html: args.html,
        // Sempre com versão em texto: cliente de e-mail que bloqueia HTML,
        // leitor de tela e filtro de spam olham isso. Sem ela, o e-mail cai
        // em spam com mais facilidade.
        text: args.texto,
        ...(args.responderPara ? { reply_to: args.responderPara } : {}),
      }),
      signal: controle.signal,
    });

    const corpo = (await r.json().catch(() => ({}))) as { id?: string; message?: string };

    if (!r.ok) {
      log.error('Resend recusou o envio', {
        status: r.status,
        detalhe: corpo?.message,
        marcador: args.marcador,
      });
      return { enviado: false, motivo: 'erro', detalhe: corpo?.message ?? `HTTP ${r.status}` };
    }

    log.info('e-mail enviado', { id: corpo?.id, marcador: args.marcador });
    return { enviado: true, id: corpo?.id ?? '' };
  } catch (e) {
    const detalhe = e instanceof Error ? e.message : String(e);
    log.error('falha enviando e-mail', { detalhe, marcador: args.marcador });
    return { enviado: false, motivo: 'erro', detalhe };
  } finally {
    clearTimeout(relogio);
  }
}
