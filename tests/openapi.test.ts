import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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
