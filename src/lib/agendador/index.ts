import 'server-only';
import { createLogger } from '@/lib/logger';

const log = createLogger('agendador');

// =============================================================================
// AGENDADOR INTERNO — o cron que não existia (achado em 14/09/2026).
//
// O README documenta duas rotinas de 5 em 5 minutos desde sempre, e NENHUMA
// rodava: o projeto no Railway tem só Redis e o site, sem serviço de cron.
// Conferido no registro de acessos — zero chamadas em `/api/cron/*` em 90
// minutos, quando deveriam ser cerca de 18.
//
// O que estava desligado, e por que importa:
//
//  · `process-webhook-queue` — o site grava o lead na fila ANTES de tentar
//    mandar pro CRM, justamente pra não perder lead se o processo cair. Se o
//    envio falha, a linha fica `pending` esperando a retentativa. Sem cron, ela
//    espera pra sempre. A fila está vazia hoje porque os envios passam de
//    primeira; a rede de segurança é que estava desatada — e o dia em que ela
//    importa é o dia em que o CRM está fora.
//  · `health-monitor` — nenhum alerta saía.
//
// POR QUE DENTRO DO PRÓPRIO PROCESSO (decisão do Léo, 14/09): o trabalho
// acontece numa rota DESTE site. Um serviço de cron separado bateria numa
// porta fechada se o site caísse, então o isolamento que ele venderia é quase
// nenhum aqui — e custaria ~US$ 1,50/mês. Os dois riscos do agendador interno
// já estão cobertos: reinício só adia a rodada em 5 minutos, e duas instâncias
// não duplicam nada, porque a fila reserva a linha antes de processar e o
// monitor tem trava no Redis.
//
// ⚠️ Chama por HTTP no próprio servidor, de propósito. As tarefas usam
// `revalidateTag`, que precisa de contexto de requisição — invocar a função
// direto de um timer publicaria no banco e deixaria o cache velho.
// =============================================================================

/** Railway não garante o minuto; 5 min é o intervalo documentado das rotas. */
const INTERVALO_MS = 5 * 60 * 1000;

/** Tarefas escalonadas pra não baterem no mesmo segundo do boot. */
const TAREFAS: { rota: string; atrasoInicialMs: number }[] = [
  { rota: '/api/cron/process-webhook-queue', atrasoInicialMs: 30_000 },
  { rota: '/api/cron/health-monitor', atrasoInicialMs: 60_000 },
  { rota: '/api/cron/publicar-agendados', atrasoInicialMs: 90_000 },
];

let ligado = false;

function baseLocal(): string {
  const porta = process.env.PORT || '3000';
  return `http://127.0.0.1:${porta}`;
}

async function rodar(rota: string, segredo: string): Promise<void> {
  const inicio = Date.now();
  try {
    const r = await fetch(`${baseLocal()}${rota}`, {
      headers: { authorization: `Bearer ${segredo}` },
      signal: AbortSignal.timeout(60_000),
      cache: 'no-store',
    });
    if (!r.ok) {
      log.warn('tarefa agendada respondeu erro', { rota, status: r.status });
      return;
    }
    // ⚠️ LOG NO SUCESSO, de propósito. O defeito que isto conserta durou meses
    // porque uma rotina que nunca roda é indistinguível de uma rotina que roda
    // e não acha trabalho: as duas são silêncio. Uma linha por rodada é o que
    // permite responder "o cron está vivo?" olhando o log, em vez de deduzir.
    log.info('tarefa agendada ok', { rota, status: r.status, ms: Date.now() - inicio });
  } catch (e) {
    // Uma rodada que falha não pode derrubar o agendador: a próxima sai em 5
    // minutos. Sem este catch, um erro de rede encerraria o timer em silêncio
    // e o cron voltaria a não existir — exatamente o estado que isto conserta.
    log.error('tarefa agendada falhou', { rota }, e);
  }
}

/**
 * Liga o agendador. Idempotente: chamar duas vezes não cria dois timers.
 *
 * Fica desligado sem `CRON_SECRET` — as rotas exigem o Bearer em produção, e
 * bater nelas sem segredo só encheria o log de 401.
 */
export function iniciarAgendador(): void {
  if (ligado) return;

  const segredo = (process.env.CRON_SECRET ?? '').split(',')[0]?.trim();
  if (!segredo) {
    log.warn('agendador não ligado: CRON_SECRET ausente');
    return;
  }

  ligado = true;
  for (const { rota, atrasoInicialMs } of TAREFAS) {
    setTimeout(() => {
      void rodar(rota, segredo);
      const t = setInterval(() => void rodar(rota, segredo), INTERVALO_MS);
      // Timer de fundo não deve segurar o processo no encerramento.
      t.unref?.();
    }, atrasoInicialMs).unref?.();
  }

  log.info('agendador interno ligado', {
    intervalo_min: INTERVALO_MS / 60_000,
    tarefas: TAREFAS.map((t) => t.rota),
  });
}
