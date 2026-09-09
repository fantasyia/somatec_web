import { describe, it, expect } from 'vitest';
import {
  GATEWAY_ATIVO,
  FRETE_GRATIS,
  FORMAS_PAGAMENTO,
  enderecoVazio,
  enderecoCompleto,
  enderecoEmUmaLinha,
  freteDoPedido,
  MAX_PARCELAS,
  PARCELA_MINIMA_CENTAVOS,
  parcelasDisponiveis,
  valorDaParcela,
} from '@/lib/constants/pagamento';

// O checkout NI fecha pedido de verdade: endereço errado ou frete cobrado por
// engano viram prejuízo/retrabalho. Estes testes travam as regras que a tela
// depende — e a trava do gateway, que não pode ser ligada por acidente.

const enderecoOk = {
  cep: '01310-100',
  logradouro: 'Avenida Paulista',
  numero: '1000',
  complemento: '',
  bairro: 'Bela Vista',
  cidade: 'São Paulo',
  uf: 'SP',
};

describe('pagamento — travas de integração', () => {
  it('gateway continua desligado até a conexão ser feita', () => {
    expect(GATEWAY_ATIVO).toBe(false);
  });

  it('promoção de frete grátis está vigente', () => {
    expect(FRETE_GRATIS).toBe(true);
    expect(freteDoPedido().valor).toBe(0);
  });

  it('sempre há um texto de prazo pra mostrar ao cliente', () => {
    expect(freteDoPedido().prazo.length).toBeGreaterThan(0);
  });
});

describe('formas de pagamento', () => {
  it('oferece pix e cartão, com id único', () => {
    // Boleto saiu em 08/09 (decisão do Léo): o e-commerce cobra só PIX e
    // cartão. A lista é a fonte — a tela e a tradução pro gateway leem dela.
    const ids = FORMAS_PAGAMENTO.map((f) => f.id);
    expect(ids).toEqual(['pix', 'cartao']);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('toda forma tem rótulo e detalhe preenchidos', () => {
    for (const f of FORMAS_PAGAMENTO) {
      expect(f.label.trim()).not.toBe('');
      expect(f.detalhe.trim()).not.toBe('');
    }
  });
});

describe('enderecoCompleto', () => {
  it('rejeita o endereço vazio', () => {
    expect(enderecoCompleto(enderecoVazio)).toBe(false);
  });

  it('aceita o endereço com todos os campos obrigatórios', () => {
    expect(enderecoCompleto(enderecoOk)).toBe(true);
  });

  it('complemento é opcional', () => {
    expect(enderecoCompleto({ ...enderecoOk, complemento: 'apto 51' })).toBe(true);
  });

  it.each(['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'uf'] as const)(
    'exige %s',
    (campo) => {
      expect(enderecoCompleto({ ...enderecoOk, [campo]: '' })).toBe(false);
    },
  );
});

describe('enderecoEmUmaLinha', () => {
  it('monta a linha que vai no lead do Betinna', () => {
    expect(enderecoEmUmaLinha(enderecoOk)).toBe(
      'Avenida Paulista, 1000 — Bela Vista, São Paulo/SP — CEP 01310-100',
    );
  });

  it('inclui o complemento quando existe', () => {
    expect(enderecoEmUmaLinha({ ...enderecoOk, complemento: 'apto 51' })).toContain(
      '1000, apto 51 —',
    );
  });
});

describe('parcelamento no cartão', () => {
  it('vai até 6x — a regra comercial do Léo (09/09)', () => {
    expect(MAX_PARCELAS).toBe(6);
    expect(parcelasDisponiveis(4_350_00)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('pedido pequeno não vira 6 parcelas de trocado', () => {
    // Cada parcela custa a mesma tarifa fixa do gateway: parcelar R$ 120 em 6
    // come a margem do pedido inteiro.
    expect(parcelasDisponiveis(120_00)).toEqual([1, 2]);
    expect(parcelasDisponiveis(PARCELA_MINIMA_CENTAVOS)).toEqual([1]);
  });

  it('à vista SEMPRE é opção, mesmo em pedido de valor mínimo', () => {
    expect(parcelasDisponiveis(0)).toEqual([1]);
    expect(parcelasDisponiveis(1)).toEqual([1]);
  });

  it('a parcela exibida é o total dividido — sem juros', () => {
    expect(valorDaParcela(4_350_00, 6)).toBe(725_00);
    expect(valorDaParcela(4_350_00, 1)).toBe(4_350_00);
  });
});
