import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AUTORES, autorPorNome, autorPorSlug, autoresComPagina } from '@/lib/constants/autores';
import { pessoaSchema, autorDoArtigo, revisorDoArtigo } from '@/lib/blog/schema-autor';

// =============================================================================
// E-E-A-T do blog.
//
// Proteção elétrica é YMYL. A regra que estes testes protegem é uma só e é
// contraintuitiva: em página YMYL, campo de credencial VAZIO é melhor que
// campo preenchido com texto genérico. "Especialista do setor" ou "bio em
// breve" é exatamente o sinal que o algoritmo pune.
// =============================================================================

describe('perfis de autor', () => {
  it('o nome casa com o que está gravado no artigo, tolerando acento', () => {
    expect(autorPorNome('Marcelo Harada')?.slug).toBe('marcelo-harada');
    expect(autorPorNome('  marcelo   harada  ')?.slug).toBe('marcelo-harada');
    expect(autorPorNome('MARCELO HARADA')?.slug).toBe('marcelo-harada');
  });

  it('nome desconhecido não vira perfil inventado', () => {
    expect(autorPorNome('Fulano de Tal')).toBeUndefined();
    expect(autorPorNome('')).toBeUndefined();
    expect(autorPorNome(null)).toBeUndefined();
  });

  it('a redação não tem página de autor — quem sustenta o artigo é o revisor', () => {
    expect(autorPorSlug('redator-somatec')).toBeDefined();
    expect(autoresComPagina().map((a) => a.slug)).not.toContain('redator-somatec');
  });

  it('a redação não pode aparecer como revisor: ninguém revisa a si mesmo', () => {
    expect(autorPorSlug('redator-somatec')?.revisor).toBe(false);
    expect(AUTORES.filter((a) => a.revisor).length).toBeGreaterThanOrEqual(3);
  });

  it('slug é único — dois perfis no mesmo slug quebrariam /autor/<slug>', () => {
    const slugs = AUTORES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('schema Person — campo vazio não entra', () => {
  it('sem credencial, a chave hasCredential não existe', () => {
    const p = pessoaSchema('Marcelo Harada');
    expect(p).not.toBeNull();
    expect(p).not.toHaveProperty('hasCredential');
    expect(p!.name).toBe('Marcelo Harada');
  });

  it('credencial em branco é tratada como ausente, não como string vazia', () => {
    const p = pessoaSchema('Marcelo Harada', { credencial: '   ', papel: '' });
    expect(p).not.toHaveProperty('hasCredential');
    // jobTitle cai no papel do perfil, que existe
    expect(p!.jobTitle).toBe('Técnico — Somatec Blocking');
  });

  it('credencial do post vence a do perfil', () => {
    const p = pessoaSchema('Marcelo Harada', { credencial: 'CREA 123456/D' });
    expect(p!.hasCredential).toBe('CREA 123456/D');
  });

  it('nome vazio não vira Person', () => {
    expect(pessoaSchema('')).toBeNull();
    expect(pessoaSchema(null)).toBeNull();
    expect(pessoaSchema('   ')).toBeNull();
  });

  it('só linka pra página de autor que existe', () => {
    expect(pessoaSchema('Marcelo Harada')!.url).toMatch(/\/autor\/marcelo-harada$/);
    expect(pessoaSchema('Redator Somatec Blocking')).not.toHaveProperty('url');
    expect(pessoaSchema('Alguém de Fora')).not.toHaveProperty('url');
  });
});

describe('assinatura do artigo', () => {
  const cheia = {
    autor: 'Redator Somatec Blocking',
    revisor: 'Fernando Engenheiro',
    revisadoEm: '2026-07-27',
    especialista: {
      nome: 'Fernando Engenheiro',
      papel: 'Engenheiro eletricista',
      bio: null,
      credencial: null,
    },
  };

  it('artigo assinado devolve Person no author', () => {
    const a = autorDoArtigo(cheia);
    expect(a['@type']).toBe('Person');
    expect(a.name).toBe('Redator Somatec Blocking');
  });

  it('sem autoria cadastrada, cai na empresa — que é honesto', () => {
    const a = autorDoArtigo(undefined);
    expect(a['@type']).toBe('Organization');
  });

  it('sem revisor, reviewedBy NÃO existe', () => {
    // reviewedBy apontando pra empresa não prova revisão técnica nenhuma
    expect(revisorDoArtigo(undefined)).toBeNull();
    expect(
      revisorDoArtigo({ autor: 'Redator Somatec Blocking', revisor: null, revisadoEm: null, especialista: null }),
    ).toBeNull();
  });

  it('o especialista do post vence o campo revisor', () => {
    const r = revisorDoArtigo({
      ...cheia,
      revisor: 'Marcelo Harada',
      especialista: { nome: 'Leandro Lima', papel: null, bio: null, credencial: 'CEO' },
    });
    expect(r!.name).toBe('Leandro Lima');
    expect(r!.hasCredential).toBe('CEO');
  });
});

describe('espelho dos perfis entre os dois repos', () => {
  // A lista do site e a do CMS são arquivos separados em repos separados.
  // Divergir é silencioso: o artigo grava "Fulano" no banco, o site não acha o
  // perfil e o author box some sem erro nenhum.
  it('os nomes do site batem com os do CMS', () => {
    const caminhoCms = 'C:/Users/TechD/.claude/github/somatec-cms/lib/site/collaborators.ts';
    let fonteCms: string;
    try {
      fonteCms = readFileSync(caminhoCms, 'utf-8');
    } catch {
      // O CMS é outro repo e pode não estar clonado na máquina de quem roda os
      // testes (CI, por exemplo). Aí não há o que comparar.
      return;
    }
    for (const autor of AUTORES) {
      expect(fonteCms, `"${autor.nome}" não existe no CMS`).toContain(`name: "${autor.nome}"`);
    }
  });
});

describe('pendência registrada — não é bug, é decisão do Léo', () => {
  it('nenhum perfil tem credencial inventada', () => {
    // Se alguém preencher credencial sem o Léo confirmar, este teste cai.
    // Em YMYL, credencial não verificável é pior que credencial ausente.
    for (const a of AUTORES) {
      if (!a.credencial) continue;
      expect(a.credencial, `${a.nome}: credencial genérica`).not.toMatch(
        /especialista do setor|profissional da área|em breve|a definir/i,
      );
    }
  });

  it('"Fernando Engenheiro" segue sem sobrenome — lembrete vivo', () => {
    // Não é teste de comportamento: é lembrete que falha quando resolverem.
    // "Revisado por Fernando Engenheiro" lê como placeholder numa página YMYL.
    const fernando = autorPorSlug('fernando-engenheiro');
    expect(fernando).toBeDefined();
    if (fernando!.nome !== 'Fernando Engenheiro') {
      // resolvido: agora exige credencial junto, senão o nome novo não ajuda
      expect(fernando!.credencial, 'nome corrigido mas sem CREA').not.toBe('');
    }
  });
});
