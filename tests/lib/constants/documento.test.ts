import { describe, it, expect } from 'vitest';
import { documentoValido, mascararDocumento, apenasDigitos } from '@/lib/constants/documento';

// =============================================================================
// Documento ERRADO é pior que documento faltando.
//
// O faltando aparece na hora — o campo está vazio. O errado só aparece na
// emissão da nota, com a venda já fechada, o cliente esperando o produto e
// alguém tendo que ligar pra pedir o número certo. Que é exatamente o que não
// pode acontecer: depois da compra, a pessoa só recebe.
//
// Por isso a validação é de dígito verificador, não de quantidade de números.
// =============================================================================

describe('documentoValido', () => {
  it('aceita CPF válido, com e sem pontuação', () => {
    expect(documentoValido('372.585.458-08')).toBe(true);
    expect(documentoValido('37258545808')).toBe(true);
  });

  it('aceita CNPJ válido', () => {
    expect(documentoValido('16.774.052/0001-55')).toBe(true);
    expect(documentoValido('16774052000155')).toBe(true);
  });

  it('recusa CPF com dígito verificador errado — o caso que trava a NF depois', () => {
    expect(documentoValido('37258545809')).toBe(false);
    expect(documentoValido('12345678901')).toBe(false);
  });

  it('recusa CNPJ com dígito errado', () => {
    expect(documentoValido('16774052000156')).toBe(false);
  });

  it('recusa sequência repetida (111.111.111-11 passa em checagem ingênua)', () => {
    expect(documentoValido('11111111111')).toBe(false);
    expect(documentoValido('00000000000000')).toBe(false);
  });

  it('recusa tamanho que não é nem CPF nem CNPJ', () => {
    expect(documentoValido('123')).toBe(false);
    expect(documentoValido('372585458081')).toBe(false);
    expect(documentoValido('')).toBe(false);
  });
});

describe('mascararDocumento', () => {
  it('formata CPF conforme digita', () => {
    expect(mascararDocumento('372')).toBe('372');
    expect(mascararDocumento('37258')).toBe('372.58');
    expect(mascararDocumento('37258545808')).toBe('372.585.458-08');
  });

  it('vira formato de CNPJ ao passar de 11 dígitos', () => {
    expect(mascararDocumento('16774052000155')).toBe('16.774.052/0001-55');
  });

  it('não deixa passar de 14 dígitos', () => {
    expect(apenasDigitos(mascararDocumento('1677405200015599999'))).toHaveLength(14);
  });

  it('ignora o que não é número (colar de outro lugar não quebra)', () => {
    expect(mascararDocumento('CPF: 372.585.458-08')).toBe('372.585.458-08');
  });
});
