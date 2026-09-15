import { describe, it, expect, vi } from 'vitest';
import { criarFetchComRetentativa } from '@/lib/supabase/admin';

// =============================================================================
// RETENTATIVA EM 5xx DE GATEWAY — guarda do card do 504 em rajadas (15/09/2026).
//
// O que se protege aqui NÃO é "existe um retry". É o contrário: é o conjunto de
// coisas que o retry NÃO pode fazer.
//
// 1. NÃO repetir escrita. Se o POST gravou e só a resposta se perdeu, repetir
//    grava de novo. O caminho do checkout passa por aqui.
// 2. NÃO repetir 500. 500 do PostgREST é erro de query; repetir esconde o
//    defeito em vez de mostrá-lo. Só 502/503/504, que são do gateway.
// 3. NÃO repetir mais de uma vez. Rajada medida dura ~5 s; um laço de
//    retentativa em cima de um gateway já travado empilha requisição em fila.
// =============================================================================

function resposta(status: number): Response {
  return new Response(status === 200 ? '[]' : 'gateway', { status });
}

/** `fetch` falso que devolve os status na ordem dada, e conta as chamadas. */
function fetchFalso(...status: number[]) {
  const chamadas: { url: string; metodo: string }[] = [];
  let i = 0;
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    chamadas.push({
      url: String(input),
      metodo: (init?.method ?? 'GET').toUpperCase(),
    });
    return resposta(status[Math.min(i++, status.length - 1)] ?? 200);
  });
  return { fn: fn as unknown as typeof fetch, chamadas, mock: fn };
}

const URL_TABELA = 'https://projeto.supabase.co/rest/v1/site_settings?select=*';

describe('retentativa do client admin', () => {
  it('repete UMA vez quando o gateway devolve 504 num GET', async () => {
    const f = fetchFalso(504, 200);
    const r = await criarFetchComRetentativa(f.fn, 0)(URL_TABELA);

    expect(f.mock).toHaveBeenCalledTimes(2);
    expect(r.status).toBe(200);
  });

  it.each([502, 503, 504])('repete no status %i', async (status) => {
    const f = fetchFalso(status, 200);
    await criarFetchComRetentativa(f.fn, 0)(URL_TABELA);
    expect(f.mock).toHaveBeenCalledTimes(2);
  });

  it('NÃO repete quando a rajada acabou (resposta boa de primeira)', async () => {
    const f = fetchFalso(200);
    await criarFetchComRetentativa(f.fn, 0)(URL_TABELA);
    expect(f.mock).toHaveBeenCalledTimes(1);
  });

  it('🔴 NÃO repete POST — a 1ª tentativa pode ter GRAVADO', async () => {
    // É o caminho do INSERT do pedido. Repetir aqui cria linha duplicada
    // quando o banco recebeu e só a resposta se perdeu; quem sabe reenviar com
    // segurança é a camada de cima, que tem chave de idempotência.
    const f = fetchFalso(504, 200);
    const r = await criarFetchComRetentativa(f.fn, 0)(URL_TABELA, { method: 'POST' });

    expect(f.mock, 'POST não pode ser repetido no transporte').toHaveBeenCalledTimes(1);
    expect(r.status).toBe(504);
  });

  it.each(['POST', 'PATCH', 'DELETE', 'PUT'])('NÃO repete %s', async (metodo) => {
    const f = fetchFalso(504, 200);
    await criarFetchComRetentativa(f.fn, 0)(URL_TABELA, { method: metodo });
    expect(f.mock).toHaveBeenCalledTimes(1);
  });

  it('repete HEAD, que é leitura (o `count` do PostgREST usa HEAD)', async () => {
    const f = fetchFalso(504, 200);
    await criarFetchComRetentativa(f.fn, 0)(URL_TABELA, { method: 'HEAD' });
    expect(f.mock).toHaveBeenCalledTimes(2);
  });

  it('🔴 NÃO repete 500 — é erro de query, e repetir esconderia o defeito', async () => {
    const f = fetchFalso(500, 200);
    const r = await criarFetchComRetentativa(f.fn, 0)(URL_TABELA);

    expect(f.mock).toHaveBeenCalledTimes(1);
    expect(r.status).toBe(500);
  });

  it('NÃO repete 4xx', async () => {
    const f = fetchFalso(401, 200);
    await criarFetchComRetentativa(f.fn, 0)(URL_TABELA);
    expect(f.mock).toHaveBeenCalledTimes(1);
  });

  it('🔴 desiste depois da 2ª — nunca vira laço em cima de gateway travado', async () => {
    const f = fetchFalso(504, 504, 504, 504);
    const r = await criarFetchComRetentativa(f.fn, 0)(URL_TABELA);

    expect(f.mock, 'no máximo 2 idas ao gateway').toHaveBeenCalledTimes(2);
    expect(r.status, 'o erro continua chegando a quem chamou').toBe(504);
  });

  it('devolve a resposta da 2ª tentativa, não a da 1ª', async () => {
    const f = fetchFalso(504, 200);
    const r = await criarFetchComRetentativa(f.fn, 0)(URL_TABELA);
    expect(await r.text()).toBe('[]');
  });

  it('erro LANÇADO pelo fetch sobe — não é engolido nem repetido', async () => {
    // Fora do escopo de propósito: o sintoma medido é um 504 do gateway, com
    // resposta HTTP. Repetir exceção de rede aqui seria palpite.
    const explode = vi.fn(async () => {
      throw new Error('ECONNRESET');
    });
    await expect(
      criarFetchComRetentativa(explode as unknown as typeof fetch, 0)(URL_TABELA),
    ).rejects.toThrow('ECONNRESET');
    expect(explode).toHaveBeenCalledTimes(1);
  });

  it('a espera é respeitada entre as duas idas', async () => {
    const f = fetchFalso(504, 200);
    const inicio = Date.now();
    await criarFetchComRetentativa(f.fn, 60)(URL_TABELA);
    expect(Date.now() - inicio).toBeGreaterThanOrEqual(50);
  });
});

describe('o que vai pro log não leva dado de pessoa', () => {
  it('a query do PostgREST fica de fora do caminho registrado', async () => {
    // `?email=eq.fulano@x.com` é filtro comum do PostgREST. Se o caminho fosse
    // registrado inteiro, o log — e o Sentry atrás dele — passaria a guardar
    // e-mail e id de cliente toda vez que o gateway piscasse.
    const fonte = require('node:fs').readFileSync(
      require('node:path').resolve(process.cwd(), 'src/lib/supabase/admin.ts'),
      'utf-8',
    ) as string;

    expect(fonte).toContain('new URL(bruto).pathname');
    expect(fonte, 'não registrar href/search do request').not.toMatch(
      /caminho:\s*(String\(input\)|bruto)\b/,
    );
  });
});
