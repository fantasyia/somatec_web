import 'server-only';

/**
 * Registry minimalista de métricas em formato Prometheus.
 *
 * Não usa @prometheus/client (~300KB) — implementação leve com counters,
 * gauges e histograms básicos. Métricas vivem em memória do worker, então
 * em deploys com múltiplas instâncias cada uma reporta o próprio subset
 * (typical para sidecars que coletam por instância).
 *
 * Para gateways de federação Prometheus, isso é suficiente; para Grafana
 * Cloud / Datadog, costumam usar Push Gateway separado.
 */

type Labels = Record<string, string | number>;

const counters = new Map<string, Map<string, number>>();
const gauges = new Map<string, Map<string, number>>();
const histograms = new Map<string, HistogramData>();

type HistogramData = {
  buckets: number[]; // upper bounds em ms
  counts: Map<string, number[]>; // labels key → counts por bucket
  sums: Map<string, number>;
  totals: Map<string, number>;
};

const DEFAULT_BUCKETS_MS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

function labelKey(labels: Labels | undefined): string {
  if (!labels || Object.keys(labels).length === 0) return '';
  return Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}="${String(v).replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`)
    .join(',');
}

export function incrementCounter(name: string, labels?: Labels, value = 1): void {
  let m = counters.get(name);
  if (!m) {
    m = new Map();
    counters.set(name, m);
  }
  const key = labelKey(labels);
  m.set(key, (m.get(key) ?? 0) + value);
}

export function setGauge(name: string, value: number, labels?: Labels): void {
  let m = gauges.get(name);
  if (!m) {
    m = new Map();
    gauges.set(name, m);
  }
  m.set(labelKey(labels), value);
}

export function observeHistogram(name: string, valueMs: number, labels?: Labels): void {
  let h = histograms.get(name);
  if (!h) {
    h = {
      buckets: DEFAULT_BUCKETS_MS,
      counts: new Map(),
      sums: new Map(),
      totals: new Map(),
    };
    histograms.set(name, h);
  }
  const key = labelKey(labels);
  let counts = h.counts.get(key);
  if (!counts) {
    counts = new Array(h.buckets.length + 1).fill(0);
    h.counts.set(key, counts);
  }
  // Armazena counts NÃO-cumulativos por bucket. A renderização Prometheus
  // computa o cumulativo. (Se incrementarmos cumulativo aqui também,
  // contamos em dobro no render.)
  let bucketIdx = h.buckets.length; // default = +Inf
  for (let i = 0; i < h.buckets.length; i++) {
    if (valueMs <= h.buckets[i]!) {
      bucketIdx = i;
      break;
    }
  }
  counts[bucketIdx]!++;
  h.sums.set(key, (h.sums.get(key) ?? 0) + valueMs);
  h.totals.set(key, (h.totals.get(key) ?? 0) + 1);
}

/**
 * Renderiza todas as métricas no formato Prometheus text exposition (0.0.4).
 * Inclui HELP/TYPE comments por convenção.
 */
export function renderPrometheus(metadata: Record<string, { help: string; type: 'counter' | 'gauge' | 'histogram' }>): string {
  const lines: string[] = [];

  // Counters
  for (const [name, values] of counters.entries()) {
    const meta = metadata[name];
    if (meta) {
      lines.push(`# HELP ${name} ${meta.help}`);
      lines.push(`# TYPE ${name} ${meta.type}`);
    }
    for (const [labels, value] of values.entries()) {
      lines.push(formatMetric(name, value, labels));
    }
  }

  // Gauges
  for (const [name, values] of gauges.entries()) {
    const meta = metadata[name];
    if (meta) {
      lines.push(`# HELP ${name} ${meta.help}`);
      lines.push(`# TYPE ${name} ${meta.type}`);
    }
    for (const [labels, value] of values.entries()) {
      lines.push(formatMetric(name, value, labels));
    }
  }

  // Histograms
  for (const [name, h] of histograms.entries()) {
    const meta = metadata[name];
    if (meta) {
      lines.push(`# HELP ${name} ${meta.help}`);
      lines.push(`# TYPE ${name} ${meta.type}`);
    }
    for (const [labels, counts] of h.counts.entries()) {
      // Buckets cumulativos
      let cumulative = 0;
      for (let i = 0; i < h.buckets.length; i++) {
        cumulative += counts[i]!;
        const bucketLabels = labels ? `${labels},le="${h.buckets[i]}"` : `le="${h.buckets[i]}"`;
        lines.push(`${name}_bucket{${bucketLabels}} ${cumulative}`);
      }
      cumulative += counts[h.buckets.length]!;
      const infLabels = labels ? `${labels},le="+Inf"` : 'le="+Inf"';
      lines.push(`${name}_bucket{${infLabels}} ${cumulative}`);

      const sum = h.sums.get(labels) ?? 0;
      const total = h.totals.get(labels) ?? 0;
      lines.push(formatMetric(`${name}_sum`, sum, labels));
      lines.push(formatMetric(`${name}_count`, total, labels));
    }
  }

  return lines.join('\n') + '\n';
}

function formatMetric(name: string, value: number, labels: string): string {
  if (!labels) return `${name} ${value}`;
  return `${name}{${labels}} ${value}`;
}

/**
 * Helper de conveniência para contar HTTP responses por rota+status.
 * Chame no final de cada handler que você quiser instrumentar.
 */
export function trackRequest(route: string, status: number): void {
  // Agrupa por classe de status (2xx/3xx/4xx/5xx) para evitar cardinalidade alta
  const statusClass = `${Math.floor(status / 100)}xx`;
  incrementCounter('msm_http_requests_total', { route, status: statusClass });
}

/** Apenas para testes — reseta todo o estado. */
export function __resetForTests(): void {
  counters.clear();
  gauges.clear();
  histograms.clear();
}
