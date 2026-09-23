import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DADOS_ENVIADOS_A_TERCEIROS,
  ENVIOS_COM_CONSENTIMENTO,
  COOKIES_DO_SITE,
} from '@/lib/constants/cookies';

// =============================================================================
// O QUE SAI — a categoria que a guarda de cookies não cobre, por construção.
//
// `tests/cookies-inventario.test.ts` varre o código atrás de CHAVE DE
// ARMAZENAMENTO e reprova a que não estiver declarada. Isso protege a `/cookies`
// contra "o site passou a gravar algo e ninguém contou".
//
// Existe um segundo jeito de a mesma página ficar falsa, e a varredura de chaves
// é cega pra ele: dado que **sai** sem nunca ter sido gravado. Dois caminhos
// fazem isso hoje:
//
//   1. correspondência avançada da Meta — o pixel LÊ os campos do formulário,
//      aplica hash no navegador e manda junto do evento. Ligado em 23/09 num
//      PAINEL, sem commit. Nenhum teste conseguiria inferir; só declaração.
//   2. o CAPI (`src/lib/meta/capi.ts`) — hash de e-mail e telefone feito no
//      nosso servidor, no lead e no pedido.
//
// ⛔ E a regra de linguagem, que é o que este arquivo mais protege: hash **não é
// anonimato**. É o que permite a Meta reconhecer quem ela já conhece. Chamar de
// "anonimizado" na página que PEDE consentimento seria falso — e é o erro fácil,
// porque soa melhor e ninguém reclama.
// =============================================================================

const fonte = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf-8');

describe('a lista de envios existe e é honesta', () => {
  it('🔴 nenhum envio pode AFIRMAR anonimato — mas pode negá-lo', () => {
    // ⚠️ A primeira versão desta guarda bania a palavra e reprovou a frase
    // honesta "codificar não é tornar anônimo". Banir palavra apaga também quem
    // a usa pra desmentir — é a mesma armadilha que a guarda de oferta tem
    // (mecânica + exceção explícita, nunca palavra solta).
    //
    // Então o que se proíbe é a AFIRMAÇÃO: a palavra sem negação antes dela.
    const texto = JSON.stringify(DADOS_ENVIADOS_A_TERCEIROS).toLowerCase();
    const termos = /(anonimizad\w*|anônim\w*|anonim\w*|identifica)/g;
    for (const m of texto.matchAll(termos)) {
      const antes = texto.slice(Math.max(0, m.index - 18), m.index);
      expect(
        /n[ãa]o\s+(é\s+|s[ãa]o\s+|torna\s+)?$|nunca\s+$/.test(antes),
        `"${m[0]}" aparece sem negação — hash não é anonimato, e esta página pede consentimento`,
      ).toBe(true);
    }
  });

  it('todo envio diz em que FORMA sai e em que MOMENTO', () => {
    for (const d of DADOS_ENVIADOS_A_TERCEIROS) {
      expect(d.forma.length, `${d.dado}: sem forma`).toBeGreaterThan(20);
      expect(d.quando.length, `${d.dado}: sem momento`).toBeGreaterThan(15);
      expect(d.ligadoEm.length).toBeGreaterThan(5);
    }
  });

  it('🔴 envio ligado em PAINEL fica marcado como tal — não há commit que o registre', () => {
    // Sem esta marca, quem for auditar vai procurar no `git log` e concluir que
    // a correspondência avançada não existe, porque de fato ela não está em
    // código nenhum. O painel é a única fonte, e ela não versiona.
    const doPainel = DADOS_ENVIADOS_A_TERCEIROS.filter((d) => /painel|gerenciador/i.test(d.ligadoEm));
    expect(doPainel.length).toBeGreaterThanOrEqual(1);
  });

  it('a correspondência avançada da Meta está declarada', () => {
    const m = DADOS_ENVIADOS_A_TERCEIROS.find((d) => /correspond/i.test(d.ligadoEm));
    expect(m, 'a correspondência avançada precisa estar na lista').toBeDefined();
    expect(m!.destino).toBe('meta');
    expect(m!.exigeConsentimento).toBe(true);
  });
});

describe('🔴 o CAPI não passa pelo banner — e a lista tem de dizer isso', () => {
  // Este é o fato desconfortável: o CAPI roda no SERVIDOR, então o aceite (ou a
  // recusa) no banner de cookies não o alcança. Quem clica "Apenas essenciais"
  // ainda tem e-mail e telefone com hash enviados à Meta quando manda um
  // formulário ou fecha um pedido.
  //
  // O teste NÃO afirma que isso está certo ou errado — é decisão do Léo, e está
  // com ele desde 23/09. O que ele impede é a lista MENTIR sobre o fato: se
  // alguém marcar o envio do CAPI como dependente de consentimento sem ter
  // colocado um portão de verdade no código, isto reprova.
  const capi = DADOS_ENVIADOS_A_TERCEIROS.filter((d) => d.ligadoEm.includes('capi.ts'));

  it('o envio do CAPI está declarado', () => {
    expect(capi.length).toBeGreaterThanOrEqual(1);
  });

  it('🔴 marcado como consentido só se o código REALMENTE tiver portão', () => {
    const codigo = fonte('src/lib/meta/capi.ts');
    const temPortao = /consent|consentimento/i.test(codigo);
    for (const d of capi) {
      if (d.exigeConsentimento) {
        expect(
          temPortao,
          'declarado como dependente de consentimento, mas capi.ts não checa consentimento nenhum',
        ).toBe(true);
      }
    }
  });
});

describe('as duas listas não se confundem', () => {
  it('cookie é o que FICA; envio é o que SAI — nenhum item aparece nos dois', () => {
    const nomes = new Set(COOKIES_DO_SITE.map((c) => c.nome.toLowerCase()));
    for (const d of DADOS_ENVIADOS_A_TERCEIROS) {
      expect(nomes.has(d.dado.toLowerCase())).toBe(false);
    }
  });

  it('a página de cookies renderiza a lista de envios, não só a de cookies', () => {
    // Fato declarado e não mostrado não informa ninguém. Se alguém remover a
    // tabela da página, a declaração continua no código e a página volta a ser
    // silenciosa sobre o que envia — exatamente o estado de 23/09.
    const pagina = fonte('src/app/cookies/page.tsx');
    expect(pagina).toContain('DADOS_ENVIADOS_A_TERCEIROS');
  });

  it('ENVIOS_COM_CONSENTIMENTO é subconjunto da lista', () => {
    expect(ENVIOS_COM_CONSENTIMENTO.every((d) => DADOS_ENVIADOS_A_TERCEIROS.includes(d))).toBe(true);
  });
});
