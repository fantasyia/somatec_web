import { describe, it, expect } from 'vitest';
import { validarContato, temErro, apenasDigitos } from '@/lib/forms/validar-contato';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// =============================================================================
// A VALIDAÇÃO DO /contato.
//
// O formulário tinha a UI de erro por campo, mas `errors` só era ZERADO —
// nunca preenchido. Com o `noValidate` no <form>, o /contato ficava sem
// validação nenhuma no cliente: o asterisco vermelho prometia obrigatoriedade
// que não existia, e dava pra enviar tudo em branco.
//
// O caso que originou o card: enviar SEM público. Sem ele o lead não ganha a
// etiqueta `publico:*`, e o fluxo S manda o industrial pro ramo genérico — em
// silêncio, sem nada logar nem alertar.
// =============================================================================

const OK = {
  nome: 'Marcelo Harada',
  email: 'marcelo@exemplo.com.br',
  whatsapp: '(11) 99999-9999',
  publico: 'industria',
  lgpdAceito: true,
};

describe('formulário completo', () => {
  it('preenchido direito não acusa nada', () => {
    expect(validarContato(OK)).toEqual({});
    expect(temErro(validarContato(OK))).toBe(false);
  });

  it('tudo em branco acusa TODOS os obrigatórios de uma vez', () => {
    // Um erro por vez faria a pessoa descobrir os campos a conta-gotas.
    const e = validarContato({ nome: '', email: '', whatsapp: '', publico: '', lgpdAceito: false });
    expect(Object.keys(e).sort()).toEqual(['email', 'lgpd_consent', 'nome', 'publico', 'whatsapp']);
  });
});

describe('público — o buraco que originou o card', () => {
  it('sem público NÃO passa', () => {
    const e = validarContato({ ...OK, publico: '' });
    expect(e.publico).toBeTruthy();
  });

  it('só espaço não conta como escolha', () => {
    expect(validarContato({ ...OK, publico: '   ' }).publico).toBeTruthy();
  });

  it('com público escolhido, passa', () => {
    for (const p of ['industria', 'comercio', 'residencia']) {
      expect(validarContato({ ...OK, publico: p }).publico, p).toBeUndefined();
    }
  });
});

describe('consentimento LGPD', () => {
  it('sem aceitar, não passa', () => {
    expect(validarContato({ ...OK, lgpdAceito: false }).lgpd_consent).toBeTruthy();
  });
});

describe('WhatsApp', () => {
  it('a MÁSCARA não conta como número', () => {
    // "(11) 9999-999" tem 13 caracteres mas só 9 dígitos. Medir o texto cru
    // deixaria passar telefone incompleto.
    expect(validarContato({ ...OK, whatsapp: '(11) 9999-999' }).whatsapp).toBeTruthy();
  });

  it('aceita com e sem máscara', () => {
    for (const z of ['(11) 99999-9999', '11999999999', '+55 11 99999-9999']) {
      expect(validarContato({ ...OK, whatsapp: z }).whatsapp, z).toBeUndefined();
    }
  });

  it('sem DDD não passa', () => {
    expect(validarContato({ ...OK, whatsapp: '99999999' }).whatsapp).toBeTruthy();
  });

  it('número longo demais não passa', () => {
    expect(validarContato({ ...OK, whatsapp: '11999999999999' }).whatsapp).toBeTruthy();
  });

  it('apenasDigitos tira tudo que não é número', () => {
    expect(apenasDigitos('+55 (11) 99999-9999')).toBe('5511999999999');
  });
});

describe('e-mail', () => {
  it('recusa o que não é e-mail', () => {
    for (const m of ['sem-arroba', 'a@b', 'a@b.c', '@dominio.com', 'com espaco@x.com']) {
      expect(validarContato({ ...OK, email: m }).email, m).toBeTruthy();
    }
  });

  it('aceita e-mail comum', () => {
    for (const m of ['a@b.com', 'nome.sobrenome@empresa.com.br']) {
      expect(validarContato({ ...OK, email: m }).email, m).toBeUndefined();
    }
  });
});

describe('nome', () => {
  it('uma letra só não é nome', () => {
    expect(validarContato({ ...OK, nome: 'J' }).nome).toBeTruthy();
  });

  it('espaço em branco não vira nome', () => {
    expect(validarContato({ ...OK, nome: '   ' }).nome).toBeTruthy();
  });
});

// =============================================================================
// A LIGAÇÃO com o formulário.
//
// O defeito original NÃO era falta de regra — era CÓDIGO MORTO: a UI de erro
// por campo existia (`error={errors.x}`), mas `errors` só era zerado. Testar
// só o módulo puro deixaria esse mesmo defeito voltar sem nenhum teste cair.
//
// Estas guardas olham a fonte do ContactForm e cobram as três pontas: chamar,
// guardar o resultado e PARAR antes de enviar.
// =============================================================================

describe('o ContactForm usa mesmo a validação', () => {
  const FONTE = readFileSync(
    resolve(process.cwd(), 'src/components/forms/ContactForm.tsx'),
    'utf-8',
  );
  const CODIGO = FONTE.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .split('\n')
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n');

  it('chama validarContato no envio', () => {
    expect(CODIGO).toContain('validarContato(');
  });

  it('GUARDA o resultado em errors — senão a UI de erro volta a ser código morto', () => {
    // `setErrors({})` sozinho é o bug antigo: zera e nunca preenche.
    expect(CODIGO).toMatch(/setErrors\(problemas\)/);
  });

  it('PARA antes de enviar quando há erro', () => {
    // Sem o `return`, o formulário mostraria o erro e mandaria assim mesmo.
    const i = CODIGO.indexOf('temErro(problemas)');
    expect(i, 'nao achei a checagem de erro').toBeGreaterThan(-1);
    const bloco = CODIGO.slice(i, i + 260);
    expect(bloco).toContain('return');
    // e o return vem ANTES do fetch
    expect(CODIGO.indexOf('return', i)).toBeLessThan(CODIGO.indexOf("fetch('/api/forms/submit'"));
  });

  it('valida ANTES de marcar como enviando', () => {
    // Com o `submitting` na frente, o botão desabilita e o formulário parece
    // travar sem a pessoa saber por quê.
    expect(CODIGO.indexOf('validarContato(')).toBeLessThan(CODIGO.indexOf("setStatus('submitting')"));
  });

  it('a varredura está lendo o arquivo certo (âncora anti-falso-verde)', () => {
    expect(CODIGO).toContain('lgpd_consent');
    expect(CODIGO.length).toBeGreaterThan(3000);
  });
});
