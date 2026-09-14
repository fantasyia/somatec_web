import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { SITE } from '@/lib/constants/site';

// =============================================================================
// "Contato — Somatec Blocking · Somatec Blocking"
//
// Era assim que ONZE páginas do site chegavam no Google, e ninguém tinha visto.
//
// O layout declara `title: { default, template }`, e o template (que vem de
// `site_settings.seo_global_title_template`, hoje `%s · Somatec Blocking`)
// ENVOLVE todo título de página declarado como string. Páginas que já
// terminavam com o nome da empresa ganhavam o nome de novo.
//
// Por que passou despercebido: não quebra build, não quebra tipo, não quebra
// teste, e no navegador só aparece na aba — que quase ninguém lê inteira. O
// lugar onde importa é o resultado de busca, onde o Google corta o título em
// ~60 caracteres: a marca repetida come o espaço do que de fato diferencia a
// página, e às vezes empurra pra fora justamente o termo pelo qual ela deveria
// ser encontrada.
//
// Achado em 12/09 ao conferir o HTML servido de verdade, depois da troca de
// vocabulário — o `<title>` de `/produtos` saiu com a marca duas vezes. O
// defeito já existia antes e nada tinha a ver com a troca; só apareceu porque
// desta vez alguém leu a página renderizada em vez do arquivo-fonte.
//
// O conserto é de MECÂNICA, não de texto: `title: { absolute: '…' }` não passa
// pelo template. Nenhuma palavra mudou em nenhum dos onze títulos.
// =============================================================================

const APP = resolve(process.cwd(), 'src/app');

function paginas(dir: string): string[] {
  const achados: string[] = [];
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) {
      achados.push(...paginas(caminho));
    } else if (nome === 'page.tsx' || nome === 'route.ts') {
      achados.push(caminho);
    }
  }
  return achados;
}

/** `title: '…'` — a forma que o template ENVOLVE. `{ absolute: … }` não conta. */
const TITULO_STRING = /title:\s*(?:'([^']*)'|`([^`]*)`)/g;

/**
 * Tira os sub-blocos `openGraph` e `twitter` antes de procurar título.
 *
 * ⚠️ Só o `title` DE TOPO passa pelo template do layout. `openGraph.title` e
 * `twitter.title` vão pro HTML como estão — e citam a marca de propósito
 * ("Blog Somatec — conteúdo técnico…"). Sem esta poda, a guarda acusa os dois
 * e obriga a mexer em copy que está certa.
 */
function semSubBlocosDeSocial(bloco: string): string {
  let fora = bloco;
  for (const chave of ['openGraph', 'twitter']) {
    let i = fora.indexOf(`${chave}:`);
    while (i !== -1) {
      const abre = fora.indexOf('{', i);
      if (abre === -1) break;
      let nivel = 0;
      let fim = abre;
      for (; fim < fora.length; fim++) {
        if (fora[fim] === '{') nivel++;
        else if (fora[fim] === '}') {
          nivel--;
          if (nivel === 0) break;
        }
      }
      fora = fora.slice(0, i) + fora.slice(fim + 1);
      i = fora.indexOf(`${chave}:`);
    }
  }
  return fora;
}

describe('o nome da empresa não aparece duas vezes no <title>', () => {
  const arquivos = paginas(APP);

  it('existe página pra varrer (a varredura não pode passar por estar vazia)', () => {
    expect(arquivos.length).toBeGreaterThan(15);
  });

  it.each(arquivos.map((a) => relative(process.cwd(), a)))('%s', (rel) => {
    const fonte = readFileSync(resolve(process.cwd(), rel), 'utf-8');
    // Só o bloco de metadata: `title:` de objeto no corpo (card, feature, FAQ)
    // não vira <title> de página e pode citar a marca à vontade.
    const blocos = [
      ...fonte.matchAll(/export const metadata[\s\S]*?\n\}\)?;\n/g),
      ...fonte.matchAll(/return\s*\{[\s\S]*?title:[\s\S]*?\n\s*\};/g),
    ].map((m) => semSubBlocosDeSocial(m[0]));

    for (const bloco of blocos) {
      for (const m of bloco.matchAll(TITULO_STRING)) {
        const texto = m[1] ?? m[2] ?? '';
        // ⚠️ Não basta procurar "Somatec Blocking" inteiro. Em 13/09 os títulos
        // do blog e do autor terminavam em "| Blog Somatec" — marca, mas sem o
        // "Blocking" — e o template ainda acrescentava "· Somatec Blocking" em
        // cima: 87 a 114 caracteres, com a marca duas vezes. A guarda passava.
        // Agora o alvo é a MARCA, em qualquer forma.
        expect(
          texto,
          `${rel}: o título já cita a marca e o template do layout ` +
            `("%s · ${SITE.fullName}") acrescenta de novo. ` +
            `Use title: { absolute: '…' } — o texto não muda.`,
        ).not.toMatch(/somatec/i);
      }
    }
  });
});

describe('o template do layout continua existindo — é o que justifica a regra', () => {
  it('o layout declara title.template', () => {
    const layout = readFileSync(resolve(process.cwd(), 'src/app/layout.tsx'), 'utf-8');
    // Se alguém tirar o template, `absolute` vira desnecessário — mas aí o nome
    // da empresa some de TODA página que não o escreve, que é pior. A guarda
    // avisa pra decisão ser consciente.
    expect(layout).toMatch(/title:\s*\{\s*default:[\s\S]{0,80}template:/);
  });
});
