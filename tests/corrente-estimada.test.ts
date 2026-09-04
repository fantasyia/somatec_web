import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { lerSemente, passoDaSemente } from '@/components/tools/CheckoutNI';

// =============================================================================
// O AVISO DE CORRENTE ESTIMADA TEM DE ESTAR ONDE A PESSOA DECIDE.
//
// O bot (fluxo C1) às vezes não consegue o número do disjuntor e ESTIMA. Nesse
// caso ele manda `origem=estimativa` no link, e a tela avisa pra conferir.
//
// O aviso existia só no `hint` do campo de corrente, que é do PASSO 2. Mas
// `passoDaSemente` manda o link COMPLETO direto pro passo 3 — então, justamente
// nos links que carregam a estimativa, o aviso nunca era visto. Em produção o
// link abria no "Passo 3 de 4" mostrando MB-01 · R$ 3.150 sem uma palavra
// sobre o número ser chute.
//
// ⚠️ Não é cosmética. A regra do prompt é estimar PARA CIMA, porque indicar um
// modelo menor que o necessário é vender algo que não protege. O aviso é o
// controle que segura esse caso.
// =============================================================================

const FONTE = readFileSync(
  resolve(process.cwd(), 'src/components/tools/CheckoutNI.tsx'),
  'utf-8',
);

/** Sem comentários: a explicação do conserto cita as próprias coisas que as
 *  guardas procuram. Linha primeiro, bloco depois — mesma ordem (e mesmo
 *  motivo) registrada em copy-guards.test.ts. */
const CODIGO = FONTE.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .split('\n')
  .filter((l) => !l.trim().startsWith('//'))
  .join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, '');

describe('o link do bot com estimativa pula o passo 2', () => {
  it('link completo com origem=estimativa abre no passo 3', () => {
    // É esta a condição que torna o aviso do passo 2 inalcançável. Se um dia
    // `passoDaSemente` passar a devolver 2 aqui, o problema muda de natureza
    // e este teste avisa.
    const s = lerSemente('?contexto=casa&corrente=50&tensao=127V&origem=estimativa', 'residencial');
    expect(s.origem).toBe('estimativa');
    expect(passoDaSemente(s)).toBe(3);
  });

  it('a origem sobrevive à leitura do link (âncora)', () => {
    expect(lerSemente('?origem=estimativa').origem).toBe('estimativa');
    expect(lerSemente('?origem=disjuntor').origem).toBe('disjuntor');
    expect(lerSemente('?origem=chute').origem).toBeNull();
  });
});

describe('o aviso aparece no passo do RESULTADO', () => {
  it('existe um bloco condicionado a origem estimada fora do campo de corrente', () => {
    // O `hint` do TextField já usava `origemUrl === 'estimativa'`. Exigir duas
    // ocorrências garante que existe uma SEGUNDA superfície — senão o teste
    // passaria com o estado antigo, em que só o hint existia.
    const ocorrencias = CODIGO.match(/origemUrl === 'estimativa'/g) ?? [];
    expect(ocorrencias.length, 'o aviso continua existindo em um lugar só').toBeGreaterThanOrEqual(2);
  });

  it('o aviso está DENTRO do passo 3, não do passo 2', () => {
    const ini = CODIGO.indexOf('{passo === 3 && (');
    const fim = CODIGO.indexOf('{passo === 4 && (');
    expect(ini, 'não achei o passo 3').toBeGreaterThan(-1);
    expect(fim, 'não achei o passo 4').toBeGreaterThan(ini);
    expect(CODIGO.slice(ini, fim)).toMatch(/origemUrl === 'estimativa'/);
  });

  it('diz pra conferir no disjuntor', () => {
    const ini = CODIGO.indexOf('{passo === 3 && (');
    const bloco = CODIGO.slice(ini, CODIGO.indexOf('{passo === 4 && ('));
    expect(bloco).toMatch(/disjuntor/i);
    expect(bloco).toMatch(/estimativa/i);
  });

  it('oferece o caminho de volta pro campo — não só texto', () => {
    // Mandar conferir sem dar como voltar transfere o trabalho pra pessoa
    // achar o passo sozinha, e ela está a um clique de fechar a compra.
    const ini = CODIGO.indexOf('{passo === 3 && (');
    const bloco = CODIGO.slice(ini, CODIGO.indexOf('{passo === 4 && ('));
    expect(bloco).toMatch(/irPara\(2\)/);
  });

  it('⛔ não aparece quando a corrente NÃO é estimativa', () => {
    // A condição tem de continuar presa a `origemUrl`; um aviso que aparece
    // sempre vira ruído e some da percepção justo quando importa.
    const ini = CODIGO.indexOf('{passo === 3 && (');
    const bloco = CODIGO.slice(ini, CODIGO.indexOf('{passo === 4 && ('));
    const i = bloco.indexOf("origemUrl === 'estimativa'");
    expect(bloco.slice(i, i + 120)).toMatch(/naoSei|corrente !== ''/);
  });

  it('a varredura está lendo o arquivo certo (âncora anti-falso-verde)', () => {
    expect(CODIGO).toContain('passoDaSemente');
    expect(CODIGO).toContain('Corrente do disjuntor geral');
    expect(CODIGO.length).toBeGreaterThan(20000);
  });
});
