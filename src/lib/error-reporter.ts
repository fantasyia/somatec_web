import 'server-only';
import * as Sentry from '@sentry/nextjs';

// =============================================================================
// Ponte entre o `log.error` do site e o Sentry.
//
// ⚠️ ESTE ARQUIVO MANDAVA O EVENTO À MÃO, E ISSO ERA UM VAZAMENTO.
//
// Até 09/09 aqui morava um remetente próprio: montava o envelope do Sentry na
// unha e dava `fetch` direto na ingestão. Foi escrito quando o SDK não estava
// instalado, e a nota do próprio arquivo dizia "trocar por captureException
// quando o SDK entrar".
//
// O SDK entrou em 09/09 — e com ele o `beforeSend` que varre dado pessoal
// (`src/lib/observabilidade/sentry-limpeza.ts`). Só que o `beforeSend` é do
// SDK: evento que sai por `fetch` próprio NÃO PASSA POR ELE. Na prática, os 33
// `log.error` do site — que são a origem de praticamente todo evento em
// produção — continuavam mandando `extra` e `user` crus pro Sentry, incluindo
// e-mail e o que mais o contexto carregasse.
//
// O teste antigo deste arquivo até travava esse comportamento: ele afirmava que
// `user.email` chegava intacto do outro lado. Estava certo sobre o fato e
// errado sobre o que devia acontecer.
//
// Agora tudo passa pelo SDK. Uma porta só, e ela tem filtro.
// =============================================================================

export type ErrorContext = {
  scope?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: { id?: string; email?: string };
};

/**
 * Manda um erro pro Sentry. Sem DSN, `captureException` é no-op — o SDK nem foi
 * inicializado (ver `src/instrumentation.ts`), então nada sai em dev nem no
 * build.
 *
 * Não lança, nunca: quem chama é o `log.error`, e reporter que quebra o caller
 * transforma um erro registrado em dois erros, sendo um deles sem registro.
 */
export function reportError(error: unknown, ctx: ErrorContext = {}): void {
  try {
    Sentry.captureException(error, {
      tags: { scope: ctx.scope ?? 'app', ...(ctx.tags ?? {}) },
      extra: ctx.extra,
      // O `beforeSend` redige o que for sensível daqui — inclusive o e-mail.
      user: ctx.user,
    });
  } catch {
    // Silêncio proposital: ver acima.
  }
}
