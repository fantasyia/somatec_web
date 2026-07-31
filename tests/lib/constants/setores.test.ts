import { describe, it, expect } from 'vitest';
import {
  PUBLICOS,
  SETORES,
  SETOR_OUTROS,
  setoresDoPublico,
  tagsDoLead,
  rotuloSetor,
  tagPublico,
  tagSetor,
} from '@/lib/constants/setores';

// A etiqueta gerada aqui é o que ROTEIA o fluxo de nutrição no Betinna. Se o
// nome mudar sem querer, o lead entra sem rota e ninguém percebe — por isso o
// formato está travado em teste.
describe('taxonomia de público e setor', () => {
  it('gera as duas etiquetas no formato combinado', () => {
    expect(tagsDoLead('comercio', 'cadeia-do-frio')).toEqual([
      'publico:comercio',
      'setor:cadeia-do-frio',
    ]);
  });

  it('não inventa etiqueta quando o lead não escolheu', () => {
    expect(tagsDoLead('', '')).toEqual([]);
    expect(tagsDoLead('industria', '')).toEqual(['publico:industria']);
  });

  it('"Outros" também vira etiqueta — lead nunca fica sem rota', () => {
    expect(tagsDoLead('industria', SETOR_OUTROS.slug)).toContain('setor:outros');
  });

  it('oferece "Outros" em todos os públicos', () => {
    for (const p of PUBLICOS) {
      const slugs = setoresDoPublico(p.id).map((s) => s.slug);
      expect(slugs).toContain(SETOR_OUTROS.slug);
    }
  });

  it('não tem slug duplicado dentro do mesmo público', () => {
    for (const p of PUBLICOS) {
      const slugs = setoresDoPublico(p.id).map((s) => s.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it('todo slug é seguro pra virar etiqueta (sem espaço/acento/maiúscula)', () => {
    const todos = [...Object.values(SETORES).flat(), SETOR_OUTROS];
    for (const s of todos) {
      expect(s.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('devolve o rótulo legível pro campo "segmento" do CRM', () => {
    expect(rotuloSetor('comercio', 'varejo')).toBe('Varejo (supermercado, farmácia, CDD)');
    expect(rotuloSetor('comercio', 'inexistente')).toBe('');
  });

  it('mantém o prefixo das etiquetas', () => {
    expect(tagPublico('residencia')).toBe('publico:residencia');
    expect(tagSetor('autopecas')).toBe('setor:autopecas');
  });
});
