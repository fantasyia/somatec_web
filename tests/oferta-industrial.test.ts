import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { OFERTA_INDUSTRIAL, GARANTIA } from '@/lib/constants/oferta-industrial';

// =============================================================================
// A OFERTA MUDOU EM 03/09 — e a antiga não pode voltar.
//
// Até esta data o site prometia, em nove páginas, "período de avaliação de 60 a
// 90 dias, você só paga se o resultado for comprovado". A empresa parou de
// fazer isso. Enquanto a copy não caiu, o site prometeu por escrito uma coisa
// que a Somatec não entrega mais.
//
// A varredura anterior (`tests/copy-guards.test.ts`) exigia que a frase viesse
// acompanhada da palavra "contrato". Era uma guarda sobre a REDAÇÃO da oferta
// velha; agora a oferta velha não existe, e o que se guarda é o vocabulário
// inteiro.
//
// ⚠️ Por que uma guarda de vocabulário se justifica aqui: a frase estava
// copiada e colada em nove arquivos. Ninguém que reescreva uma delas daqui a
// seis meses vai lembrar que o modelo comercial mudou — e escrever "só paga se
// funcionar" é um bom argumento, o que torna a volta provável, não improvável.
// =============================================================================

/** Lê o arquivo SEM comentários. As explicações do conserto citam justamente as
 *  frases proibidas ("era 60 a 90 dias"), e medir com elas junto faria a guarda
 *  acusar a própria explicação.
 *
 *  ⚠️ A ordem é LINHA primeiro, bloco depois — a mesma de `copy-guards.test.ts`,
 *  e pelo mesmo motivo registrado lá: tirar os blocos antes faz um comentário de
 *  linha com `/…/` seguido de asterisco abrir um bloco falso, que engole código
 *  real até o próximo fecha-bloco. */
function lerCopy(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), 'utf-8')
    .split('\n')
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ');
}

/** Tudo que chega na tela: páginas, componentes e as constantes de copy. */
function superficies(): string[] {
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
  anda('src/lib/pdf');
  return out;
}

// =============================================================================
// 1. O VOCABULÁRIO APOSENTADO
// =============================================================================

/** Cada padrão vem com o TRECHO REAL que estava no ar em 02/09 e que ele existe
 *  pra impedir de voltar. O exemplo não é decoração: é a âncora que prova que a
 *  regex ainda casa — uma regex que não casa mais nada passa verde sem ler. */
const APOSENTADO: { padrao: RegExp; oQueEra: string; exemplo: string }[] = [
  {
    padrao: /per[íi]odo de avalia[çc][ãa]o/i,
    oQueEra: 'o período que deixou de existir',
    exemplo: 'instalação e período de avaliação (60 a 90 dias) — são sem custo',
  },
  {
    padrao: /avalia[çc][ãa]o sem risco/i,
    oQueEra: 'o nome comercial da oferta velha',
    exemplo: 'Avaliação sem risco: você só paga se o resultado for comprovado.',
  },
  {
    padrao: /investimento sem risco/i,
    oQueEra: 'idem, na outra redação',
    exemplo: 'o nosso modelo de investimento sem risco',
  },
  {
    padrao: /60 a 90 dias/i,
    oQueEra: 'o prazo do período de avaliação',
    exemplo: 'se o resultado for comprovado em 60 a 90 dias',
  },
  {
    padrao: /(cinco|5) (primeiras )?etapas/i,
    oQueEra: 'as etapas como argumento comercial',
    exemplo: 'As cinco etapas — levantamento, projeto, proposta, instalação e avaliação',
  },
  {
    padrao: /resultado for comprovado/i,
    oQueEra: 'a promessa que a empresa parou de fazer',
    exemplo: 'você só passa a pagar se o resultado for comprovado',
  },
  {
    padrao: /resultado for aprovado/i,
    oQueEra: 'a mesma promessa, outra palavra',
    exemplo: 'a mensalidade só começa se o resultado for aprovado',
  },
  {
    padrao: /se aprovar o resultado/i,
    oQueEra: 'idem',
    exemplo: 'depois de toda essa jornada, e só se aprovar o resultado',
  },
  {
    padrao: /s[óo] (passa a )?paga(r)? se/i,
    oQueEra: 'a condicional que sumiu da oferta',
    exemplo: 'Você só paga se o resultado for comprovado.',
  },
  {
    padrao: /garantia de 3 anos/i,
    oQueEra: 'o registro de garantia aposentado em 03/09',
    exemplo: 'Garantia de 3 anos (+1 com depoimento)',
  },
];

describe('o vocabulário da oferta velha não aparece em lugar nenhum', () => {
  it.each(APOSENTADO)('$oQueEra — $padrao', ({ padrao }) => {
    const violacoes: string[] = [];
    for (const arquivo of superficies()) {
      const m = lerCopy(arquivo).match(padrao);
      if (m) violacoes.push(`${arquivo}: "${m[0]}"`);
    }
    expect(violacoes, violacoes.join(' | ')).toHaveLength(0);
  });

  it('a varredura está mesmo olhando o site (âncora anti-falso-verde)', () => {
    // Sem isto, um glob quebrado faria TODAS as guardas acima passarem vazias —
    // que é o pior desfecho possível pra uma varredura.
    const arquivos = superficies();
    expect(arquivos.length).toBeGreaterThan(50);
    expect(arquivos).toContain('src/components/home/HomeNoRisk.tsx');
    expect(arquivos).toContain('src/components/layout/StickyCta.tsx');
    expect(arquivos).toContain('src/lib/pdf/projeto-industrial.ts');
    expect(arquivos).toContain('src/lib/constants/oferta-industrial.ts');
  });

  it.each(APOSENTADO)('$oQueEra — a regex ainda pega o trecho real que estava no ar', ({ padrao, exemplo }) => {
    // Âncora do outro lado: regex que parou de casar deixaria a copy velha
    // voltar em silêncio, que é o pior desfecho pra uma guarda de vocabulário.
    expect(exemplo, `a regex ${padrao} não casa mais o texto que ela existe pra pegar`).toMatch(padrao);
  });

  it('as guardas não apagam o texto NOVO', () => {
    // Guarda larga demais tornaria impossível escrever a oferta que vale hoje.
    for (const { padrao } of APOSENTADO) {
      expect(OFERTA_INDUSTRIAL.paragrafo, String(padrao)).not.toMatch(padrao);
      expect(OFERTA_INDUSTRIAL.curta, String(padrao)).not.toMatch(padrao);
      expect(GARANTIA.ni, String(padrao)).not.toMatch(padrao);
    }
  });
});

// =============================================================================
// 2. 🔒 O QUE NÃO PODE APARECER — duração do contrato
//
// O contrato é de prazo fixo e esse número é INTERNO. E os 12 meses são o prazo
// pra encerrar sem custo, nunca a duração do contrato: escrever "contrato de 12
// meses" inverte o sentido do único argumento que a oferta nova tem.
// =============================================================================

describe('🔒 a duração do contrato não vaza pro site', () => {
  const PROIBIDO = [
    /contrato de \d+ meses/i,
    /contrato de \d+ anos/i,
    /por \d+ meses de contrato/i,
    /fidelidade de \d+/i,
  ];

  it.each(PROIBIDO)('%s não aparece em nenhuma superfície', (padrao) => {
    const violacoes: string[] = [];
    for (const arquivo of superficies()) {
      const m = lerCopy(arquivo).match(padrao);
      if (m) violacoes.push(`${arquivo}: "${m[0]}"`);
    }
    expect(violacoes, violacoes.join(' | ')).toHaveLength(0);
  });

  it('a guarda casa a forma errada (âncora)', () => {
    expect(PROIBIDO.some((p) => p.test('é um contrato de 60 meses'))).toBe(true);
    expect(PROIBIDO.some((p) => p.test('contrato de 12 meses'))).toBe(true);
    // e não pode ser tão larga que apague o texto certo
    expect(PROIBIDO.some((p) => p.test(OFERTA_INDUSTRIAL.paragrafo))).toBe(false);
    expect(PROIBIDO.some((p) => p.test(OFERTA_INDUSTRIAL.curta))).toBe(false);
  });
});

// =============================================================================
// 3. A OFERTA NOVA DIZ AS QUATRO COISAS
//
// Não basta a velha ter sumido: o que ficou no lugar tem de contar o modelo
// inteiro. Faltando o "não paga até a instalação" ou o direito de saída, o
// texto vira locação comum — e aí a mudança não entregou nada.
// =============================================================================

describe('o texto novo carrega o modelo inteiro', () => {
  it('o parágrafo diz que até a instalação não se paga', () => {
    expect(OFERTA_INDUSTRIAL.paragrafo).toMatch(/n[ãa]o paga nada/i);
  });

  it('diz quando a primeira mensalidade vence', () => {
    expect(OFERTA_INDUSTRIAL.paragrafo).toMatch(/30 dias/);
  });

  it('diz o direito de saída — 12 meses e retirada sem custo', () => {
    expect(OFERTA_INDUSTRIAL.paragrafo).toMatch(/12 meses/);
    expect(OFERTA_INDUSTRIAL.paragrafo).toMatch(/sem custo/i);
  });

  it('a versão curta não perde o essencial', () => {
    expect(OFERTA_INDUSTRIAL.curta).toMatch(/n[ãa]o paga nada/i);
    expect(OFERTA_INDUSTRIAL.curta).toMatch(/12 meses/);
  });
});

describe('garantia — o texto de 03/09', () => {
  it('o NI é 12 meses: 3 de garantia legal + 9 da Somatec', () => {
    expect(GARANTIA.ni).toMatch(/12 meses/);
    expect(GARANTIA.ni).toMatch(/3 meses/);
    expect(GARANTIA.ni).toMatch(/9 meses/);
  });

  it('as duas versões prometem reposição em até 3 dias', () => {
    expect(GARANTIA.ni).toMatch(/3 dias/);
    expect(GARANTIA.niCurta).toMatch(/3 dias/);
    expect(GARANTIA.industrial).toMatch(/3 dias/);
  });

  it('⛔ a garantia da locação não vira custo extra', () => {
    // Na locação a reposição já está no valor da mensalidade — cobrar por ela
    // seria oferta nova, e oferta nova é decisão do Léo.
    expect(GARANTIA.industrial).toMatch(/sem custo/i);
  });
});

// =============================================================================
// 4. A OFERTA VIVE EM UM LUGAR SÓ
//
// A razão de a mudança ter custado nove arquivos foi a frase estar copiada em
// nove lugares. Esta guarda cobra que as páginas leiam a constante em vez de
// reescrever o texto.
// =============================================================================

describe('as páginas leem a constante, não reescrevem a oferta', () => {
  const CONSUMIDORES = [
    'src/app/blog/page.tsx',
    'src/app/blog/[slug]/page.tsx',
    'src/app/faq/page.tsx',
    'src/app/resultados/page.tsx',
    'src/app/industrias/[setor]/page.tsx',
    'src/app/orcamento-industrial/page.tsx',
    'src/lib/pdf/projeto-industrial.ts',
  ];

  it.each(CONSUMIDORES)('%s importa OFERTA_INDUSTRIAL', (arquivo) => {
    const fonte = readFileSync(resolve(process.cwd(), arquivo), 'utf-8');
    expect(fonte).toMatch(/OFERTA_INDUSTRIAL/);
  });

  it('o PDF do orçamento é um dos consumidores — ele vai pro cliente por escrito', () => {
    // O que sai em PDF a pessoa guarda e mostra pro comitê de compra. Copy
    // errada ali sobrevive à correção do site.
    expect(CONSUMIDORES).toContain('src/lib/pdf/projeto-industrial.ts');
  });
});
