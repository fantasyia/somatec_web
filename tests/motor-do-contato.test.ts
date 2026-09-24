import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { motorDoContato } from '@/lib/analytics/eventos';

// =============================================================================
// O MOTOR DO /contato vem do que a pessoa ESCOLHEU — card de 23/09/2026.
//
// Até 23/09 a linha era `interest_type === 'representante' ? 'representante'
// : 'industrial'`: o formulário perguntava o público e jogava a resposta fora.
// Todo lead de loja e de casa chegava ao GA4 e à Meta como INDÚSTRIA.
//
// O erro passou porque o teste que existia (`eventos-funil.test.ts`) chama
// `rastrearLead` com o motor já pronto. O emissor estava coberto; quem ESCOLHE
// o motor, não. Este arquivo cobre a escolha.
// =============================================================================

describe('cada público vira o motor certo', () => {
  it.each([
    ['industria', 'industrial'],
    ['comercio', 'nao_industrial'],
    ['residencia', 'nao_industrial'],
  ])('público %s → motor %s', (publico, motor) => {
    expect(motorDoContato('b2b', publico)).toBe(motor);
  });

  it('🔴 comércio NÃO é industrial — era exatamente o erro', () => {
    expect(motorDoContato('b2b', 'comercio')).not.toBe('industrial');
  });

  it('🔴 residência NÃO é industrial', () => {
    expect(motorDoContato('b2b', 'residencia')).not.toBe('industrial');
  });
});

describe('o que não é motor de venda', () => {
  it('representante vence o público — é recrutamento, não cliente', () => {
    // Mesmo que alguém marque "Indústria", candidato a rep não pode cair no
    // público de anúncio do cliente industrial.
    for (const p of ['industria', 'comercio', 'residencia', '', undefined]) {
      expect(motorDoContato('representante', p)).toBe('representante');
    }
  });
});

describe('🔴 sem resposta é indefinido — nunca palpite', () => {
  it.each([[''], [undefined], [null]])('público %p → indefinido', (publico) => {
    expect(motorDoContato('b2b', publico)).toBe('indefinido');
  });

  it('valor desconhecido também é indefinido, não não-industrial', () => {
    // Estrita de propósito: se amanhã o formulário ganhar um público novo e
    // ninguém atualizar esta função, o lead cai em "não sei" em vez de ser
    // rotulado errado. Dado errado que parece certo é o pior dos três.
    expect(motorDoContato('b2b', 'condominio')).toBe('indefinido');
    expect(motorDoContato('b2b', 'INDUSTRIA')).toBe('indefinido');
  });
});

describe('o formulário usa a função', () => {
  const form = readFileSync(resolve(process.cwd(), 'src/components/forms/ContactForm.tsx'), 'utf-8');
  const semComentario = form
    .split('\n')
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n');

  it('🔴 o motor passa por motorDoContato com o público', () => {
    expect(semComentario).toMatch(/motor: motorDoContato\([^)]*publico\)/);
  });

  it('🔴 o padrão antigo não volta', () => {
    // A linha que rotulava tudo como industrial.
    expect(semComentario).not.toMatch(/'representante'\s*:\s*'industrial'/);
  });
});
