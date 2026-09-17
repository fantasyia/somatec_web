import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SOCIALS } from '@/lib/constants/site';
import { organizationSchema } from '@/lib/seo/structured-data';

// =============================================================================
// REDES SOCIAIS — FONTE ÚNICA E VERSIONADA (17/09/2026, decisão do Léo).
//
// O que existia: o rodapé lia `site_settings.socials` do banco; o `sameAs` do
// JSON-LD lia `SOCIALS` (env) direto. Dois caminhos pro mesmo fato, e arrumar
// um deixava o outro errado SEM SINTOMA — a página parece certa nos dois casos.
//
// O estrago real, achado pela sessão de ADS em 17/09: o `sameAs` apontava havia
// semanas pra uma página DUPLICADA do LinkedIn (`/company/somatec-blocking`,
// 60 seguidores) em vez da real (`/company/somatecblocking`, 250), e é provável
// que seja por isso que a marca não resolve num painel de conhecimento do
// Google. Estava também em `pt.linkedin.com` — subdomínio de locale.
//
// ⚖️ POR QUE CONSTANTE, e não env nem banco: rede social da empresa muda
// praticamente nunca, e o que custou caro não foi demorar pra trocar — foi
// ficar errado sem ninguém ver. Valor em env ou em banco não está no
// repositório: não passa por revisão e NENHUM TESTE CONSEGUE OLHAR PRA ELE.
// Este arquivo só existe porque a decisão foi trazer o valor pra cá.
//
// As duas guardas abaixo são exatamente os dois erros que estavam no ar.
// =============================================================================

const FONTE_SITE = readFileSync(resolve(process.cwd(), 'src/lib/constants/site.ts'), 'utf-8');
const FONTE_FOOTER = readFileSync(
  resolve(process.cwd(), 'src/components/layout/Footer.tsx'),
  'utf-8',
);

/** Sem comentários: os arquivos explicam o defeito citando o que a guarda
 *  proíbe, e medir com eles juntos faria a guarda acusar a documentação. */
function semComentarios(fonte: string): string {
  return fonte
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n');
}

const CANONICO: Record<keyof typeof SOCIALS, string> = {
  linkedin: 'https://www.linkedin.com/company/somatecblocking',
  instagram: 'https://www.instagram.com/somatecblocking',
  youtube: 'https://www.youtube.com/c/somatecblocking',
};

describe('os perfis são os oficiais', () => {
  it.each(Object.keys(CANONICO) as (keyof typeof SOCIALS)[])(
    '%s aponta pro perfil certo',
    (rede) => {
      expect(SOCIALS[rede]).toBe(CANONICO[rede]);
    },
  );

  it('🔴 LinkedIn NÃO é a página duplicada de 60 seguidores', () => {
    // `somatec-blocking` (com hífen) é a duplicata; `somatecblocking` é a real,
    // da qual o marketing@ é admin. O hífen é a ÚNICA diferença entre as duas.
    expect(SOCIALS.linkedin, 'voltou pra duplicata do LinkedIn').not.toMatch(
      /company\/somatec-blocking/,
    );
  });

  it('🔴 nenhum perfil usa subdomínio de locale', () => {
    // `pt.linkedin.com` funciona, mas não é o canônico — e era o que estava no
    // ar. Sinal de entidade tem de apontar pra uma URL só.
    for (const url of Object.values(SOCIALS)) {
      expect(url, `${url} usa subdomínio de locale`).toMatch(/^https:\/\/www\./);
    }
  });

  it('todos são https e sem barra no fim', () => {
    for (const url of Object.values(SOCIALS)) {
      expect(url).toMatch(/^https:\/\//);
      expect(url).not.toMatch(/\/$/);
    }
  });
});

describe('🔴 a fonte é o repositório — nem env, nem banco', () => {
  it('SOCIALS não lê variável de ambiente', () => {
    const bloco =
      semComentarios(FONTE_SITE).match(/export const SOCIALS = \{[\s\S]*?\} as const;/)?.[0] ?? '';
    expect(bloco, 'SOCIALS voltou a ler env — o valor sai do alcance do teste').not.toMatch(
      /process\.env/,
    );
    expect(bloco).toContain('linkedin:');
  });

  it('o rodapé lê a constante, não uma prop vinda do banco', () => {
    const codigo = semComentarios(FONTE_FOOTER);
    expect(codigo).toMatch(/href: SOCIALS\.linkedin/);
    expect(codigo, 'a prop `socials` voltou — é o caminho do banco').not.toMatch(
      /socials\?:\s*Socials/,
    );
  });

  it('o rodapé mantém a trava de https (B11)', () => {
    // Continua valendo mesmo com valor constante: é uma linha, e é o que
    // impede um `javascript:` virar link executável no rodapé de TODA página
    // se alguém devolver a fonte pro banco.
    expect(semComentarios(FONTE_FOOTER)).toMatch(/\^https:/);
  });
});

describe('o sameAs do JSON-LD sai da mesma constante', () => {
  it('lista os três, na ordem, com os valores oficiais', () => {
    const s = organizationSchema() as { sameAs?: string[] };
    expect(s.sameAs).toEqual([CANONICO.linkedin, CANONICO.instagram, CANONICO.youtube]);
  });

  it('rodapé e sameAs não podem divergir — é o defeito que originou tudo isto', () => {
    const s = organizationSchema() as { sameAs?: string[] };
    expect(s.sameAs).toContain(SOCIALS.linkedin);
  });
});
