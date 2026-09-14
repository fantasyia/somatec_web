import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const OPENAPI_PATH = join(process.cwd(), 'public', 'openapi.json');
const LIGHTHOUSE_PATH = join(process.cwd(), 'lighthouserc.json');

describe('lighthouserc.json', () => {
  const raw = readFileSync(LIGHTHOUSE_PATH, 'utf8');

  it('é JSON válido', () => {
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('declara collect e assert', () => {
    const conf = JSON.parse(raw) as { ci: { collect: unknown; assert: unknown } };
    expect(conf.ci.collect).toBeDefined();
    expect(conf.ci.assert).toBeDefined();
  });

  it('mantém accessibility como error (gate crítico não pode ser rebaixado)', () => {
    const conf = JSON.parse(raw) as {
      ci: { assert: { assertions: Record<string, unknown> } };
    };
    const a11y = conf.ci.assert.assertions['categories:accessibility'];
    expect(Array.isArray(a11y) && a11y[0]).toBe('error');
  });

  it('SEO fica em warn ENQUANTO o site é noindex por decisão de negócio', () => {
    // O site está noindex de propósito (pré-lançamento, SITE_NOINDEX=true) →
    // is-crawlable derruba o SEO e não é regressão de qualidade. Quando liberar
    // a indexação no Google, reverter categories:seo para 'error' (e este teste).
    const conf = JSON.parse(raw) as {
      ci: { assert: { assertions: Record<string, unknown> } };
    };
    const seo = conf.ci.assert.assertions['categories:seo'];
    expect(Array.isArray(seo) && seo[0]).toBe('warn');
  });
});

describe('public/openapi.json', () => {
  const raw = readFileSync(OPENAPI_PATH, 'utf8');
  let spec: Record<string, unknown>;

  it('é JSON válido', () => {
    expect(() => {
      spec = JSON.parse(raw);
    }).not.toThrow();
  });

  it('tem openapi version 3.x', () => {
    spec = JSON.parse(raw);
    expect(spec.openapi).toMatch(/^3\./);
  });

  it('declara info, paths e components', () => {
    spec = JSON.parse(raw);
    expect(spec.info).toBeDefined();
    expect(spec.paths).toBeDefined();
    expect(spec.components).toBeDefined();
  });

  it('cobre as rotas públicas críticas', () => {
    spec = JSON.parse(raw);
    const paths = spec.paths as Record<string, unknown>;
    expect(paths['/api/health']).toBeDefined();
    expect(paths['/api/forms/submit']).toBeDefined();
    expect(paths['/api/lgpd/consent']).toBeDefined();
    expect(paths['/api/revalidate']).toBeDefined();
    expect(paths['/api/cron/process-webhook-queue']).toBeDefined();
  });

  it('FormSubmitInput tem todos os campos obrigatórios alinhados ao schema Zod', () => {
    spec = JSON.parse(raw);
    const components = spec.components as { schemas: Record<string, { required?: string[] }> };
    const required = components.schemas.FormSubmitInput?.required ?? [];
    // Reflete formSubmitSchema do projeto
    expect(required).toContain('form_type');
    expect(required).toContain('email');
    expect(required).toContain('whatsapp');
    expect(required).toContain('lgpd_consent');
  });
});

// =============================================================================
// B7 DA AUDITORIA 13/09 — O CONTRATO PUBLICADO DESCREVIA OUTRO SITE.
//
// O `public/openapi.json` é servido publicamente e renderizado em `/api-docs`.
// Ele documentava `/api/admin/audit-stats`, `/api/admin/audit-trail` e
// `/api/cron/audit-archive` — rotas que NÃO existem (o /admin saiu em 25/08) —
// e omitia `/api/pedidos`, `/api/pedidos/status`, `/api/webhooks/asaas`,
// `/api/frete`, `/api/cep` e `/api/blog/revalidar`, que existem e três delas
// mexem com dinheiro.
//
// A guarda compara com o SISTEMA DE ARQUIVOS: rota nova sem documentação
// reprova, e documentação de rota morta também. Lista escrita à mão é uma
// varredura que decide de antemão o que não vai encontrar.
// =============================================================================

function rotasReais(dir: string, base = '/api', out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) {
      rotasReais(caminho, `${base}/${nome}`, out);
    } else if (nome === 'route.ts') {
      out.push(base);
    }
  }
  return out;
}

describe('openapi.json bate com as rotas que existem', () => {
  const reais = rotasReais(resolve(process.cwd(), 'src/app/api')).sort();
  const doc = JSON.parse(readFileSync(OPENAPI_PATH, 'utf8')) as { paths?: Record<string, unknown> };
  const documentadas = Object.keys(doc.paths ?? {}).sort();

  it('a varredura acha rotas (não passa por estar vazia)', () => {
    expect(reais.length).toBeGreaterThan(10);
  });

  it('nenhuma rota real fica sem documentação', () => {
    const faltando = reais.filter((r) => !documentadas.includes(r));
    expect(faltando, `sem entrada no openapi.json: ${faltando.join(', ')}`).toEqual([]);
  });

  it('nenhuma rota documentada deixou de existir', () => {
    const fantasmas = documentadas.filter((d) => !reais.includes(d));
    expect(
      fantasmas,
      `documentadas mas inexistentes no código: ${fantasmas.join(', ')}`,
    ).toEqual([]);
  });
});
