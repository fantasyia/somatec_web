import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { COOKIES_DO_SITE, CHAVES_PROPRIAS } from '@/lib/constants/cookies';

// =============================================================================
// F2-M6 DA AUDITORIA 13/09 — A PÁGINA DE COOKIES DESCREVIA OUTRO SITE.
//
// O texto de `/cookies` dizia "exclusivamente cookies técnicos e essenciais" e
// "não utilizamos cookies de rastreamento" enquanto o banner pedia aceite e o
// GTM carregava GA4 e Pixel. O erro não foi ninguém mentir: foi a página ser
// escrita uma vez e o código continuar andando sozinho por mais um ano.
//
// `src/lib/constants/cookies.ts` passa a ser o inventário, e esta guarda
// existe pra ele não envelhecer igual: ela VARRE O CÓDIGO atrás de chave de
// armazenamento e reprova a que ninguém tiver declarado. Lista escrita à mão
// sem varredura é uma auditoria que decide de antemão o que não vai achar.
// =============================================================================

const RAIZ = resolve(process.cwd(), 'src');
const INVENTARIO = resolve(RAIZ, 'lib/constants/cookies.ts');

/** Cara de chave de armazenamento deste site: os prefixos que o projeto usa.
 *  `sb-` é do Supabase (sessão), os demais são nossos. */
const PARECE_CHAVE = /^(stc[-_][a-z0-9_-]+|somatec-[a-z0-9-]+|msm-[a-z0-9-]+|sb-[a-z0-9]+-auth-token)$/;

/** Falsos positivos: rótulos de origem que o site manda em header/payload e
 *  nomes de projeto. Não são chave de armazenamento — nenhum deles chega ao
 *  navegador. Entram nomeados de propósito: a alternativa era afrouxar o
 *  padrão acima, e aí o `somatec-` de uma chave de verdade passaria batido. */
const NAO_E_CHAVE = new Set([
  'stc_status',
  'somatec-blocking',
  'somatec-web',
  'somatec-site',
  'msm-site',
  'msm-header',
]);

function arquivosDeCodigo(dir: string, out: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) arquivosDeCodigo(caminho, out);
    else if (/\.(ts|tsx)$/.test(nome) && resolve(caminho) !== INVENTARIO) out.push(caminho);
  }
  return out;
}

/** Toda string literal do arquivo (aspas simples, duplas ou crase sem `${`). */
function literais(fonte: string): string[] {
  const achados: string[] = [];
  const re = /'([^'\\\n]*)'|"([^"\\\n]*)"|`([^`\\$\n]*)`/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(fonte)) !== null) {
    achados.push(m[1] ?? m[2] ?? m[3] ?? '');
  }
  return achados;
}

describe('inventário de cookies bate com o que o código grava', () => {
  const arquivos = arquivosDeCodigo(RAIZ);

  it('a varredura acha arquivos (não passa por estar vazia)', () => {
    expect(arquivos.length).toBeGreaterThan(50);
  });

  it('nenhuma chave de armazenamento fica fora do inventário', () => {
    const declaradas = new Set(CHAVES_PROPRIAS);
    const semDeclaracao: string[] = [];

    for (const arquivo of arquivos) {
      const fonte = readFileSync(arquivo, 'utf8');
      for (const lit of literais(fonte)) {
        if (!PARECE_CHAVE.test(lit) || NAO_E_CHAVE.has(lit)) continue;
        // `sb-…` é família do Supabase: o inventário declara o curinga.
        const coberta = declaradas.has(lit) || (lit.startsWith('sb-') && declaradas.has('sb-*-auth-token'));
        if (!coberta) semDeclaracao.push(`${lit} (${relative(process.cwd(), arquivo)})`);
      }
    }

    expect(
      [...new Set(semDeclaracao)],
      `chave gravada no navegador e ausente de src/lib/constants/cookies.ts: ${semDeclaracao.join(', ')}`,
    ).toEqual([]);
  });

  it('todo item próprio aponta um arquivo que existe', () => {
    const sumidos = COOKIES_DO_SITE.filter(
      (c) => c.origem === 'somatec' && !existsSync(resolve(process.cwd(), c.gravadoEm)),
    ).map((c) => `${c.nome} → ${c.gravadoEm}`);
    expect(sumidos, `inventário aponta arquivo inexistente: ${sumidos.join(', ')}`).toEqual([]);
  });

  it('o que exige consentimento é só o de terceiros carregado pelo GTM', () => {
    // Inverter isto na prática significa gravar analytics antes do aceite —
    // e é o tipo de mudança que passa despercebida numa revisão de código.
    for (const item of COOKIES_DO_SITE) {
      if (item.exigeConsentimento) expect(item.origem).not.toBe('somatec');
      if (item.categoria === 'essencial') expect(item.exigeConsentimento).toBe(false);
    }
  });

  it('declara ao menos um item analítico e um de marketing (o site tem GA4 e Pixel)', () => {
    // A página de cookies dizia que não havia rastreamento nenhum. Se um dia
    // voltar a não haver, esta expectativa cai junto com as tags — de
    // propósito: o inventário e o GTM têm de mudar no mesmo commit.
    expect(COOKIES_DO_SITE.some((c) => c.categoria === 'analitico')).toBe(true);
    expect(COOKIES_DO_SITE.some((c) => c.categoria === 'marketing')).toBe(true);
  });
});
