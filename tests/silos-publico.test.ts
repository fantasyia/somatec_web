import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CLUSTER_PUBLICO,
  CLUSTER_INDUSTRIAL,
  publicoDoCluster,
} from '@/lib/constants/publico-clusters';

// =============================================================================
// TODO SILO PRECISA ESTAR CLASSIFICADO — NI ou industrial, explicitamente.
//
// `publico-clusters.ts` é a ÚNICA tradução silo → público das LPs NI. E o jeito
// como ele diz "industrial" é por AUSÊNCIA: silo que não está no mapa devolve
// null, e o artigo não aparece em LP nenhuma.
//
// Isso torna "é industrial" e "alguém esqueceu de classificar" indistinguíveis.
// O artigo some sem erro, sem log, sem nada — e o sintoma aparece semanas
// depois como "por que o artigo de casa não está na landing de casa?".
//
// Já aconteceu duas reestruturações de silo (42→24 em 05/08, 25→31 em 07/09).
// Vai acontecer de novo. Este teste lê os silos do `cluster-mapa.html` — a
// fonte que o blog e a master usam — e exige que cada um esteja num dos dois
// lados. Silo novo não classificado quebra o build.
// =============================================================================

/** Lê os silos do mapa: `{id:'vtcd',name:'VTCD',...}`. */
function silosDoMapa(): Array<{ id: string; nome: string }> {
  const html = readFileSync(resolve(process.cwd(), 'public/cluster-mapa.html'), 'utf-8');
  const out: Array<{ id: string; nome: string }> = [];
  for (const m of html.matchAll(/\{id:'([a-z0-9-]+)',name:'([^']+)'/g)) {
    out.push({ id: m[1], nome: m[2] });
  }
  return [...new Map(out.map((s) => [s.id, s])).values()];
}

describe('silos do cluster-mapa × publico-clusters.ts', () => {
  const silos = silosDoMapa();

  it('a leitura do mapa funciona (âncora anti-falso-verde)', () => {
    // Sem isto, um mapa que mudasse de formato faria o teste passar sobre
    // ZERO silos — verde sobre nada, que é o modo de falhar deste projeto.
    expect(silos.length).toBeGreaterThan(25);
    expect(silos.map((s) => s.id)).toContain('vtcd');
    expect(silos.map((s) => s.id)).toContain('residencial');
  });

  it('🔴 todo silo está classificado — NI ou industrial declarado', () => {
    const semClassificacao = silos.filter(
      (s) => !(s.id in CLUSTER_PUBLICO) && !CLUSTER_INDUSTRIAL.includes(s.id),
    );
    expect(
      semClassificacao.map((s) => `${s.id} (${s.nome})`),
      'silo sem classificação some das LPs sem erro nenhum — decida NI ou industrial em publico-clusters.ts',
    ).toEqual([]);
  });

  it('nenhum silo está dos DOIS lados', () => {
    const ambiguos = silos.filter(
      (s) => s.id in CLUSTER_PUBLICO && CLUSTER_INDUSTRIAL.includes(s.id),
    );
    expect(ambiguos.map((s) => s.id)).toEqual([]);
  });

  it('a lista de industriais não guarda silo que já não existe', () => {
    // Lista que envelhece sem ninguém notar vira ruído e para de ser lida.
    const ids = new Set(silos.map((s) => s.id));
    const orfaos = CLUSTER_INDUSTRIAL.filter((id) => !ids.has(id));
    expect(orfaos, 'silos removidos do mapa continuam listados como industriais').toEqual([]);
  });
});

describe('os dois silos NI de 07/09 resolvem pelos dois nomes', () => {
  // O artigo pode chegar com o ID (do CMS) ou com o RÓTULO exibido — o arquivo
  // aceita as duas formas de propósito. Se só uma estiver mapeada, o artigo
  // some dependendo de por onde veio, que é pior que sumir sempre.
  it.each([
    ['pequena-industria', 'comercial'],
    ['Pequena indústria', 'comercial'],
    ['nichos-digitais', 'residencial'],
    ['Nichos digitais', 'residencial'],
  ])('%s → %s', (cluster, esperado) => {
    expect(publicoDoCluster(cluster)).toBe(esperado);
  });

  it('data-center-telecom continua INDUSTRIAL — é a outra metade de tecnologia', () => {
    expect(publicoDoCluster('data-center-telecom')).toBeNull();
    expect(publicoDoCluster('Data center e telecom')).toBeNull();
  });

  it('os ids aposentados não voltam a resolver', () => {
    // `decisao`, `maquinas` e `tecnologia` deixaram de existir em 07/09.
    for (const velho of ['decisao', 'maquinas', 'tecnologia']) {
      expect(publicoDoCluster(velho), `${velho} devia estar aposentado`).toBeNull();
    }
  });
});
