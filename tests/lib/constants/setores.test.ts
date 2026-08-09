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

  // Lista FECHADA pela master em 2026-08-05 (icp-setores.md). Travada aqui
  // porque o fluxo de nutrição filtra por essas strings — mexer sem alinhar do
  // outro lado deixa o lead sem rota, e em silêncio.
  it('bate exatamente com a lista fechada pela master', () => {
    const slugs = (p: Parameters<typeof setoresDoPublico>[0]) =>
      setoresDoPublico(p).map((s) => s.slug);

    expect(slugs('industria')).toEqual([
      'autopecas', 'metalurgia', 'siderurgia', 'mineracao', 'alimenticio-bebidas',
      'farmaceutico-quimico', 'papel-celulose', 'textil-confeccao-calcados',
      'plasticos-borracha-embalagem', 'cadeia-do-frio', 'agronegocio', 'saude',
      'saneamento-utilities', 'energia-solar', 'data-center-telecom', 'outros',
    ]);
    expect(slugs('comercio')).toEqual([
      'cadeia-do-frio', 'varejo', 'condominios', 'tecnologia-ti', 'carros-eletricos',
      'pequenos-fabricantes', 'saude', 'servicos', 'energia-solar', 'outros',
    ]);
    expect(slugs('residencia')).toEqual([
      'residencia-alto-padrao', 'condominios', 'carros-eletricos', 'energia-solar', 'outros',
    ]);
  });

  it('repete de propósito os setores que chegam por mais de um público', () => {
    // A chave do lead é o PAR público+setor. Frigorífico (indústria) e
    // mercearia (comércio) são o mesmo setor por lados diferentes.
    for (const slug of ['cadeia-do-frio', 'saude', 'energia-solar']) {
      expect(setoresDoPublico('industria').map((s) => s.slug)).toContain(slug);
      expect(setoresDoPublico('comercio').map((s) => s.slug)).toContain(slug);
    }
    for (const slug of ['condominios', 'carros-eletricos', 'energia-solar']) {
      expect(setoresDoPublico('comercio').map((s) => s.slug)).toContain(slug);
      expect(setoresDoPublico('residencia').map((s) => s.slug)).toContain(slug);
    }
  });

  // Claim autorizado: protegemos a INSTALAÇÃO de recarga, nunca a bateria do
  // carro (BMS do veículo cobre). O rótulo não pode sugerir o contrário.
  it('o rótulo de carro elétrico não promete proteger a bateria', () => {
    for (const p of ['comercio', 'residencia'] as const) {
      const label = setoresDoPublico(p).find((s) => s.slug === 'carros-eletricos')?.label ?? '';
      expect(label).toMatch(/recarga/i);
      expect(label).not.toMatch(/bateria|ve[íi]culo|carro el[ée]trico protegido/i);
    }
  });
});
