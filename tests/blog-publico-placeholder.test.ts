import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// =============================================================================
// O ANDAIME DA SEÇÃO "BLOG DO PÚBLICO" NÃO PODE VAZAR PRO PÚBLICO.
//
// Léo pediu em 07/09 cards de exemplo nas LPs NI pra validar o layout, já que
// sem artigo publicado a seção some. O risco óbvio de um andaime é ele ficar:
// card falso numa página pública vira print de reunião e depois promessa que a
// empresa não fez.
//
// A trava é a MESMA chave do go-live (`SITE_NOINDEX`), pra que o andaime caia
// no mesmo gesto que abre o site — sem depender de alguém lembrar. Estes
// testes reprovam o build se essa amarra for afrouxada.
// =============================================================================

const ler = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf-8');
const SECAO = 'src/components/lp/BlogDoPublico.tsx';
const ANDAIME = 'src/components/lp/BlogDoPublicoPlaceholder.tsx';

describe('andaime do blog nas LPs NI', () => {
  it('só renderiza com SITE_NOINDEX === "true" (pré-lançamento)', () => {
    const fonte = ler(SECAO);
    expect(fonte).toMatch(/process\.env\.SITE_NOINDEX === 'true'/);
    // e o andaime depende dessa condição, não só de "não tem post"
    expect(fonte).toMatch(/andaime\s*=\s*posts\.length === 0 && preLancamento/);
  });

  it('sem artigo e com o site NO AR, a seção não existe', () => {
    // A guarda de retorno continua de pé: nada de seção vazia nem de card falso
    // depois do go-live.
    expect(ler(SECAO)).toMatch(/if \(posts\.length === 0 && !andaime\) return null;/);
  });

  it('artigo de verdade sempre vence o andaime', () => {
    // O andaime exige posts.length === 0. Um único artigo publicado já o
    // desliga — não existe estado em que os dois apareçam juntos.
    const fonte = ler(SECAO);
    expect(fonte).toMatch(/\{andaime \? \(/);
    expect(fonte).toContain('<BlogDoPublicoPlaceholder');
    expect(fonte).toContain('posts.map((post) => (');
  });

  it('o card falso se declara e não leva a lugar nenhum', () => {
    const fonte = ler(ANDAIME);
    expect(fonte).toContain('Exemplo de layout');
    expect(fonte).toContain('Artigo em preparação');
    // Nada de <Link>/href: card que parece artigo real e clica é pior que vazio.
    expect(fonte).not.toMatch(/<Link|href=/);
  });
});
