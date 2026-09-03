import { describe, it, expect } from 'vitest';
import { lerSemente, passoDaSemente } from '@/components/tools/CheckoutNI';
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
      corrente: '63', tensao: '220V', origem: null, contexto: '',
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
      corrente: '', tensao: '380V', origem: null, contexto: '',
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

// =============================================================================
// O bot já descobriu o tipo de local, a corrente e a tensão. Fazer a pessoa
// refazer tudo isso no site — inclusive ir de novo até o quadro de luz — é o
// atrito que estes parâmetros matam.
// =============================================================================

describe('contexto — só vale o que existe NESTA LP', () => {
  it('comercial aceita os contextos de comércio', () => {
    expect(lerSemente('?contexto=comercio', 'comercial').contexto).toBe('comercio');
    expect(lerSemente('?contexto=oficina', 'comercial').contexto).toBe('oficina');
    expect(lerSemente('?contexto=condominio', 'comercial').contexto).toBe('condominio');
  });

  it('residencial aceita casa e apartamento', () => {
    expect(lerSemente('?contexto=casa', 'residencial').contexto).toBe('casa');
    expect(lerSemente('?contexto=apartamento', 'residencial').contexto).toBe('apartamento');
  });

  it('⛔ contexto de OUTRA LP é ignorado', () => {
    // Semear "casa" na LP de comércio abriria o wizard num preset que não
    // existe ali — pior que abrir no passo 1.
    expect(lerSemente('?contexto=casa', 'comercial').contexto).toBe('');
    expect(lerSemente('?contexto=camara-fria', 'residencial').contexto).toBe('');
  });

  it('contexto inventado é ignorado', () => {
    expect(lerSemente('?contexto=fabrica', 'comercial').contexto).toBe('');
  });

  it('sem setor não dá pra validar — volta vazio', () => {
    expect(lerSemente('?contexto=comercio').contexto).toBe('');
  });
});

// =============================================================================
// `quadros` APOSENTADO (03/09).
//
// O parâmetro carregava os quadros secundários que o bot levantava — câmara
// fria, PDV, piscina. O não-industrial passou a levar UM equipamento só, e o
// bot parou de mandar.
//
// O que se protege aqui é que ele seja IGNORADO, não que dê erro: os links já
// disparados no WhatsApp ainda carregam o parâmetro, e quem clicar num deles
// tem que cair num wizard que funciona.
// =============================================================================

describe('o parâmetro `quadros` é ignorado, não quebra', () => {
  it('link antigo com quadros ainda semeia o resto normalmente', () => {
    const s = lerSemente(
      '?contexto=comercio&corrente=63&tensao=220&quadros=Câmara fria:40,PDV / servidores:25',
      'comercial',
    );
    expect(s.contexto).toBe('comercio');
    expect(s.corrente).toBe('63');
    expect(s.tensao).toBe('220V');
  });

  it('a semente não carrega mais campo de quadros', () => {
    const s = lerSemente('?contexto=comercio&quadros=Câmara fria:40', 'comercial');
    expect(Object.keys(s).sort()).toEqual(['contexto', 'corrente', 'origem', 'tensao']);
  });

  it('quadros sujo não derruba nada', () => {
    for (const sujo of ['Câmara fria:', 'Câmara fria:abc', 'inventado:-40', '']) {
      const s = lerSemente(`?contexto=comercio&corrente=63&tensao=220&quadros=${sujo}`, 'comercial');
      expect(s.corrente, sujo).toBe('63');
    }
  });
});

describe('passoDaSemente — para no primeiro campo que faltou', () => {
  const semente = (busca: string) => lerSemente(busca, 'comercial');

  it('tudo preenchido → abre no passo 3 (contato)', () => {
    // Era 4 enquanto existia o passo de quadros adicionais.
    expect(passoDaSemente(semente('?contexto=comercio&corrente=63&tensao=220'))).toBe(3);
  });

  it('sem contexto → passo 1', () => {
    expect(passoDaSemente(semente('?corrente=63&tensao=220'))).toBe(1);
  });

  it('sem corrente ou sem tensão → passo 2', () => {
    expect(passoDaSemente(semente('?contexto=comercio&tensao=220'))).toBe(2);
    expect(passoDaSemente(semente('?contexto=comercio&corrente=63'))).toBe(2);
  });

  it('link sem parâmetro nenhum → passo 1, comportamento de hoje', () => {
    expect(passoDaSemente(semente(''))).toBe(1);
  });

  it('⛔ NUNCA passa do passo 3', () => {
    // O 4 é o checkout; o 3 é nome/WhatsApp/e-mail, que o bot não coleta.
    const cheio = semente('?contexto=comercio&corrente=63&tensao=220&quadros=Câmara fria:40&origem=disjuntor');
    expect(passoDaSemente(cheio)).toBeLessThanOrEqual(3);
  });
});
