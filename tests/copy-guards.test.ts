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
 *  própria guarda. O que vale é o que chega na tela.
 *
 *  ⚠️ A ORDEM IMPORTA, e ela já esteve errada. Tirar os BLOCOS primeiro fazia
 *  um comentário de LINHA contendo `/ferramentas/` seguido de asterisco abrir
 *  um bloco falso, que engolia tudo até o próximo fecha-bloco — 1016
 *  caracteres de CÓDIGO REAL no StickyCta, a oferta industrial inteira junto.
 *  A guarda passava verde sobre um trecho que ela nem chegava a ler.
 *  Linha primeiro, bloco depois. */
function lerCopy(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), 'utf-8')
    .split('\n')
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Mesmo que `lerCopy`, mas com o espaço em branco COLAPSADO.
 *
 *  Frase de JSX quebra em várias linhas por causa do formatador, e o `.` do
 *  regex não atravessa quebra de linha: "diagnóstico da sua planta,\n sem
 *  custo" passava incólume por `/diagnóstico.{0,25}sem custo/`. Quem escreve a
 *  copy não controla onde a linha quebra — a guarda é que tem de ler o texto
 *  como ele chega na tela, numa linha só. */
function lerCopyCorrida(rel: string): string {
  return lerCopy(rel).replace(/\s+/g, ' ');
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

/** Superfícies MISTAS que o teste de arquivo inteiro não cobre. O template de
 *  artigo do blog serve industrial E NI no mesmo arquivo — o que precisa valer
 *  é que a oferta industrial esteja atrás de `ctaNi`, nunca solta. */
const BLOG_ARTIGO = 'src/app/blog/[slug]/page.tsx';

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

describe('template de artigo do blog — a oferta industrial é condicional', () => {
  // Servia os MESMOS dois CTAs industriais em todo artigo, inclusive os de casa
  // e comércio: "você só paga se o resultado for comprovado" (locação) e
  // "Calcular meu prejuízo" (custo de parada, ferramenta industrial). Quem lia
  // sobre home theater levava a oferta industrial duas vezes.
  const fonte = () => lerCopy(BLOG_ARTIGO);

  it('deriva o público do cluster, como as LPs', () => {
    expect(fonte()).toContain('publicoDoCluster');
  });

  it('todo custo-de-parada do template está atrás do ternário de público', () => {
    for (const linha of fonte().split('\n')) {
      if (!linha.includes('/ferramentas/custo-de-parada')) continue;
      expect(linha, `CTA industrial solto: ${linha.trim()}`).toMatch(/ctaNi/);
    }
  });

  it('a promessa de locação não fica solta no template', () => {
    // Ela pode existir (artigo industrial), mas só dentro de um bloco `!ctaNi`.
    const f = fonte();
    const i = f.indexOf('só paga');
    if (i === -1) return;
    // 400 caracteres antes: tem de haver a guarda de público por perto.
    expect(f.slice(Math.max(0, i - 400), i)).toMatch(/ctaNi/);
  });
});

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

// =============================================================================
// GUARDA — não existe mais medição ANTES do contrato.
//
// Mudança comercial (Leandro, 20/08): a Somatec parou de medir na pré-venda.
// A prova virou o software do Master Block, medindo antes e depois DURANTE o
// período de avaliação de 60 a 90 dias, com contrato já fechado.
//
// Por que virou teste: "diagnóstico gratuito" é uma isca boa demais pra não
// voltar sozinha. Ela some da tela, mas volta no primeiro CTA novo que alguém
// escrever — e aí a empresa promete um deslocamento que não faz mais, o cliente
// cobra, e ninguém liga o CTA à mudança comercial que aconteceu meses antes.
//
// ⚠️ Medição como PROVA pós-instalação continua legítima e não é alvo daqui:
// "medição antes e depois", o case Cinpal, os gráficos. O que não pode é
// OFERECER medição/diagnóstico de graça como porta de entrada.
// =============================================================================

const MEDICAO_PREVIA = [
  /medi[çc][ãa]o gratuita/i,
  /medi[çc][ãa]o sem custo/i,
  /medi[çc][ãa]o na sua planta/i,
  /medi[çc][ãa]o na sua rede/i,
  /diagn[óo]stico gratuito/i,
  /diagn[óo]stico.{0,20}sem custo/i,
];

describe('oferta de entrada industrial — nada de medição antes do contrato', () => {
  /** Só o que chega na tela: arquivos de página e de componente. */
  function superficiesDeCopy(): string[] {
    const { readdirSync, statSync } = require('node:fs') as typeof import('node:fs');
    const out: string[] = [];
    const anda = (dir: string) => {
      for (const nome of readdirSync(resolve(process.cwd(), dir))) {
        const rel = `${dir}/${nome}`;
        if (rel.includes('/admin')) continue; // painel interno, não é copy pública
        if (statSync(resolve(process.cwd(), rel)).isDirectory()) anda(rel);
        else if (/\.tsx?$/.test(nome)) out.push(rel);
      }
    };
    anda('src/app');
    anda('src/components');
    anda('src/lib/constants');
    return out;
  }

  it('nenhuma superfície oferece medição ou diagnóstico prévio de graça', () => {
    const violacoes: string[] = [];
    for (const arquivo of superficiesDeCopy()) {
      const fonte = lerCopyCorrida(arquivo);
      for (const padrao of MEDICAO_PREVIA) {
        const m = fonte.match(padrao);
        if (m) violacoes.push(`${arquivo}: "${m[0]}"`);
      }
    }
    expect(violacoes, violacoes.join('\n')).toHaveLength(0);
  });

  it('a varredura está mesmo olhando o site (âncora anti-falso-verde)', () => {
    const arquivos = superficiesDeCopy();
    expect(arquivos.length).toBeGreaterThan(50);
    expect(arquivos).toContain('src/components/layout/StickyCta.tsx');
    expect(arquivos).toContain('src/components/tools/VtcdQuiz.tsx');
  });

  it('medição como PROVA pós-instalação segue permitida', () => {
    // A guarda não pode ser tão larga que apague o argumento que vende.
    for (const padrao of MEDICAO_PREVIA) {
      expect('o software mostra a medição antes e depois').not.toMatch(padrao);
      expect('92% de supressão de VTCD, medida em campo').not.toMatch(padrao);
    }
  });
});


describe('medição e laudos — não é linha de serviço avulsa', () => {
  // Decisão do Léo (24/08): medição e laudos não existem fora da instalação
  // do produto completo. A página /solucoes/medicao-e-laudos foi removida —
  // esta guarda impede que a rota volte por link, menu, sitemap ou ícone.
  const ROTA_MORTA = /\/solucoes\/medicao-e-laudos/;

  function fontesDoSite(): string[] {
    const { readdirSync, statSync } = require('node:fs') as typeof import('node:fs');
    const out: string[] = [];
    const anda = (dir: string) => {
      for (const nome of readdirSync(resolve(process.cwd(), dir))) {
        const rel = `${dir}/${nome}`;
        if (statSync(resolve(process.cwd(), rel)).isDirectory()) anda(rel);
        else if (/\.tsx?$/.test(nome)) out.push(rel);
      }
    };
    anda('src');
    return out;
  }

  it('nenhum arquivo do site aponta pra rota removida', () => {
    const violacoes: string[] = [];
    for (const arquivo of fontesDoSite()) {
      // aqui NÃO se filtra comentário: link em comentário também é rastro
      const fonte = readFileSync(resolve(process.cwd(), arquivo), 'utf-8');
      if (ROTA_MORTA.test(fonte)) violacoes.push(arquivo);
    }
    expect(violacoes, violacoes.join('\n')).toHaveLength(0);
  });

  it('a solução não existe mais no catálogo', () => {
    const catalogo = readFileSync(resolve(process.cwd(), 'src/lib/constants/solucoes.ts'), 'utf-8');
    expect(catalogo).not.toMatch(/slug:\s*'medicao-e-laudos'/);
    expect(catalogo).not.toMatch(/Quero um diagnóstico da minha rede/);
  });

  it('o redirect 301 existe e não leva pra rota morta', () => {
    const config = readFileSync(resolve(process.cwd(), 'next.config.js'), 'utf-8');
    // a URL estava no sitemap: precisa de destino, não de 404
    expect(config).toMatch(/source:\s*'\/solucoes\/medicao-e-laudos',\s*destination:\s*'\/solucoes'/);
    // e nenhum OUTRO redirect pode ter a rota morta como destino
    const destinos = [...config.matchAll(/destination:\s*'([^']+)'/g)].map((m) => m[1]);
    expect(destinos).not.toContain('/solucoes/medicao-e-laudos');
  });

  it('a varredura enxerga o site de verdade (âncora anti-falso-verde)', () => {
    const arquivos = fontesDoSite();
    expect(arquivos.length).toBeGreaterThan(50);
    expect(arquivos).toContain('src/lib/constants/navigation.ts');
    expect(arquivos).toContain('src/app/sitemap.ts');
    // e o regex tem de pegar a rota quando ela aparece de fato
    expect(ROTA_MORTA.test("href: '/solucoes/medicao-e-laudos'")).toBe(true);
  });
});

// =============================================================================
// AS 5 ETAPAS SEM CUSTO -- guarda APOSENTADA em 03/09.
//
// Ela cobrava que "as cinco etapas sem custo" viesse sempre acompanhada da
// palavra "contrato", pra nao ler como teste gratis. A regra que ela protegia
// deixou de existir: o periodo de avaliacao acabou, e com ele as cinco etapas
// como argumento.
//
// O que substituiu esta guarda esta em `tests/oferta-industrial.test.ts`, que
// e mais forte: em vez de exigir uma palavra por perto, proibe o vocabulario
// inteiro da oferta velha em qualquer superficie do site.
// =============================================================================

// =============================================================================
// GUARDA — a CASCATA é projeto INDUSTRIAL, e a página tem de dizer isso.
//
// Desde 03/09 o não-industrial leva UM Master Block, no quadro de entrada:
// nenhum equipamento de casa ou de comércio interfere em outro a ponto de
// justificar aparelho por quadro, nem com quadro ramificado.
//
// As duas LPs NI foram corrigidas naquele dia, mas `/produtos` continuou
// dizendo "um único supressor não basta" sem dizer PRA QUEM. E `/produtos`
// está no menu principal: um dono de comércio chegava ali e lia o oposto do
// que a LP dele acabara de prometer.
//
// A guarda não proíbe a cascata — na indústria ela é o projeto certo. Cobra
// que o público apareça junto, que é o que separa argumento técnico de
// recomendação errada pro leitor errado.
// =============================================================================

describe('a proteção em cascata aparece marcada como industrial', () => {
  const FONTE = lerCopyCorrida('src/app/produtos/page.tsx');

  it('a página fala de cascata (âncora anti-falso-verde)', () => {
    // Se a seção sumir ou for renomeada, as asserções abaixo passariam vazias.
    expect(FONTE).toMatch(/em cascata/i);
    expect(FONTE).toMatch(/um único supressor/i);
  });

  it('o público industrial vem junto do argumento', () => {
    const i = FONTE.search(/um único supressor/i);
    const janela = FONTE.slice(Math.max(0, i - 400), i + 400);
    expect(janela, 'a cascata está sem dizer que é industrial').toMatch(/ind[úu]stria/i);
  });

  it('a página diz o que vale pro NÃO-industrial, e manda pra LP certa', () => {
    // Sem isto, quem é de comércio sai da página com a recomendação errada.
    expect(FONTE).toMatch(/único Master Block no quadro de entrada/i);
    expect(FONTE).toMatch(/\/protecao-comercial/);
    expect(FONTE).toMatch(/\/protecao-residencial/);
  });

  it('⛔ e não oferece locação pro público NI que chega aqui', () => {
    // Regra de ouro: a oferta de locação é exclusiva do industrial. Como a
    // página passou a falar com quem é de comércio/casa, ela entra no escopo.
    for (const padrao of [/comodato/i, /s[óo] paga\b/i]) {
      expect(FONTE, `"${padrao}" não pode estar em /produtos`).not.toMatch(padrao);
    }
  });
});

// =============================================================================
// GUARDA — "diagnóstico" como CTA morreu junto com a medição prévia (20/08).
//
// A Somatec parou de medir antes do contrato. Mas o verbo sobreviveu como
// RÓTULO DE BOTÃO em 8 superfícies, incluindo o CTA principal da home e o H1
// do /contato — quem clicava esperando alguém ir à planta medir ia ouvir que
// não é assim.
//
// A guarda de `MEDICAO_PREVIA` acima não pega isto de propósito: ela proíbe
// "diagnóstico gratuito"/"sem custo", porque medição como PROVA pós-instalação
// segue legítima. O que morreu é o CONVITE.
//
// ⚠️ O que NÃO entra aqui: "Quero avaliar minha cabine primária"
// (`solucoes.ts`). Ali "avaliar" pede o SERVIÇO de manutenção de cabine, que a
// Somatec vende — proibir o verbo inteiro apagaria uma oferta real. Por isso os
// padrões abaixo são frases, não palavras soltas.
// =============================================================================

describe('CTA de diagnóstico não volta como convite', () => {
  const MORTOS = [
    /Solicitar diagn[óo]stico/i,
    /Receba um diagn[óo]stico/i,
    /Vamos diagnosticar/i,
    /Quero avaliar na minha planta/i,
  ];

  function superficiesDeCta(): string[] {
    const { readdirSync, statSync } = require('node:fs') as typeof import('node:fs');
    const out: string[] = [];
    const anda = (dir: string) => {
      for (const nome of readdirSync(resolve(process.cwd(), dir))) {
        const rel = `${dir}/${nome}`;
        if (rel.includes('/admin')) continue;
        if (statSync(resolve(process.cwd(), rel)).isDirectory()) anda(rel);
        else if (/\.tsx?$/.test(nome)) out.push(rel);
      }
    };
    anda('src/app');
    anda('src/components');
    anda('src/lib/constants');
    return out;
  }

  it.each(MORTOS)('%s não aparece em nenhuma superfície', (padrao) => {
    const violacoes: string[] = [];
    for (const arquivo of superficiesDeCta()) {
      const m = lerCopyCorrida(arquivo).match(padrao);
      if (m) violacoes.push(`${arquivo}: "${m[0]}"`);
    }
    expect(violacoes, violacoes.join(' | ')).toHaveLength(0);
  });

  it('a varredura está mesmo olhando o site (âncora anti-falso-verde)', () => {
    const arquivos = superficiesDeCta();
    expect(arquivos.length).toBeGreaterThan(50);
    expect(arquivos).toContain('src/app/contato/page.tsx');
    expect(arquivos).toContain('src/lib/constants/home-fallback.ts');
  });

  it('⛔ a guarda NÃO apaga o serviço de cabine primária', () => {
    // "Quero avaliar minha cabine primária" é pedido de SERVIÇO, não da
    // medição extinta. Se algum padrão passar a casar isso, a guarda virou
    // ampla demais e vai derrubar uma oferta que existe.
    const cabine = 'Quero avaliar minha cabine primária';
    for (const padrao of MORTOS) {
      expect(cabine, `${padrao} está larga demais`).not.toMatch(padrao);
    }
    expect(lerCopy('src/lib/constants/solucoes.ts')).toContain(cabine);
  });

  it('as páginas que perderam o CTA ganharam o aprovado no lugar', () => {
    // Sem isto, apagar o botão passaria na guarda acima e ninguém veria.
    for (const arquivo of [
      'src/app/blog/page.tsx',
      'src/app/blog/[slug]/page.tsx',
      'src/app/industrias/[setor]/page.tsx',
      'src/app/resultados/page.tsx',
      'src/app/a-somatec/comprovacao-e-normas/page.tsx',
    ]) {
      expect(lerCopyCorrida(arquivo), arquivo).toMatch(/Falar com a engenharia/i);
    }
  });

  it('a guarda casa as formas que estavam no ar (âncora)', () => {
    const antes = [
      'Solicitar diagnóstico',
      'Receba um diagnóstico de risco',
      'Vamos diagnosticar a sua planta',
      'Quero avaliar na minha planta',
    ];
    for (const frase of antes) {
      expect(MORTOS.some((p) => p.test(frase)), frase).toBe(true);
    }
  });
});
