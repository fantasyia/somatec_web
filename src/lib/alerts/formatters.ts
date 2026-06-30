import type { Alert } from './monitor';

/**
 * Formatters de payload de webhook para diferentes destinos.
 *
 * Escolha do formatter via env `HEALTH_WEBHOOK_FORMAT`:
 *   - 'generic' (default): JSON cru com { source, environment, timestamp, alerts[] }
 *   - 'slack':   Block Kit (compatível com Slack incoming webhook)
 *   - 'discord': Embeds (compatível com Discord webhook)
 *
 * Slack e Discord renderizam mensagens ricas com cores por severity.
 */

export type WebhookFormat = 'generic' | 'slack' | 'discord';

export type FormatterInput = {
  alerts: Alert[];
  environment: string;
  timestamp: string;
};

// Cores hex compatíveis com Slack (sem #) e Discord (decimal)
const COLORS = {
  warning: { slack: '#F2C744', discord: 0xf2c744 },
  critical: { slack: '#E03E2F', discord: 0xe03e2f },
} as const;

function severityEmoji(severity: 'warning' | 'critical'): string {
  return severity === 'critical' ? '🚨' : '⚠️';
}

// -----------------------------------------------------------------------------
// generic
// -----------------------------------------------------------------------------

export function formatGeneric(input: FormatterInput): unknown {
  return {
    source: 'msm-site',
    environment: input.environment,
    timestamp: input.timestamp,
    alerts: input.alerts,
  };
}

// -----------------------------------------------------------------------------
// Slack (Block Kit + attachments fallback)
// -----------------------------------------------------------------------------

export function formatSlack(input: FormatterInput): unknown {
  const env = input.environment;
  const summary = `MSM ${env}: ${input.alerts.length} alerta${input.alerts.length === 1 ? '' : 's'}`;

  const attachments = input.alerts.map((alert) => ({
    color: COLORS[alert.severity].slack,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${severityEmoji(alert.severity)} ${alert.title}`, emoji: true },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: alert.message },
        fields: contextToSlackFields(alert.context).slice(0, 10),
      },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `*key:* \`${alert.key}\`  |  *severity:* ${alert.severity}  |  *env:* ${env}` },
        ],
      },
    ],
  }));

  return {
    text: summary, // fallback text para notifications
    attachments,
  };
}

function contextToSlackFields(ctx: Record<string, unknown> | undefined): Array<{ type: string; text: string }> {
  if (!ctx) return [];
  return Object.entries(ctx).map(([k, v]) => ({
    type: 'mrkdwn',
    text: `*${k}:* \`${formatValue(v)}\``,
  }));
}

// -----------------------------------------------------------------------------
// Discord (Embeds)
// -----------------------------------------------------------------------------

export function formatDiscord(input: FormatterInput): unknown {
  const env = input.environment;

  const embeds = input.alerts.slice(0, 10).map((alert) => ({
    title: `${severityEmoji(alert.severity)} ${alert.title}`.slice(0, 256),
    description: alert.message.slice(0, 4096),
    color: COLORS[alert.severity].discord,
    fields: contextToDiscordFields(alert.context).slice(0, 25),
    footer: { text: `key: ${alert.key} | severity: ${alert.severity} | env: ${env}` },
    timestamp: input.timestamp,
  }));

  return {
    username: 'MSM Health Monitor',
    embeds,
  };
}

function contextToDiscordFields(
  ctx: Record<string, unknown> | undefined,
): Array<{ name: string; value: string; inline: boolean }> {
  if (!ctx) return [];
  return Object.entries(ctx).map(([k, v]) => ({
    name: k.slice(0, 256),
    value: `\`${formatValue(v)}\``.slice(0, 1024),
    inline: true,
  }));
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'string') return v.length > 200 ? v.slice(0, 197) + '...' : v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    const json = JSON.stringify(v);
    return json.length > 200 ? json.slice(0, 197) + '...' : json;
  } catch {
    return '[unserializable]';
  }
}

// -----------------------------------------------------------------------------
// Selector
// -----------------------------------------------------------------------------

export function getFormat(): WebhookFormat {
  const v = (process.env.HEALTH_WEBHOOK_FORMAT ?? '').toLowerCase();
  if (v === 'slack' || v === 'discord' || v === 'generic') return v;
  return 'generic';
}

export function formatWebhookPayload(format: WebhookFormat, input: FormatterInput): unknown {
  switch (format) {
    case 'slack':
      return formatSlack(input);
    case 'discord':
      return formatDiscord(input);
    default:
      return formatGeneric(input);
  }
}
