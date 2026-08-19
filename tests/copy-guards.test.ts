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

// =============================================================================
// GUARDA — Regra de ouro NI: a trilha não-industrial é COMPRA DIRETA.
//
// A oferta de locação/comodato ("você só paga quando o resultado for
// comprovado") é exclusiva do industrial. Se o público NI topar com ela, vai
// exigir a mesma condição — foi a objeção do Leandro que tirou o bloco de
// locação da home e reorganizou a arquitetura do site.
//
// Por que virou teste: escrever "paga só quando funcionar" numa LP NI é um bom
// argumento no funil errado, e não daria erro nenhum. Apareceria semanas depois
// como cliente de padaria exigindo comodato, sem ninguém saber de onde veio.
// =============================================================================

const LOCACAO = [/loca[çc][ãa]o/i, /comodato/i, /paga s[óo]\b/i, /s[óo] paga\b/i, /resultado comprovado/i];

/** Arquivos que são 100% NI — o arquivo inteiro é território de compra direta. */
const NI_ARQUIVO_INTEIRO = [
  'src/app/protecao-residencial/page.tsx',
  'src/app/protecao-comercial/page.tsx',
  'src/components/home/HomeNiPaineis.tsx',
  'src/components/tools/CheckoutNI.tsx',
];

/** Arquivos MISTOS: o industrial e o NI dividem o mesmo array (cards do
 *  bifurcador, slides do hero). Aqui a checagem é por BLOCO — recortar por
 *  `id:` é mais honesto que abrir exceção pro arquivo todo, que é a porta pela
 *  qual a regra volta a evaporar. */
const NI_POR_BLOCO: { arquivo: string; ni: string[]; industrial: string }[] = [
  { arquivo: 'src/components/home/HomeBifurcacao.tsx', ni: ['comercio', 'residencial'], industrial: 'industria' },
  { arquivo: 'src/components/home/HomeHero.tsx', ni: ['comercio', 'nao-industrial'], industrial: 'tese' },
];

/** Recorta o objeto que começa em `id: '<alvo>'` e vai até o próximo `id:`. */
function bloco(fonte: string, alvo: string): string {
  const ini = fonte.indexOf(`id: '${alvo}'`);
  if (ini === -1) return '';
  const prox = fonte.indexOf("id: '", ini + 5);
  return fonte.slice(ini, prox === -1 ? fonte.length : prox);
}

describe('regra de ouro — NI nunca vê locação', () => {
  it.each(NI_ARQUIVO_INTEIRO)('%s não oferece locação/comodato', (arquivo) => {
    const fonte = lerCopy(arquivo);
    for (const padrao of LOCACAO) {
      expect(fonte, `"${padrao}" é oferta industrial e não pode estar em ${arquivo}`).not.toMatch(padrao);
    }
  });

  it.each(NI_POR_BLOCO)('$arquivo — os blocos NI não oferecem locação', ({ arquivo, ni, industrial }) => {
    const fonte = lerCopy(arquivo);

    // Âncora: se o recorte parar de achar o bloco industrial (rename de id,
    // refactor do array), o teste dos blocos NI passaria vazio e em silêncio.
    const alvoIndustrial = bloco(fonte, industrial);
    expect(alvoIndustrial, `não achei o bloco '${industrial}' em ${arquivo} — o recorte por id quebrou`).not.toBe('');

    for (const id of ni) {
      const trecho = bloco(fonte, id);
      expect(trecho, `não achei o bloco '${id}' em ${arquivo}`).not.toBe('');
      for (const padrao of LOCACAO) {
        expect(trecho, `"${padrao}" apareceu no bloco NI '${id}' de ${arquivo}`).not.toMatch(padrao);
      }
    }
  });
});

// =============================================================================
// GUARDA — marca de equipamento de terceiro nunca perto de verbo de falha.
//
// Citar a marca é uso nominativo e é defensável: "seu elevador OTIS", "o
// ar-condicionado Daikin" — o enquadramento é "esse equipamento é caro e
// sensível, proteja a eletrônica dele". Sugerir que a marca falha, é ruim ou
// tem defeito, não: não temos autorização dessas marcas.
//
// ⚠️ NÃO confundir com marca de CLIENTE (Nissin, Cinpal, Stampline, Grow Up,
// Acrilex, Bosch, Philips, Colgate…): esses são cases autorizados pelo Léo e
// podem ser citados à vontade, inclusive junto do problema que resolveram.
//
// Vale no site INTEIRO, industrial incluído: "o cliente já tentou de tudo,
// inclusive Siemens e Schneider" é frase de conversa de vendas e não migra
// pro site.
// =============================================================================

const MARCAS_EQUIPAMENTO = [
  'OTIS', 'Schindler', 'Kone', 'Daikin', 'Carrier', 'Jacuzzi', 'Sodramar', 'Gorenje',
  'Elettromec', 'Miele', 'Sub-Zero', 'KNX', 'Control4', 'Siemens', 'WEG', 'Fanuc',
  'ABB', 'Schneider',
];
const VERBOS_FALHA = [
  'queima', 'falha', 'falho', 'defeito', 'pifa', 'estraga', 'ruim', 'problema',
  'não aguenta', 'frágil',
];
/** Raio em caracteres. Se algum texto legítimo cair aqui, ajuste o raio — NÃO
 *  crie exceção por arquivo. */
const RAIO = 120;

function arquivosDeCopy(): string[] {
  const { readdirSync, statSync } = require('node:fs') as typeof import('node:fs');
  const out: string[] = [];
  const anda = (dir: string) => {
    for (const nome of readdirSync(resolve(process.cwd(), dir))) {
      const rel = `${dir}/${nome}`;
      if (statSync(resolve(process.cwd(), rel)).isDirectory()) anda(rel);
      else if (/\.tsx?$/.test(nome)) out.push(rel);
    }
  };
  anda('src/app');
  anda('src/components');
  return out;
}

describe('marca de equipamento de terceiro — citar sim, desmerecer não', () => {
  // String.raw de propósito: com template normal, o `\b` da fronteira de
  // palavra vira o caractere backspace e a varredura não casa NADA — o teste
  // passa verde sem olhar nada. Foi exatamente o que aconteceu na 1ª versão.
  const escapar = (m: string) => m.replace(/[.*+?^${}()|[\]\\-]/g, (c) => `\\${c}`);
  const marcaRe = new RegExp(String.raw`\b(${MARCAS_EQUIPAMENTO.map(escapar).join('|')})\b`, 'gi');
  const verboRe = new RegExp(VERBOS_FALHA.join('|'), 'i');

  it('a própria varredura funciona (a regex casa uma marca de verdade)', () => {
    // Âncora contra o bug acima: sem isto, todo o resto passa em silêncio.
    expect('o inversor Siemens do painel').toMatch(marcaRe);
    expect('queima primeiro').toMatch(verboRe);
    expect('nada aqui').not.toMatch(marcaRe);
  });

  it('nenhuma marca aparece perto de verbo de falha em src/app e src/components', () => {
    const violacoes: string[] = [];
    for (const arquivo of arquivosDeCopy()) {
      const fonte = lerCopy(arquivo);
      for (const m of fonte.matchAll(marcaRe)) {
        const i = m.index ?? 0;
        const janela = fonte.slice(Math.max(0, i - RAIO), i + m[0].length + RAIO);
        const verbo = janela.match(verboRe);
        if (verbo) {
          violacoes.push(`${arquivo}: "${m[0]}" a menos de ${RAIO} caracteres de "${verbo[0]}" → …${janela.replace(/\s+/g, ' ').trim()}…`);
        }
      }
    }
    expect(violacoes, violacoes.join('\n')).toHaveLength(0);
  });

  it('a varredura está mesmo olhando o site (âncora anti-falso-verde)', () => {
    // Se o glob quebrar e devolver zero arquivo, tudo acima passa vazio.
    const arquivos = arquivosDeCopy();
    expect(arquivos.length).toBeGreaterThan(50);
    expect(arquivos).toContain('src/components/home/HomeHero.tsx');
  });
});
