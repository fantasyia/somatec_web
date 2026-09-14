import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// =============================================================================
// M13 — "AGENDADO" ERA UM ESTADO QUE NÃO ACONTECIA.
//
// O CMS sempre ofereceu o status com seletor de data, etiqueta e filtro, e
// nada em lugar nenhum publicava o post: a data passava e o artigo ficava
// parado pra sempre, sem erro e sem log. Opção que a tela promete e o sistema
// não cumpre é pior que opção inexistente — a pessoa confia nela.
//
// Três coisas que o teste fixa, e cada uma já foi bug em outro ponto do site:
//  1. o `published_at` é o horário AGENDADO, não o da rodada (o cron roda de 5
//     em 5 min e carimbaria a data errada, e pior em post retroagido);
//  2. duas rodadas cruzadas não publicam duas vezes (o update exige o status
//     antigo, mesma reserva de linha da fila de webhook);
//  3. erro do banco LANÇA, em vez de virar "nenhum agendado" — que é o mesmo
//     silêncio que já escondeu o blog inteiro antes.
// =============================================================================

type LinhaAgendada = { id: string; slug: string; scheduled_at: string };

let agendados: LinhaAgendada[] = [];
let erroDaBusca: unknown = null;
/** Ids cujo update já rodou — simula "outra rodada chegou primeiro". */
let jaPublicados = new Set<string>();
const updatesRecebidos: Record<string, unknown>[] = [];

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: () => ({
    from: () => ({
      select: () => {
        const cadeia = {
          eq: () => cadeia,
          lte: () => cadeia,
          is: () => cadeia,
          limit: () => Promise.resolve({ data: agendados, error: erroDaBusca }),
        };
        return cadeia;
      },
      update: (payload: Record<string, unknown>) => {
        updatesRecebidos.push(payload);
        let id = '';
        const cadeia = {
          eq: (coluna: string, valor: string) => {
            if (coluna === 'id') id = valor;
            return cadeia;
          },
          select: () => {
            // A segunda rodada não acha mais a linha: o status já mudou.
            if (jaPublicados.has(id)) return Promise.resolve({ data: [], error: null });
            jaPublicados.add(id);
            return Promise.resolve({ data: [{ slug: id }], error: null });
          },
        };
        return cadeia;
      },
    }),
  }),
}));

const { publicarAgendados } = await import('@/lib/blog/agendados');

beforeEach(() => {
  agendados = [];
  erroDaBusca = null;
  jaPublicados = new Set();
  updatesRecebidos.length = 0;
});

describe('publicação de post agendado', () => {
  it('sem agendado vencido, não escreve nada', async () => {
    const r = await publicarAgendados();
    expect(r).toEqual([]);
    expect(updatesRecebidos).toHaveLength(0);
  });

  it('publica o que venceu e devolve o slug', async () => {
    agendados = [{ id: 'a1', slug: 'artigo-um', scheduled_at: '2026-09-14T10:00:00.000Z' }];
    const r = await publicarAgendados(new Date('2026-09-14T10:05:00.000Z'));
    expect(r).toEqual([{ slug: 'artigo-um', agendadoPara: '2026-09-14T10:00:00.000Z' }]);
  });

  it('carimba published_at com o horário AGENDADO, não o da rodada', async () => {
    agendados = [{ id: 'a1', slug: 'artigo-um', scheduled_at: '2026-09-10T08:00:00.000Z' }];
    await publicarAgendados(new Date('2026-09-14T10:05:00.000Z'));
    expect(updatesRecebidos[0].published_at).toBe('2026-09-10T08:00:00.000Z');
    expect(updatesRecebidos[0].published).toBe(true);
    expect(updatesRecebidos[0].status).toBe('published');
  });

  it('duas rodadas cruzadas não publicam o mesmo post duas vezes', async () => {
    agendados = [{ id: 'a1', slug: 'artigo-um', scheduled_at: '2026-09-14T10:00:00.000Z' }];
    const primeira = await publicarAgendados(new Date('2026-09-14T10:05:00.000Z'));
    const segunda = await publicarAgendados(new Date('2026-09-14T10:05:01.000Z'));
    expect(primeira).toHaveLength(1);
    expect(segunda).toHaveLength(0);
  });

  it('erro do banco LANÇA em vez de virar "nenhum agendado"', async () => {
    erroDaBusca = { message: 'connection refused' };
    await expect(publicarAgendados()).rejects.toThrow(/agendados/i);
  });
});

// =============================================================================
// O AGENDADOR — leitura de fonte, porque o que se perde aqui é configuração.
// =============================================================================

function fonte(caminho: string): string {
  return readFileSync(resolve(process.cwd(), caminho), 'utf8');
}

describe('agendador interno', () => {
  const agendador = fonte('src/lib/agendador/index.ts');

  it('dispara as TRÊS tarefas de cron', () => {
    expect(agendador).toContain('/api/cron/process-webhook-queue');
    expect(agendador).toContain('/api/cron/health-monitor');
    expect(agendador).toContain('/api/cron/publicar-agendados');
  });

  it('não liga sem CRON_SECRET (as rotas exigem Bearer em produção)', () => {
    expect(agendador).toMatch(/if \(!segredo\)[\s\S]{0,140}return;/);
  });

  it('é idempotente: chamar duas vezes não cria dois timers', () => {
    expect(agendador).toMatch(/if \(ligado\) return;/);
  });

  it('uma rodada que falha não derruba o agendador', () => {
    // Sem o catch, um erro de rede encerraria o timer em silêncio e o cron
    // voltaria a não existir — exatamente o estado que isto conserta.
    expect(agendador).toMatch(/catch \(e\)[\s\S]{0,500}log\.error/);
  });

  it('está ligado no instrumentation, e só no runtime Node', () => {
    const inst = fonte('src/instrumentation.ts');
    expect(inst).toContain('iniciarAgendador()');
    expect(inst).toMatch(/NEXT_RUNTIME === 'nodejs'/);
    // Tem de rodar mesmo sem Sentry: o cron não pode depender do DSN.
    expect(inst.indexOf('iniciarAgendador')).toBeLessThan(inst.indexOf('if (!dsn) return;'));
  });
});

describe('rota de publicação agendada', () => {
  const rota = fonte('src/app/api/cron/publicar-agendados/route.ts');

  it('exige Bearer CRON_SECRET como as outras rotas de cron', () => {
    expect(rota).toMatch(/validateBearer\([\s\S]{0,120}'CRON_SECRET'/);
    expect(rota).toContain('requireInProduction: true');
  });

  it('derruba o cache quando publica — senão o artigo fica invisível', () => {
    expect(rota).toContain('revalidateTag(TAG_BLOG)');
    expect(rota).toMatch(/revalidatePath\('\/blog', 'page'\)/);
    expect(rota).toMatch(/revalidatePath\('\/', 'layout'\)/);
  });

  it('não purga cache à toa quando não publicou nada', () => {
    expect(rota).toMatch(/if \(publicados\.length > 0\) \{/);
  });
});
