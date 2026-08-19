import { describe, it, expect } from 'vitest';
import { lerSemente } from '@/components/tools/CheckoutNI';
import { MB_LOAD_MAX } from '@/lib/constants/masterblock';

// =============================================================================
// A IA do WhatsApp (fluxo C1) apura a corrente conversando — é o trabalho mais
// difícil dela, porque a pessoa precisa ir olhar o disjuntor. O link que ela
// manda carrega esse número (`?corrente=63&tensao=220`) pra ninguém digitar de
// novo.
//
// Regras que o C1 respeita e o campo tem que honrar:
//  - o valor da URL é SUGESTÃO, nunca trava;
//  - corrente inválida ou ausente → wizard abre EM BRANCO, sem erro na cara de
//    quem só clicou num link;
//  - `origem=estimativa` merece aviso de conferir antes de fechar.
// =============================================================================

describe('lerSemente — caminho feliz', () => {
  it('lê corrente e tensão', () => {
    expect(lerSemente('?corrente=63&tensao=220')).toEqual({
      corrente: '63', tensao: '220V', origem: null,
    });
  });

  it('aceita a tensão com e sem o V (quem monta o link é a IA)', () => {
    expect(lerSemente('?tensao=220V').tensao).toBe('220V');
    expect(lerSemente('?tensao=220').tensao).toBe('220V');
    expect(lerSemente('?tensao=220v').tensao).toBe('220V');
  });

  it('aceita o "A" que às vezes vem junto da corrente', () => {
    expect(lerSemente('?corrente=63A').corrente).toBe('63');
  });

  it('lê a origem quando o C1 informa', () => {
    expect(lerSemente('?origem=estimativa').origem).toBe('estimativa');
    expect(lerSemente('?origem=disjuntor').origem).toBe('disjuntor');
    expect(lerSemente('?origem=conta').origem).toBe('conta');
  });
});

describe('lerSemente — lixo abre em branco, nunca com erro', () => {
  it.each([
    ['?corrente=dfsdf', 'texto'],
    ['?corrente=0', 'zero'],
    ['?corrente=-40', 'negativo'],
    ['?corrente=63.5', 'decimal'],
    [`?corrente=${MB_LOAD_MAX + 1}`, 'acima da linha Master Block'],
    ['', 'sem parâmetro nenhum'],
  ])('%s (%s) → corrente vazia', (busca) => {
    expect(lerSemente(busca).corrente).toBe('');
  });

  it('negativo NÃO pode virar positivo', () => {
    // Uma varredura ingênua de dígitos transformaria "-40" em 40 — inventar o
    // número de outra pessoa a partir de parâmetro sujo é pior que abrir vazio.
    expect(lerSemente('?corrente=-40').corrente).toBe('');
  });

  it('tensão fora da lista é ignorada', () => {
    expect(lerSemente('?tensao=999').tensao).toBe('');
    expect(lerSemente('?tensao=banana').tensao).toBe('');
  });

  it('origem inventada vira nula (não vira aviso errado na tela)', () => {
    expect(lerSemente('?origem=chute').origem).toBeNull();
  });

  it('corrente suja não derruba a tensão boa que veio junto', () => {
    expect(lerSemente('?corrente=dfsdf&tensao=380')).toEqual({
      corrente: '', tensao: '380V', origem: null,
    });
  });
});

describe('lerSemente — limites da linha', () => {
  it('aceita exatamente o teto', () => {
    expect(lerSemente(`?corrente=${MB_LOAD_MAX}`).corrente).toBe(String(MB_LOAD_MAX));
  });

  it('aceita o mínimo de 1 A', () => {
    expect(lerSemente('?corrente=1').corrente).toBe('1');
  });
});
