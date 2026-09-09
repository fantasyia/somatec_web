import * as Sentry from '@sentry/nextjs';
import { limparEvento } from '@/lib/observabilidade/sentry-limpeza';

// =============================================================================
// SENTRY — lado SERVIDOR (Node e Edge).
//
// O Next chama `register()` uma vez, no boot. Aqui inicializamos o que captura
// erro de rota de API, de render no servidor e de Server Action.
//
// ⚠️ Sem `SENTRY_DSN` nada é inicializado — é o estado de qualquer ambiente que
// não seja produção, e do próprio build. Nada quebra, nada é enviado.
//
// 🔒 `sendDefaultPii: false` + `beforeSend` do `sentry-limpeza`: o corpo da
// requisição não sai, e o que sobra é varrido por e-mail, telefone, CPF/CNPJ e
// nome de campo sensível. Erro deste site carrega LEAD e PEDIDO no contexto —
// sem isso, exportaríamos dado de cliente pra um terceiro.
// =============================================================================

const dsn = process.env.SENTRY_DSN;

export async function register() {
  if (!dsn) return;

  Sentry.init({
    dsn,
    debug: process.env.SENTRY_DEBUG === 'true',
    environment: process.env.NODE_ENV,
    // Amostragem de performance DESLIGADA — mas NÃO por cota: errors e spans
    // são categorias de cobrança separadas no Sentry, e gastar uma não mexe na
    // outra (conferido na conta em 09/09: 3 errors de 1M, spans em 0,5% da
    // franquia). O motivo é que hoje o site não tem tráfego nem pergunta de
    // lentidão pra responder — trace sem volume não vira padrão, vira anedota.
    //
    // ⚠️ Liga quando houver tráfego real. O caso que já pediria isso: o
    // `betinna:pedido` que levou 6,5s (SOMATEC-WEB-2) — sabemos o total e não
    // sabemos onde foi o tempo, que é exatamente o que o trace mostraria.
    tracesSampleRate: 0,
    sendDefaultPii: false,
    beforeSend: limparEvento,
    // O commit que está no ar — é o que liga o erro à mudança que o causou.
    release: process.env.RAILWAY_GIT_COMMIT_SHA,
  });
}

/**
 * Erro de render no servidor (App Router). O Next chama isto com o request, e
 * é o que faz o erro chegar com rota e método em vez de virar log solto.
 */
export const onRequestError = Sentry.captureRequestError;
