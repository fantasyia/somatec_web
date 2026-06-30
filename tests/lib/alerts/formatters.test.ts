import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  formatGeneric,
  formatSlack,
  formatDiscord,
  formatWebhookPayload,
  getFormat,
} from '@/lib/alerts/formatters';
import type { Alert } from '@/lib/alerts/monitor';

const SAMPLE_INPUT = {
  environment: 'production',
  timestamp: '2026-05-17T18:00:00.000Z',
  alerts: [
    {
      key: 'queue.dead.warning',
      severity: 'warning',
      title: 'Webhook queue: dead acumulando',
      message: '15 mensagens dead.',
      context: { dead: 15 },
    },
    {
      key: 'supabase.down',
      severity: 'critical',
      title: 'Supabase indisponível',
      message: 'Probe falhou.',
      context: { latency_ms: 5000, error: 'timeout' },
    },
  ] as Alert[],
};

afterEach(() => vi.unstubAllEnvs());

describe('formatGeneric', () => {
  it('retorna o shape original (source/environment/timestamp/alerts)', () => {
    const out = formatGeneric(SAMPLE_INPUT) as Record<string, unknown>;
    expect(out.source).toBe('msm-site');
    expect(out.environment).toBe('production');
    expect(out.timestamp).toBe('2026-05-17T18:00:00.000Z');
    expect(Array.isArray(out.alerts)).toBe(true);
    expect((out.alerts as Alert[])).toHaveLength(2);
  });
});

describe('formatSlack', () => {
  it('inclui text fallback + attachments por alerta', () => {
    const out = formatSlack(SAMPLE_INPUT) as { text: string; attachments: unknown[] };
    expect(out.text).toContain('2 alertas');
    expect(out.text).toContain('production');
    expect(out.attachments).toHaveLength(2);
  });

  it('attachment de warning usa cor amarela #F2C744', () => {
    const out = formatSlack(SAMPLE_INPUT) as { attachments: Array<{ color: string }> };
    expect(out.attachments[0]!.color).toBe('#F2C744');
  });

  it('attachment de critical usa cor vermelha #E03E2F', () => {
    const out = formatSlack(SAMPLE_INPUT) as { attachments: Array<{ color: string }> };
    expect(out.attachments[1]!.color).toBe('#E03E2F');
  });

  it('header tem emoji de severity', () => {
    const out = formatSlack(SAMPLE_INPUT) as {
      attachments: Array<{ blocks: Array<{ type: string; text?: { text: string } }> }>;
    };
    const warnHeader = out.attachments[0]!.blocks.find((b) => b.type === 'header');
    const critHeader = out.attachments[1]!.blocks.find((b) => b.type === 'header');
    expect(warnHeader?.text?.text).toContain('⚠️');
    expect(critHeader?.text?.text).toContain('🚨');
  });

  it('singular "1 alerta" quando só 1 alerta', () => {
    const out = formatSlack({ ...SAMPLE_INPUT, alerts: [SAMPLE_INPUT.alerts[0]!] }) as { text: string };
    expect(out.text).toContain('1 alerta');
    expect(out.text).not.toContain('1 alertas');
  });

  it('context vira fields mrkdwn', () => {
    const out = formatSlack({ ...SAMPLE_INPUT, alerts: [SAMPLE_INPUT.alerts[1]!] }) as {
      attachments: Array<{ blocks: Array<{ type: string; fields?: Array<{ text: string }> }> }>;
    };
    const section = out.attachments[0]!.blocks.find((b) => b.type === 'section');
    const fieldsText = section?.fields?.map((f) => f.text).join(' ') ?? '';
    expect(fieldsText).toContain('latency_ms');
    expect(fieldsText).toContain('5000');
    expect(fieldsText).toContain('error');
  });
});

describe('formatDiscord', () => {
  it('username + embeds por alerta', () => {
    const out = formatDiscord(SAMPLE_INPUT) as { username: string; embeds: unknown[] };
    expect(out.username).toBe('MSM Health Monitor');
    expect(out.embeds).toHaveLength(2);
  });

  it('color de critical é decimal vermelho', () => {
    const out = formatDiscord(SAMPLE_INPUT) as { embeds: Array<{ color: number }> };
    expect(out.embeds[1]!.color).toBe(0xe03e2f);
  });

  it('color de warning é decimal amarelo', () => {
    const out = formatDiscord(SAMPLE_INPUT) as { embeds: Array<{ color: number }> };
    expect(out.embeds[0]!.color).toBe(0xf2c744);
  });

  it('footer inclui key + severity + env', () => {
    const out = formatDiscord(SAMPLE_INPUT) as {
      embeds: Array<{ footer: { text: string } }>;
    };
    expect(out.embeds[0]!.footer.text).toContain('queue.dead.warning');
    expect(out.embeds[0]!.footer.text).toContain('warning');
    expect(out.embeds[0]!.footer.text).toContain('production');
  });

  it('context vira fields inline', () => {
    const out = formatDiscord({ ...SAMPLE_INPUT, alerts: [SAMPLE_INPUT.alerts[1]!] }) as {
      embeds: Array<{ fields: Array<{ name: string; value: string; inline: boolean }> }>;
    };
    const fields = out.embeds[0]!.fields;
    expect(fields.find((f) => f.name === 'latency_ms')?.value).toContain('5000');
    expect(fields.every((f) => f.inline)).toBe(true);
  });

  it('limita embeds a 10 (limit do Discord webhook)', () => {
    const many = Array.from({ length: 15 }, (_, i) => ({
      key: `test.${i}`,
      severity: 'warning' as const,
      title: `Alert ${i}`,
      message: 'm',
    }));
    const out = formatDiscord({ ...SAMPLE_INPUT, alerts: many }) as { embeds: unknown[] };
    expect(out.embeds).toHaveLength(10);
  });
});

describe('getFormat', () => {
  it('default = generic quando env ausente', () => {
    vi.stubEnv('HEALTH_WEBHOOK_FORMAT', '');
    expect(getFormat()).toBe('generic');
  });

  it('aceita slack', () => {
    vi.stubEnv('HEALTH_WEBHOOK_FORMAT', 'slack');
    expect(getFormat()).toBe('slack');
  });

  it('aceita SLACK uppercase', () => {
    vi.stubEnv('HEALTH_WEBHOOK_FORMAT', 'SLACK');
    expect(getFormat()).toBe('slack');
  });

  it('aceita discord', () => {
    vi.stubEnv('HEALTH_WEBHOOK_FORMAT', 'discord');
    expect(getFormat()).toBe('discord');
  });

  it('valor desconhecido cai em generic', () => {
    vi.stubEnv('HEALTH_WEBHOOK_FORMAT', 'teams');
    expect(getFormat()).toBe('generic');
  });
});

describe('formatWebhookPayload (dispatcher)', () => {
  it('dispatcha para o formatter correto', () => {
    const generic = formatWebhookPayload('generic', SAMPLE_INPUT) as { source: string };
    const slack = formatWebhookPayload('slack', SAMPLE_INPUT) as { text: string };
    const discord = formatWebhookPayload('discord', SAMPLE_INPUT) as { username: string };
    expect(generic.source).toBe('msm-site');
    expect(slack.text).toContain('alertas');
    expect(discord.username).toBe('MSM Health Monitor');
  });
});

describe('truncação defensiva', () => {
  it('valores muito longos no context são truncados', () => {
    const longCtx = { huge: 'x'.repeat(1000) };
    const alert: Alert = {
      key: 'x',
      severity: 'warning',
      title: 't',
      message: 'm',
      context: longCtx,
    };
    const slack = formatSlack({ ...SAMPLE_INPUT, alerts: [alert] }) as {
      attachments: Array<{ blocks: Array<{ type: string; fields?: Array<{ text: string }> }> }>;
    };
    const section = slack.attachments[0]!.blocks.find((b) => b.type === 'section');
    const text = section?.fields?.[0]?.text ?? '';
    // <200 chars total (não inclui o 'x'.repeat(1000))
    expect(text.length).toBeLessThan(300);
    expect(text).toContain('...');
  });
});
