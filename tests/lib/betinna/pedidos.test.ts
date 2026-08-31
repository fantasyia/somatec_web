import { describe, expect, it } from 'vitest';
import { montarPedidoBetinna, type EntradaPedidoBetinna } from '@/lib/betinna/pedidos';

// =============================================================================
// A tradução do pedido do checkout para o contrato do Betinna.
//
// O risco que mora aqui não é de formato, é de dinheiro: o Betinna recusa o
// pedido INTEIRO quando um SKU não existe no catálogo dele. Como o checkout
// deixa o cliente marcar quadro sem corrente ("a dimensionar"), um pedido de
// R$ 30 mil com um quadro a dimensionar junto morreria por causa do quadro.
// =============================================================================

const base: EntradaPedidoBetinna = {
  numero: 'SB2608K7M2QX',
  nome: 'Marcelo Harada',
  email: 'marcelo@exemplo.com.br',
  whatsapp: '11999998888',
  empresa: 'Harada Metais',
  itens: [{ descricao: 'Quadro geral', modelo: 'MB-03', quantidade: 1, precoCentavos: 525000 }],
  freteCentavos: 0,
  formaPagamento: 'PIX',
  endereco: {
    cep: '01310100',
    logradouro: 'Av. Paulista',
    numero: '1000',
    complemento: 'sala 4',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    uf: 'SP',
  },
  setor: 'comercial',
  origem: 'site:protecao-eletrica',
};

describe('pedido do site → Betinna', () => {
  it('manda SKU, quantidade e valor UNITÁRIO em reais (o centavo é do site)', () => {
    const p = montarPedidoBetinna(base)!;

    expect(p.numeroSite).toBe('SB2608K7M2QX');
    expect(p.itens).toEqual([{ sku: 'MB-03', quantidade: 1, valorUnitario: 5250 }]);
  });

  it('quadro a dimensionar NÃO vira item — derrubaria o pedido inteiro por SKU inexistente', () => {
    const p = montarPedidoBetinna({
      ...base,
      itens: [
        ...base.itens,
        { descricao: 'Quadro da bomba', modelo: 'nao-sei', quantidade: 1, precoCentavos: 0 },
        { descricao: 'Barramento', modelo: 'acima-da-linha', quantidade: 1, precoCentavos: 0 },
        { descricao: 'Sem modelo', modelo: null, quantidade: 1, precoCentavos: 0 },
      ],
    })!;

    expect(p.itens.map((i) => i.sku)).toEqual(['MB-03']);
  });

  it('mas o que ficou de fora é DITO na observação (é conversa pendente, não item esquecido)', () => {
    const p = montarPedidoBetinna({
      ...base,
      itens: [...base.itens, { descricao: 'Quadro da bomba', modelo: 'nao-sei', quantidade: 1, precoCentavos: 0 }],
    })!;

    expect(p.observacoes).toContain('A dimensionar');
    expect(p.observacoes).toContain('Quadro da bomba');
  });

  it('pedido SÓ de quadro a dimensionar não sobe — é orçamento, não venda fechada', () => {
    expect(
      montarPedidoBetinna({
        ...base,
        itens: [{ descricao: 'Quadro da bomba', modelo: 'nao-sei', quantidade: 1, precoCentavos: 0 }],
      }),
    ).toBeNull();
  });

  it('observação leva pagamento, entrega e empresa — é o que a expedição lê', () => {
    const p = montarPedidoBetinna(base)!;

    expect(p.observacoes).toContain('PIX');
    expect(p.observacoes).toContain('Av. Paulista, 1000, sala 4');
    expect(p.observacoes).toContain('São Paulo/SP');
    expect(p.observacoes).toContain('Harada Metais');
  });

  it('endereço incompleto não vira texto quebrado ("undefined, /")', () => {
    const p = montarPedidoBetinna({ ...base, endereco: { cep: '01310100' } })!;

    expect(p.observacoes).not.toContain('Entrega:');
    expect(p.observacoes).not.toContain('undefined');
  });

  it('frete vai em reais e separado do item (o total do ERP é dele)', () => {
    const p = montarPedidoBetinna({ ...base, freteCentavos: 4590 })!;

    expect(p.valorFrete).toBe(45.9);
  });

  it('telefone e e-mail viram as chaves de dedup do cliente lá', () => {
    const p = montarPedidoBetinna(base)!;

    expect(p.cliente).toEqual({
      nome: 'Marcelo Harada',
      email: 'marcelo@exemplo.com.br',
      telefone: '11999998888',
    });
  });

  it('sem whatsapp, o campo é OMITIDO (string vazia reprova no schema de lá)', () => {
    const p = montarPedidoBetinna({ ...base, whatsapp: null })!;

    expect('telefone' in p.cliente).toBe(false);
  });

  it('observação respeita o teto de 2000 do contrato', () => {
    const p = montarPedidoBetinna({
      ...base,
      itens: [
        ...base.itens,
        ...Array.from({ length: 60 }, (_, i) => ({
          descricao: `Quadro muito descrito número ${i} com nome comprido`,
          modelo: null,
          quantidade: 1,
          precoCentavos: 0,
        })),
      ],
    })!;

    expect(p.observacoes.length).toBeLessThanOrEqual(2000);
  });
});

// =============================================================================
// O pedido de teste real (31/08) chegou no ERP sem CPF e sem endereço
// estruturado: contato sem documento (não emite NF) e `enderecoEntrega` NULL
// (não gera etiqueta). O endereço ia só na observação — que ninguém imprime.
//
// A regra do Léo: tudo que a nota e a etiqueta precisam viaja NO PEDIDO, na
// hora da compra. Depois disso o cliente não é incomodado por nada.
// =============================================================================
describe('o que a NF e a etiqueta exigem', () => {
  it('leva o CPF/CNPJ só com dígitos', () => {
    const p = montarPedidoBetinna({ ...base, documento: '372.585.458-08' })!;

    expect(p.cliente.cpfCnpj).toBe('37258545808');
  });

  it('sem documento, o campo é OMITIDO (string vazia reprova no schema de lá)', () => {
    const p = montarPedidoBetinna({ ...base, documento: null })!;

    expect('cpfCnpj' in p.cliente).toBe(false);
  });

  it('manda o endereço ESTRUTURADO, não só na observação', () => {
    const p = montarPedidoBetinna({ ...base, documento: '37258545808' })!;

    expect(p.entrega).toEqual({
      cep: '01310100',
      logradouro: 'Av. Paulista',
      numero: '1000',
      complemento: 'sala 4',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
    });
  });

  it('UF vai maiúscula e com 2 letras', () => {
    const p = montarPedidoBetinna({
      ...base,
      endereco: { ...(base.endereco as object), uf: 'sp' },
    })!;

    expect(p.entrega?.uf).toBe('SP');
  });

  it('endereço pela METADE não vira entrega torta — o ERP recusaria o pedido', () => {
    const p = montarPedidoBetinna({ ...base, endereco: { cidade: 'São Paulo' } })!;

    expect(p.entrega).toBeUndefined();
    // E o pedido continua válido: sem entrega ainda é pedido, dá pra completar.
    expect(p.itens).toHaveLength(1);
  });
});
