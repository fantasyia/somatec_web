import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// =============================================================================
// Guardas de COPY que são risco, não estilo — as que um engenheiro (ou um
// fabricante) contesta e que custam caro pra desdizer. Elas já estavam
// registradas em prosa (icp-setores.md, despachos); aqui viram teste, porque
// comentário não impede ninguém de reescrever a frase daqui a seis meses.
//
// Não é lint de vocabulário: só entra aqui o que não pode ser afirmado.
// =============================================================================

/** Lê o arquivo SEM comentários: a guarda escrita no código cita justamente a
 *  frase proibida ("nunca dizer que protege o carro") e faria o teste acusar a
 *  própria guarda. O que vale é o que chega na tela. */
function lerCopy(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), 'utf-8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n');
}

/** Superfícies que falam do carro elétrico pro público final. */
const SUPERFICIES_EV = [
  'src/components/home/HomeNiPaineis.tsx',
  'src/app/protecao-residencial/page.tsx',
  'src/lib/constants/setores.ts',
];

describe('carro elétrico — escopo é a INSTALAÇÃO de recarga', () => {
  // O Master Block protege wallbox, eletroposto e a rede da casa. A bateria e a
  // eletrônica do veículo são cobertas pelo BMS do próprio carro: dizer que o
  // surto "danifica o carro" implica proteção que não é defensável.
  const PROIBIDO = [
    /danifica o carro\b/i,
    /protege o carro\b/i,
    /o carregador e o carro\b/i,
    /protege a bateria/i,
  ];

  it.each(SUPERFICIES_EV)('%s não promete proteção do veículo', (arquivo) => {
    const fonte = lerCopy(arquivo);
    for (const padrao of PROIBIDO) {
      expect(fonte, `"${padrao}" não pode aparecer em ${arquivo}`).not.toMatch(padrao);
    }
  });
});

describe('rodapé — o site não é só pra indústria', () => {
  // A linha do rodapé aparece em TODA página, inclusive nas LPs de casa e de
  // comércio. "para a indústria" ali desqualificava o leitor NI logo depois de
  // a página inteira ter dito que a solução é pra ele.
  it('a tagline visível cita os três públicos', () => {
    const site = readFileSync(resolve(process.cwd(), 'src/lib/constants/site.ts'), 'utf-8');
    const m = site.match(/tagline:\s*\n?\s*'([^']+)'/);
    expect(m, 'SITE.tagline precisa existir — é o texto lido no rodapé').not.toBeNull();
    expect(m![1]).not.toMatch(/para a indústria\b/i);
    expect(m![1]).toMatch(/ind[úu]stria/i);
    expect(m![1]).toMatch(/com[ée]rcio/i);
    expect(m![1]).toMatch(/resid[êe]ncia/i);
  });

  it('o rodapé usa a tagline, não a meta description', () => {
    const footer = lerCopy('src/components/layout/Footer.tsx');
    expect(footer).toContain('SITE.tagline');
    expect(footer).not.toContain('SITE.description');
  });
});

describe('trilha NI — vocabulário de cliente no corpo das LPs', () => {
  // "surto" é palavra de engenheiro; segue permitida em <title>, slug e
  // JSON-LD, que são campo de busca. O corpo da LP fala como o cliente fala.
  const TECNIQUES = [/\bsurto/i, /energia suja/i, /varia[çc][õo]es mais r[áa]pidas/i, /bloqueador/i];

  it.each(['src/app/protecao-residencial/page.tsx', 'src/app/protecao-comercial/page.tsx'])(
    '%s só usa termo técnico fora do corpo',
    (arquivo) => {
      const fonte = lerCopy(arquivo)
        .split('\n')
        // tira as linhas de metadata/SEO, onde o termo técnico é proposital
        .filter((l) => !/title:|alternates:|canonical|url:/.test(l))
        .join('\n');
      for (const padrao of TECNIQUES) {
        expect(fonte, `"${padrao}" não pode aparecer no corpo de ${arquivo}`).not.toMatch(padrao);
      }
    },
  );
});
