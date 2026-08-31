// =============================================================================
// CPF / CNPJ do comprador.
//
// Não é burocracia de formulário: **sem documento não se emite nota fiscal**, e
// sem nota não sai etiqueta. O pedido de teste de 31/08 chegou no ERP sem CPF e
// ficou impossível de faturar — o cliente teria que ser incomodado depois, que
// é exatamente o que não pode acontecer.
//
// E documento ERRADO é pior que documento faltando: o faltando você percebe na
// hora, o errado só aparece na emissão da nota, com a venda já fechada. Por
// isso aqui valida dígito verificador, não só a quantidade de números.
// =============================================================================

export function apenasDigitos(v: string): string {
  return (v ?? '').replace(/\D/g, '');
}

function cpfValido(d: string): boolean {
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  for (const [ate, pos] of [
    [9, 10],
    [10, 11],
  ] as const) {
    let soma = 0;
    for (let i = 0; i < ate; i += 1) soma += Number(d[i]) * (pos - i);
    const resto = (soma * 10) % 11 % 10;
    if (resto !== Number(d[ate])) return false;
  }
  return true;
}

function cnpjValido(d: string): boolean {
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (ate: number): number => {
    let peso = ate - 7;
    let soma = 0;
    for (let i = 0; i < ate; i += 1) {
      soma += Number(d[i]) * peso;
      peso -= 1;
      if (peso < 2) peso = 9;
    }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

/** Aceita CPF ou CNPJ, com ou sem pontuação. */
export function documentoValido(bruto: string): boolean {
  const d = apenasDigitos(bruto);
  return d.length === 11 ? cpfValido(d) : d.length === 14 ? cnpjValido(d) : false;
}

/** 123.456.789-09 / 12.345.678/0001-95 — formata conforme a pessoa digita. */
export function mascararDocumento(bruto: string): string {
  const d = apenasDigitos(bruto).slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
}
