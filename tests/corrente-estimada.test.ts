import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { lerSemente, passoDaSemente } from '@/components/tools/CheckoutNI';

// =============================================================================
// SEM A CORRENTE REAL DO CLIENTE NÃO TEM VENDA — decisão do Léo, 24/09/2026.
//
//   "sem a informação correta do cliente infelizmente não dá pra seguir."
//
// É a corrente do disjuntor geral que escolhe o modelo do Master Block. Modelo
// escolhido por número chutado pode ser MENOR que o necessário — e aí o que se
// vende não protege.
//
// Até 24/09 este arquivo protegia o contrário: um AVISO de "corrente estimada".
// O bot, quando não conseguia o número, estimava e mandava `origem=estimativa`
// no link; o número preenchia o campo, o wizard pulava direto pro passo 3 e
// mostrava "MB-01 · R$ 3.150" — a um clique do checkout —, com um aviso pedindo
// pra conferir. Aviso não impede compra. Agora o número estimado nem entra.
//
// Os TRÊS caminhos que poderiam levar à compra sem corrente real, e o que
// fecha cada um:
//   1. `origem=estimativa` no link    → a corrente é descartada (este arquivo)
//   2. `quadros=...` (estimar pela lista de equipamentos) → não é lido desde
//      03/09, e continua não sendo
//   3. "não sei" no passo da corrente → sem corrente não há modelo, sem modelo
//      não existe o passo de checkout: vira pedido de dimensionamento
// =============================================================================

const FONTE = readFileSync(resolve(process.cwd(), 'src/components/tools/CheckoutNI.tsx'), 'utf-8');

/** Sem comentários: a explicação do conserto cita o que as guardas procuram. */
const CODIGO = FONTE.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .split('\n')
  .filter((l) => !l.trim().startsWith('//'))
  .join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, '');

const LINK_ESTIMADO = '?contexto=casa&corrente=50&tensao=127V&origem=estimativa';

describe('🔴 caminho 1 — corrente estimada no link não entra', () => {
  it('a corrente do link com origem=estimativa é DESCARTADA', () => {
    expect(lerSemente(LINK_ESTIMADO, 'residencial').corrente).toBe('');
  });

  it('🔴 e o wizard para no passo da corrente, não pula pro contato', () => {
    // Antes abria no passo 3, com modelo e preço de um número chutado. É esta
    // a regressão que importa: se voltar a devolver 3, o chute volta a ficar
    // a um clique da compra.
    const s = lerSemente(LINK_ESTIMADO, 'residencial');
    expect(passoDaSemente(s)).toBe(2);
  });

  it('o resto do link continua valendo — contexto e tensão entram', () => {
    // Descarta só o número chutado. O link já disparado no WhatsApp segue
    // abrindo e aproveitando o que era dado real.
    const s = lerSemente(LINK_ESTIMADO, 'residencial');
    expect(s.contexto).toBe('casa');
    expect(s.tensao).toBe('127V');
  });

  it('estimativa não é mais uma origem reconhecida', () => {
    expect(lerSemente(LINK_ESTIMADO, 'residencial').origem).toBeNull();
  });

  it('⛔ a corrente REAL continua entrando — o conserto não pode quebrar o caminho bom', () => {
    const disjuntor = lerSemente('?contexto=casa&corrente=50&tensao=127V&origem=disjuntor', 'residencial');
    expect(disjuntor.corrente).toBe('50');
    expect(passoDaSemente(disjuntor)).toBe(3);
    const conta = lerSemente('?contexto=casa&corrente=63&tensao=220V&origem=conta', 'residencial');
    expect(conta.corrente).toBe('63');
    // Sem `origem` nenhuma também entra — é o link mais antigo, e ele não
    // declarava estimativa.
    expect(lerSemente('?contexto=casa&corrente=40&tensao=127V', 'residencial').corrente).toBe('40');
  });

  it('não importa a caixa: ESTIMATIVA e Estimativa também são descartadas', () => {
    for (const o of ['ESTIMATIVA', 'Estimativa', 'estimativa']) {
      expect(lerSemente(`?corrente=50&origem=${o}`).corrente, o).toBe('');
    }
  });
});

describe('caminho 2 — estimar pela lista de equipamentos', () => {
  it('`quadros` segue sem ser lido', () => {
    // O bot parou de mandar em 03/09. Links velhos ainda carregam o
    // parâmetro, e ele não pode virar corrente por nenhum caminho.
    const s = lerSemente('?contexto=casa&tensao=127V&quadros=cozinha:40,oficina:63', 'residencial');
    expect(s.corrente).toBe('');
    expect(CODIGO).not.toMatch(/q\.get\(['"]quadros['"]\)/);
  });
});

describe('caminho 3 — "não sei" não chega ao checkout', () => {
  it('sem corrente não há modelo', () => {
    expect(CODIGO).toMatch(/const modelo = !naoSei && amp > 0 \? selecionarMasterBlock\(amp\) : null/);
  });

  it('sem modelo não existe o passo de checkout', () => {
    expect(CODIGO).toMatch(/const temPreco = modelo != null/);
    expect(CODIGO).toMatch(/const totalPassos = temPreco \? PASSOS_BASE \+ 1 : PASSOS_BASE/);
  });
});

describe('o aviso de estimativa saiu junto', () => {
  it('🔴 não sobrou tela nenhuma falando de corrente estimada', () => {
    // Aviso de "confira a estimativa" pressupõe que o número chutado chegou
    // até aqui — e ele não chega mais. Deixar o aviso seria prometer um
    // controle sobre algo que não existe.
    expect(CODIGO).not.toMatch(/origemUrl/);
    expect(CODIGO).not.toMatch(/como estimativa/);
    expect(CODIGO).not.toMatch(/Confira a corrente antes de fechar/);
  });

  it('quem não sabe a corrente continua tendo saída — o "não sei" e a foto do quadro', () => {
    // A orientação já existia no passo da corrente. É ela que atende quem
    // chega pelo link com o campo vazio.
    expect(CODIGO).toMatch(/Não sei meus dados/);
    expect(CODIGO).toMatch(/foto do seu quadro/);
  });

  it('a varredura está lendo o arquivo certo (âncora anti-falso-verde)', () => {
    expect(CODIGO).toContain('passoDaSemente');
    expect(CODIGO).toContain('Corrente do disjuntor geral');
    expect(CODIGO.length).toBeGreaterThan(20000);
  });
});
