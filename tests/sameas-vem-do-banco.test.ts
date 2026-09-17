import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { organizationSchema } from '@/lib/seo/structured-data';

// =============================================================================
// O `sameAs` SAI DA MESMA FONTE DO RODAPÉ — unificação de 17/09/2026.
//
// O que existia: o rodapé lia `site_settings.socials` do banco; o `sameAs` do
// JSON-LD lia `SOCIALS` (env) direto. Dois caminhos pro mesmo dado, e o do
// JSON-LD era o MUDO — quem trocasse a rede social pelo banco, que é o jeito
// documentado de mudar sem deploy, arrumava o link visível e deixava errado
// justamente o campo que o Google usa pra amarrar a entidade. A página parece
// certa nos dois casos.
//
// Não é hipótese: em 17/09 a sessão de ADS achou o `sameAs` apontando pra uma
// página DUPLICADA do LinkedIn (60 seguidores em vez dos 250 da real), e por
// isso a marca não resolvia num painel de conhecimento. Mesma família das duas
// chaves do NOINDEX — dois lugares pro mesmo fato, um deles sem sintoma.
//
// A guarda mira nas duas pontas: a função tem de ACEITAR o valor de fora, e a
// home tem de PASSAR o do banco. Só a primeira deixaria o defeito voltar
// inteiro — a função pronta e ninguém usando.
// =============================================================================

const FONTE_HOME = readFileSync(resolve(process.cwd(), 'src/app/page.tsx'), 'utf-8');
const FONTE_SCHEMA = readFileSync(
  resolve(process.cwd(), 'src/lib/seo/structured-data.ts'),
  'utf-8',
);

/** Sem comentários: os dois arquivos explicam o defeito citando o que a guarda
 *  proíbe, e medir com eles juntos faria a guarda acusar a documentação. */
function semComentarios(fonte: string): string {
  return fonte
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n');
}

const HOME = semComentarios(FONTE_HOME);

describe('organizationSchema aceita as redes de fora', () => {
  it('usa o que recebe, não a env', () => {
    const s = organizationSchema({
      linkedin: 'https://www.linkedin.com/company/do-banco',
      instagram: null,
      youtube: null,
    }) as { sameAs?: string[] };

    expect(s.sameAs).toEqual(['https://www.linkedin.com/company/do-banco']);
  });

  it('rede nula não vira string vazia dentro do sameAs', () => {
    // `sameAs: [""]` é pior que ausente: o Google lê uma referência quebrada.
    const s = organizationSchema({ linkedin: null, instagram: null, youtube: null }) as {
      sameAs?: string[];
    };
    expect(s.sameAs).toBeUndefined();
  });

  it('preserva a ordem linkedin → instagram → youtube', () => {
    const s = organizationSchema({
      linkedin: 'https://li',
      instagram: 'https://ig',
      youtube: 'https://yt',
    }) as { sameAs?: string[] };
    expect(s.sameAs).toEqual(['https://li', 'https://ig', 'https://yt']);
  });
});

describe('🔴 a home PASSA o valor do banco', () => {
  it('chama organizationSchema com argumento — sem isso a unificação é decorativa', () => {
    expect(
      HOME,
      'organizationSchema() sem argumento volta a ler a env e o defeito retorna',
    ).toMatch(/organizationSchema\(\s*socials\s*\)/);
    expect(HOME).not.toMatch(/organizationSchema\(\s*\)/);
  });

  it('resolve as redes pelo mesmo getter do rodapé', () => {
    expect(HOME).toMatch(/comFallback\(\s*getSocials\s*,\s*SOCIALS_FALLBACK/);
  });

  it('usa comFallback, não o getter cru', () => {
    // Banco fora do ar sem `comFallback` grava o vazio no cache de 1h (A4 da
    // auditoria): a home ficaria sem sameAs por uma hora depois de um blip.
    expect(HOME).not.toMatch(/await\s+getSocials\(\)/);
  });
});

describe('a assinatura não volta a ler a env por dentro', () => {
  it('o sameAs é montado a partir do parâmetro', () => {
    const codigo = semComentarios(FONTE_SCHEMA);
    expect(codigo).toMatch(/const redes = socials \?\? SOCIALS;/);
    expect(codigo, 'sameAs não pode voltar a ler SOCIALS direto').not.toMatch(
      /sameAs = \[SOCIALS\./,
    );
  });
});
