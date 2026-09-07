import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { EMPRESA, CONTACT } from '@/lib/constants/site';

// =============================================================================
// IDENTIFICAÇÃO DO FORNECEDOR — Decreto 7.962/2013 (e-commerce no CDC).
//
// O site VENDE DIRETO (CheckoutNI). O decreto exige razão social, CNPJ,
// endereço físico e e-mail em local de destaque, visíveis antes de fechar a
// compra. Até 07/09 o rodapé e o checkout não tinham nenhum dos quatro — o
// CNPJ estava à mão em 3 arquivos e o endereço só em /contato (achado da
// Master Criador de Fluxo). Esta guarda impede que alguém "limpe" o rodapé
// ou o checkout e o site volte a vender sem dizer quem vende.
// =============================================================================

const ler = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf-8');

describe('identificação legal do fornecedor', () => {
  it('EMPRESA carrega razão social e CNPJ no formato oficial', () => {
    expect(EMPRESA.razaoSocial).toMatch(/LTDA$/);
    expect(EMPRESA.cnpj).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
    expect(EMPRESA.linha).toContain(EMPRESA.razaoSocial);
    expect(EMPRESA.linha).toContain(EMPRESA.cnpj);
    expect(CONTACT.address).toMatch(/\d{5}-\d{3}/); // tem CEP
    expect(CONTACT.email).toMatch(/@somatecblocking\.com\.br$/);
  });

  it.each([
    ['rodapé (toda página)', 'src/components/layout/Footer.tsx'],
    ['checkout NI (antes de pagar)', 'src/components/tools/CheckoutNI.tsx'],
  ])('%s mostra os 4 dados a partir da fonte única', (_, arquivo) => {
    const fonte = ler(arquivo);
    expect(fonte).toMatch(/EMPRESA\.(linha|razaoSocial)/);
    expect(fonte).toContain('CONTACT.address');
    expect(fonte).toContain('CONTACT.email');
  });

  it('razão social e CNPJ NÃO estão escritos à mão fora de site.ts', () => {
    for (const arquivo of [
      'src/app/produtos/page.tsx',
      'src/app/politica-de-privacidade/page.tsx',
      'src/lib/seo/structured-data.ts',
      'src/components/layout/Footer.tsx',
      'src/components/tools/CheckoutNI.tsx',
    ]) {
      const fonte = ler(arquivo);
      expect(fonte, `${arquivo} crava o CNPJ`).not.toContain(EMPRESA.cnpj);
      expect(fonte, `${arquivo} crava a razão social`).not.toContain(EMPRESA.razaoSocial);
    }
  });
});
