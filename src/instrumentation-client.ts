import * as Sentry from '@sentry/nextjs';
import { limparEvento } from '@/lib/observabilidade/sentry-limpeza';

// =============================================================================
// SENTRY — lado NAVEGADOR.
//
// Captura o que só existe na máquina do visitante: erro de componente, promise
// rejeitada, falha de fetch no checkout. É o lado que mais interessa aqui,
// porque o wizard do checkout e as calculadoras são quase todos client.
//
// ⚠️ O DSN do navegador é PÚBLICO por natureza — ele vai no bundle e qualquer
// visitante lê. Não é segredo, e por isso mora numa `NEXT_PUBLIC_`. O que é
// segredo é o token de API do Sentry, que não entra em código nenhum.
//
// 🔒 Mesmo `beforeSend` do servidor: o formulário de contato e o checkout têm
// nome, e-mail, WhatsApp e CPF na tela quando o erro acontece.
// =============================================================================

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    // Ver a nota do servidor: performance desligada pra proteger a cota.
    tracesSampleRate: 0,
    // Replay é caro em cota e grava a TELA do visitante — numa tela que tem
    // CPF e endereço, isso é o oposto do que queremos. Fica fora.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    sendDefaultPii: false,
    beforeSend: limparEvento,
    release: process.env.NEXT_PUBLIC_RELEASE,
  });
}

/** Transição de rota no App Router — sem isto o erro perde a página de origem. */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
