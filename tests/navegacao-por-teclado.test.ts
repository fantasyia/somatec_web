import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// =============================================================================
// F2-M7 + B12 DA AUDITORIA 13/09 — O SITE NÃO SE NAVEGAVA POR TECLADO.
//
// Três defeitos diferentes, todos invisíveis para quem usa mouse:
//
// 1. MEGA-MENU. O painel é IRMÃO do item que o abre (é `fixed`, largura
//    inteira), e o fechamento estava pendurado no `blur` do item. Resultado: o
//    Tab que levava o foco pro primeiro card era exatamente o Tab que fechava
//    o painel. Quem mandava era o item; passou a ser o <nav>.
//
// 2. DRAWER MOBILE. Cobria a tela inteira mas não era diálogo pra ninguém: o
//    Tab seguia correndo pelos links ATRÁS dele, Esc não fechava e, ao fechar,
//    o foco voltava pro topo do documento em vez do botão que abriu.
//
// 3. BARRA STICKY. Ela nunca desmonta — desliza pra fora com `translate-y-full`
//    e fica ali, fora da tela, com dois controles ainda focáveis no fim do Tab
//    de TODA página. E `aria-hidden` sozinho piora: some do leitor de tela um
//    elemento que continua recebendo foco.
//
// A guarda é por leitura de fonte de propósito: o que se perde aqui não é um
// valor calculado, é um atributo que alguém apaga numa refatoração de layout.
// =============================================================================

function fonte(caminho: string): string {
  return readFileSync(resolve(process.cwd(), caminho), 'utf8');
}

describe('Header — mega-menu alcançável pelo Tab', () => {
  const header = fonte('src/components/layout/Header.tsx');

  it('o fechamento por foco mora no <nav>, não no item', () => {
    // O <nav> envolve gatilhos E painel; o item, só o gatilho.
    expect(header).toMatch(/aria-label="Navegação principal"[\s\S]{0,900}onBlur=/);
  });

  it('foco no gatilho abre o painel na hora, sem o atraso de hover-intent', () => {
    expect(header).toMatch(/onFocus=\{\s*hasChildren[\s\S]{0,200}abrirAgora\(item\.href\)/);
    // `abrirAgora` existe justamente pra NÃO passar pelos timers do mouse.
    expect(header).toMatch(/const abrirAgora = \(href: string\) => \{[\s\S]*?setHoveredMenu\(href\);/);
  });

  it('Escape fecha e DEVOLVE o foco pro gatilho', () => {
    // Sem devolver, o próximo Tab recomeça do topo do documento.
    expect(header).toMatch(
      /e\.key === 'Escape'[\s\S]{0,400}focarSemAbrir\(gatilhosRef\.current\[item\.href\]\)/,
    );
  });

  it('devolver o foco não reabre o painel', () => {
    // Medido no navegador: focar o gatilho É o gesto que abre, então o Esc
    // fechava e o menu voltava no mesmo quadro.
    expect(header).toContain('if (ignorarFocoRef.current) return;');
    expect(header).toMatch(/const focarSemAbrir = [\s\S]{0,400}ignorarFocoRef\.current = true;/);
  });

  it('ArrowDown leva o foco pro primeiro card do painel', () => {
    expect(header).toContain("e.key === 'ArrowDown'");
    expect(header).toMatch(/painelRef\.current\?\.querySelector<HTMLAnchorElement>\('a\[href\]'\)\?\.focus\(\)/);
  });

  it('painel fechado fica fora da ordem de Tab', () => {
    expect(header).toContain('tabIndex={itemAberto ? undefined : -1}');
  });
});

describe('Header — drawer mobile é um diálogo de verdade', () => {
  const header = fonte('src/components/layout/Header.tsx');

  it('anuncia-se como diálogo modal com nome', () => {
    expect(header).toContain('role="dialog"');
    expect(header).toContain('aria-modal="true"');
    expect(header).toContain('aria-label="Menu de navegação"');
  });

  it('Escape fecha a gaveta', () => {
    expect(header).toMatch(/if \(e\.key === 'Escape'\) \{[\s\S]{0,120}setMobileOpen\(false\)/);
  });

  it('o Tab dá a volta dentro da gaveta em vez de escapar pro fundo', () => {
    expect(header).toContain("if (e.key !== 'Tab') return;");
    expect(header).toMatch(/e\.shiftKey[\s\S]{0,200}ultimo\.focus\(\)/);
  });

  it('ao fechar, o foco volta pro botão que abriu', () => {
    expect(header).toContain('const gatilho = botaoMobileRef.current;');
    expect(header).toMatch(/\(gatilho \?\? abriuCom\)\?\.focus\(\)/);
  });
});

describe('StickyCta escondida não recebe foco', () => {
  const sticky = fonte('src/components/layout/StickyCta.tsx');

  it('fica inerte e sem eventos de ponteiro enquanto está fora da tela', () => {
    expect(sticky).toContain('inert={!visible}');
    expect(sticky).toContain('pointer-events-none translate-y-full');
  });

  it('os dois controles saem da ordem de Tab (fallback pra quem não tem `inert`)', () => {
    const ocorrencias = sticky.match(/tabIndex=\{visible \? undefined : -1\}/g) ?? [];
    expect(ocorrencias.length).toBe(2);
  });
});

describe('alvos de toque mínimos (WCAG 2.5.8)', () => {
  it('breadcrumb e links do rodapé têm área de 24 px sem mudar o layout', () => {
    // O par `py-1 / -my-1` cresce a área e devolve o espaço: 17 px e 20 px de
    // altura viravam alvo menor que o mínimo, e mexer no espaçamento visível
    // seria decisão de layout, não conserto de acessibilidade.
    expect(fonte('src/components/layout/PageHero.tsx')).toContain('inline-block py-1 -my-1');
    expect(fonte('src/components/layout/FooterColumns.tsx')).toContain('inline-block py-1 -my-1');
  });
});

describe('campo repetido mantém nome acessível', () => {
  it('TextField sabe esconder o rótulo sem apagá-lo', () => {
    const campo = fonte('src/components/forms/fields/TextField.tsx');
    expect(campo).toContain('labelOculto');
    expect(campo).toContain("labelOculto && 'sr-only'");
  });

  it('os setores do orçamento industrial nunca mandam rótulo vazio', () => {
    const orcamento = fonte('src/components/tools/OrcamentoIndustrial.tsx');
    // Antes: `label={i === 0 ? 'Setor / galpão' : ''}` — da 2ª linha em diante
    // o leitor de tela anunciava só "editar texto".
    expect(orcamento).not.toMatch(/label=\{[^}]*:\s*''\s*\}/);
    expect(orcamento).toContain('labelOculto={i > 0}');
  });
});

describe('região viva da calculadora não fala a cada tecla', () => {
  const calc = fonte('src/components/tools/CostCalculator.tsx');

  it('o painel visível deixou de ser role=status', () => {
    // Ele recalcula a cada tecla: digitar "150000" fazia o leitor de tela ler
    // o painel inteiro seis vezes, uma por dígito.
    expect(calc).not.toMatch(/texture-dark[\s\S]{0,120}role="status"/);
  });

  it('quem anuncia é uma linha sr-only, com espera', () => {
    expect(calc).toContain('role="status" aria-live="polite" className="sr-only"');
    expect(calc).toMatch(/setTimeout\([\s\S]{0,160}setAnuncio\(/);
  });
});
