import type { SendOutcome } from '@/lib/mullerbot/client';

// Backoff exponencial (em segundos): 1min, 5min, 30min, 2h, 12h
export const BACKOFF_SECONDS = [60, 300, 1800, 7200, 43200];
export const DEFAULT_MAX_ATTEMPTS = 5;

export type ComputeAttemptInput = {
  outcome: SendOutcome;
  currentAttempts: number;
  maxAttempts?: number;
};

export type ComputeAttemptResult = {
  status: 'pending' | 'failed' | 'dead';
  attempts: number;
  lastError: string;
  backoffSec: number;
};

/**
 * Função pura: dado o resultado de um envio + tentativas atuais, decide
 * - próximo status (failed → tentar de novo; dead → desistir)
 * - mensagem de erro a registrar
 * - delay até a próxima tentativa
 *
 * Regras:
 * - client_error (4xx) → dead direto (não vai mudar)
 * - >= maxAttempts → dead
 * - caso contrário → failed (retry agendado)
 * - backoff: 60, 300, 1800, 7200, 43200s (clampado ao último)
 */
export function computeAttempt(input: ComputeAttemptInput): ComputeAttemptResult {
  const { outcome, currentAttempts } = input;
  const maxAttempts = input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  // Misconfiguração server-side (env do MullerBot ausente): NÃO consome tentativa
  // e mantém a row retentável (pending). Sem isso, ~5 ticks do cron enterravam
  // leads válidos em 'dead' por um problema de config que não é do payload.
  if (outcome.result === 'not_configured') {
    return { status: 'pending', attempts: currentAttempts, lastError: 'mullerbot_not_configured', backoffSec: 300 };
  }

  const nextAttempts = currentAttempts + 1;
  const isClientError = outcome.result === 'client_error';

  const lastError = formatLastError(outcome);
  const status: 'failed' | 'dead' = isClientError || nextAttempts >= maxAttempts ? 'dead' : 'failed';

  const backoffIdx = Math.min(currentAttempts, BACKOFF_SECONDS.length - 1);
  const backoffSec = BACKOFF_SECONDS[backoffIdx]!;

  return { status, attempts: nextAttempts, lastError, backoffSec };
}

function formatLastError(outcome: SendOutcome): string {
  switch (outcome.result) {
    case 'client_error':
    case 'server_error':
      return `HTTP ${outcome.status}: ${outcome.body}`;
    case 'network_error':
      return `network: ${outcome.message}`;
    case 'not_configured':
      return 'mullerbot_not_configured';
    case 'sent':
      return 'sent';
    default:
      return 'unknown';
  }
}
