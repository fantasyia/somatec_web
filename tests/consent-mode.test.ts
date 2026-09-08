import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CONSENT_DEFAULT_SNIPPET, CONSENT_KEY, CONSENT_KEY_LEGADO } from '@/lib/consent';

// =============================================================================
// NENHUMA TAG SOBE ANTES DO CONSENTIMENTO.
//
// Até 08/09 o GA carregava assim que existisse um ID em `site_settings` — sem
// olhar o banner. Bastava colar o ID pro Google Analytics subir pra quem clicou
// "Apenas essenciais". Não dava erro: o banner gravava a escolha e ninguém a
// lia. O tipo de falha que só aparece numa auditoria de LGPD, tarde demais.
//
// A correção é ordem + estado: o Consent Mode `default` é declarado no <head>,
// negado, ANTES de qualquer container; o `update` sai no clique. Estes testes
// existem porque as duas metades são fáceis de desfazer sem perceber — mover o
// script, ou trocar o default por "granted" pra "resolver" um dado que não
// aparece no relatório.
// =============================================================================

const ler = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf-8');
const LAYOUT = 'src/app/layout.tsx';
const BANNER = 'src/components/layout/CookieBanner.tsx';

describe('Consent Mode — o default', () => {
  it('nega publicidade e analytics por padrão', () => {
    for (const campo of ['ad_storage', 'ad_user_data', 'ad_personalization', 'analytics_storage']) {
      expect(CONSENT_DEFAULT_SNIPPET, `${campo} precisa sair do 'v' (denied até aceitar)`).toMatch(
        new RegExp(`${campo}:\\s*v`),
      );
    }
    // 'v' só vira granted quando a escolha gravada for exatamente 'accepted'.
    expect(CONSENT_DEFAULT_SNIPPET).toMatch(/c === 'accepted' \? 'granted' : 'denied'/);
    // Essencial e segurança podem: não são rastreamento.
    expect(CONSENT_DEFAULT_SNIPPET).toMatch(/functionality_storage: 'granted'/);
    expect(CONSENT_DEFAULT_SNIPPET).toMatch(/security_storage: 'granted'/);
  });

  it('espera o clique antes de deixar a tag disparar', () => {
    // Sem wait_for_update, quem aceita só é medido na página seguinte.
    expect(CONSENT_DEFAULT_SNIPPET).toMatch(/wait_for_update: \d+/);
  });

  it('lê a chave antiga do template MSM, pra não perguntar duas vezes', () => {
    expect(CONSENT_DEFAULT_SNIPPET).toContain(CONSENT_KEY);
    expect(CONSENT_DEFAULT_SNIPPET).toContain(CONSENT_KEY_LEGADO);
    expect(CONSENT_KEY).not.toContain('msm');
  });
});

describe('Consent Mode — a ordem no layout', () => {
  const layout = ler(LAYOUT);

  it('o default é declarado com beforeInteractive', () => {
    expect(layout).toMatch(/id="consent-default"[\s\S]{0,80}beforeInteractive/);
    expect(layout).toContain('CONSENT_DEFAULT_SNIPPET');
  });

  it('o default aparece ANTES do GTM e do GA no arquivo', () => {
    const iConsent = layout.indexOf('consent-default');
    const iGtm = layout.indexOf('gtm.js?id=');
    const iGa = layout.indexOf('gtag/js?id=');
    expect(iConsent).toBeGreaterThan(-1);
    expect(iGtm, 'GTM sumiu do layout').toBeGreaterThan(iConsent);
    expect(iGa, 'GA sumiu do layout').toBeGreaterThan(iConsent);
  });

  it('nenhuma tag carrega sem ID configurado', () => {
    expect(layout).toMatch(/\{gtmId && \(/);
    // GA é fallback: só entra quando NÃO há container, senão conta pageview 2x.
    expect(layout).toMatch(/\{!gtmId && gaId && \(/);
  });
});

describe('Um caminho só de evento — nunca contagem em dobro', () => {
  const analytics = ler('src/lib/analytics.ts');
  const layout = ler(LAYOUT);

  it('com GTM empurra só pro dataLayer; sem GTM chama o gtag', () => {
    // Chamar os dois faria o GA4 receber o mesmo evento pelo gtag E pelo
    // container — relatório em dobro, sem erro nenhum aparecendo.
    expect(analytics).toMatch(/if \(window\.__somatecGTM\)[\s\S]{0,120}dataLayer\?\.push/);
    expect(analytics).toMatch(/\} else \{[\s\S]{0,80}window\.gtag\?\.\('event'/);
  });

  it('a flag é escrita pelo próprio container, antes de ele carregar', () => {
    expect(layout).toMatch(/window\.__somatecGTM=true;\(function\(w,d,s,l,i\)/);
  });

  it('a atribuição NÃO passa por consentimento', () => {
    // stc_attrib é first-party funcional. Gatear quebraria a corrente
    // site→Betinna em silêncio: lead entra sem origem, e não há backfill.
    const attrib = ler('src/lib/attribution.ts');
    expect(attrib).not.toContain('CONSENT_KEY');
    expect(attrib).not.toMatch(/aplicarConsentimento|consent'\)/);
  });
});

describe('Consent Mode — o clique', () => {
  const banner = ler(BANNER);

  it('o banner avisa as tags na hora da escolha', () => {
    expect(banner).toContain('aplicarConsentimento(value)');
  });

  it('o banner grava na chave nova e aceita a antiga na leitura', () => {
    expect(banner).toMatch(/setItem\(CONSENT_KEY, value\)/);
    expect(banner).toContain('CONSENT_KEY_LEGADO');
    // ⛔ Não pode voltar a gravar na chave do outro cliente.
    expect(banner).not.toMatch(/setItem\(CONSENT_KEY_LEGADO/);
  });
});
