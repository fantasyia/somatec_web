import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ErrorEvent } from '@sentry/nextjs';
import { limparEvento, limparTexto } from '@/lib/observabilidade/sentry-limpeza';

// =============================================================================
// O FILTRO DO SENTRY TEM DOIS JEITOS DE FALHAR, E OS DOIS SÃO CAROS.
//
//   1. LIMPAR DE MENOS → dado pessoal de cliente sai pra um terceiro. LGPD, e
//      irreversível.
//   2. LIMPAR DEMAIS → o erro chega vazio e o Sentry vira uma lista de nada.
//
// O (2) aconteceu de verdade em 09/09: a primeira versão comparava nome de
// campo por "contém", e `exCEPtion` contém `cep` — o evento chegava com
// `"exception": "[redigido]"`, sem mensagem e sem pilha. O código compilava e
// o teste de unidade da época passava; só apareceu interceptando o envio real.
//
// Por isso os dois lados estão travados aqui.
// =============================================================================

function eventoBase(): ErrorEvent {
  return {
    exception: {
      values: [
        {
          type: 'Error',
          value: 'Falha ao entregar lead joao@empresa.com.br',
          stacktrace: { frames: [{ filename: 'app.ts', lineno: 10 }] },
        },
      ],
    },
    contexts: { runtime: { name: 'node', version: 'v22' } },
    server_name: 'railway-abc',
  } as unknown as ErrorEvent;
}

describe('⛔ não pode limpar DEMAIS — erro sem pilha é erro inútil', () => {
  it('preserva a exception inteira: tipo, mensagem e pilha', () => {
    const ev = limparEvento(eventoBase())!;
    const v = ev.exception!.values![0];
    expect(typeof ev.exception).toBe('object');
    expect(v.type).toBe('Error');
    expect(v.value).toContain('Falha ao entregar lead');
    expect(v.stacktrace!.frames!.length).toBe(1);
  });

  it('`exception` não pode ser confundido com `cep` — o bug de 09/09', () => {
    const ev = limparEvento(eventoBase())!;
    expect(ev.exception).not.toBe('[redigido]');
  });

  it('não apaga o contexto técnico do SDK', () => {
    const ev = limparEvento(eventoBase())!;
    // `name` é campo sensível de lead, mas aqui é o nome do runtime.
    expect((ev.contexts!.runtime as { name: string }).name).toBe('node');
    expect(ev.server_name).toBe('railway-abc');
  });

  it('não corrompe número que não é telefone (id, timestamp, amostragem)', () => {
    // A primeira versão casava qualquer sequência de 10-11 dígitos e comia
    // trace id e sample_rand do próprio Sentry.
    expect(limparTexto('trace 9702c7aa903a48c98a4ad2af0023b893')).toContain('9702c7aa');
    expect(limparTexto('sample_rand 0.532593534')).toBe('sample_rand 0.532593534');
    expect(limparTexto('timestamp 1788966678797')).toBe('timestamp 1788966678797');
  });
});

describe('🔒 nem de MENOS — dado de cliente não sai', () => {
  it('e-mail solto no texto do erro é redigido', () => {
    const ev = limparEvento(eventoBase())!;
    expect(JSON.stringify(ev)).not.toContain('joao@empresa.com.br');
    expect(ev.exception!.values![0].value).toContain('[redigido]');
  });

  it('telefone com forma é redigido; número cru sem forma não é confundido', () => {
    expect(limparTexto('ligar (11) 99999-0000')).toContain('[redigido]');
    expect(limparTexto('ligar 11 99999-0000')).toContain('[redigido]');
    expect(limparTexto('ligar +55 11 99999-0000')).toContain('[redigido]');
  });

  it('CPF e CNPJ mascarados são redigidos', () => {
    expect(limparTexto('CPF 123.456.789-00')).toContain('[redigido]');
    expect(limparTexto('CNPJ 16.774.052/0001-55')).toContain('[redigido]');
  });

  it('campo sensível vira [redigido] pelo NOME, com igualdade', () => {
    const ev = limparEvento({
      ...eventoBase(),
      extra: { email: 'a@b.com', whatsapp: '11999990000', documento: '12345678900', setor: 'comercio' },
    } as unknown as ErrorEvent)!;
    const extra = ev.extra as Record<string, unknown>;
    expect(extra.email).toBe('[redigido]');
    expect(extra.whatsapp).toBe('[redigido]');
    expect(extra.documento).toBe('[redigido]');
    // campo que NÃO é sensível continua legível — é o que dá contexto ao erro
    expect(extra.setor).toBe('comercio');
  });

  it('o corpo da requisição NUNCA vai — é onde mora o lead inteiro', () => {
    const ev = limparEvento({
      ...eventoBase(),
      request: {
        url: 'https://site/api/forms/submit',
        data: { name: 'João', email: 'joao@empresa.com.br', documento: '12345678900' },
        cookies: { sessao: 'abc' },
        headers: { 'x-api-key': 'segredo', 'user-agent': 'Mozilla' },
      },
    } as unknown as ErrorEvent)!;
    expect(ev.request!.data).toBeUndefined();
    expect(ev.request!.cookies).toBeUndefined();
    expect(ev.request!.headers!['x-api-key']).toBe('[redigido]');
    expect(ev.request!.headers!['user-agent']).toBe('Mozilla');
    expect(JSON.stringify(ev)).not.toContain('joao@empresa.com.br');
  });
});

describe('ruído não gasta cota', () => {
  it('descarta erro de extensão de navegador e ResizeObserver', () => {
    for (const msg of [
      'ResizeObserver loop completed with undelivered notifications',
      'Script error from chrome-extension://abc',
    ]) {
      const ev = { exception: { values: [{ type: 'Error', value: msg }] } } as ErrorEvent;
      expect(limparEvento(ev)).toBeNull();
    }
  });
});

describe('a init está amarrada ao filtro', () => {
  const ler = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf-8');

  it.each([
    ['servidor', 'src/instrumentation.ts'],
    ['navegador', 'src/instrumentation-client.ts'],
  ])('%s usa beforeSend e não manda PII por padrão', (_, arquivo) => {
    const fonte = ler(arquivo);
    expect(fonte).toContain('beforeSend: limparEvento');
    expect(fonte).toMatch(/sendDefaultPii:\s*false/);
  });

  it('sem DSN nada é inicializado — build e dev não enviam nada', () => {
    expect(ler('src/instrumentation.ts')).toMatch(/if \(!dsn\) return;/);
    expect(ler('src/instrumentation-client.ts')).toMatch(/if \(dsn\)/);
  });

  it('replay de sessão fica DESLIGADO — ele grava a tela, e a tela tem CPF', () => {
    const fonte = ler('src/instrumentation-client.ts');
    expect(fonte).toMatch(/replaysSessionSampleRate:\s*0/);
    expect(fonte).toMatch(/replaysOnErrorSampleRate:\s*0/);
  });
});

describe('🔑 segredo que viaja na URL — o furo que veio de fora', () => {
  // Achado em 09/09 pela sessão do app, no Betinna: o segredo do webhook do
  // Tiny era um SEGMENTO da URL, e todo lugar que ecoava a URL publicava o
  // segredo — resposta, log e contexto do Sentry. O filtro deles estava certo
  // pra dado de pessoa; o vazamento entrou pelo caminho, que ninguém vigiava.
  //
  // Aqui existe o mesmo formato: `/api/blog/revalidar` aceita
  // `BLOG_REVALIDATE_SECRET` por header OU por `?secret=`.

  it('redige o valor e PRESERVA o nome do parâmetro', () => {
    const limpo = limparTexto('/api/blog/revalidar?secret=s3nh4-de-verdade&slug=vtcd');
    expect(limpo).not.toContain('s3nh4-de-verdade');
    // saber que veio um `secret=` ajuda a entender a chamada
    expect(limpo).toContain('secret=');
    // e o resto da URL continua legível — é o que diz QUAL rota quebrou
    expect(limpo).toContain('/api/blog/revalidar');
    expect(limpo).toContain('slug=vtcd');
  });

  it.each(['token', 'access_token', 'apikey', 'api_key', 'password', 'senha', 'signature'])(
    'pega também `%s=`',
    (nome) => {
      expect(limparTexto(`https://site/x?${nome}=abc123XYZ`)).not.toContain('abc123XYZ');
    },
  );

  it('funciona com a query string solta, sem o `?` na frente', () => {
    // o Sentry manda `request.query_string` sem o `?`
    expect(limparTexto('secret=abc123&slug=x')).not.toContain('abc123');
  });

  it('⛔ NÃO redige parâmetro inocente nem a palavra solta no texto', () => {
    expect(limparTexto('/blog?slug=meu-artigo&utm_source=google')).toBe(
      '/blog?slug=meu-artigo&utm_source=google',
    );
    // "secret" no meio de uma frase não é um parâmetro
    expect(limparTexto('o segredo nao pode vazar')).toBe('o segredo nao pode vazar');
    expect(limparTexto('failed to read secret from env')).toBe('failed to read secret from env');
  });

  it('limpa a URL do request no evento, não só a query string', () => {
    // Limpar só a query deixava o segredo passar pelo outro campo: o SDK
    // costuma montar a URL COMPLETA em `request.url`.
    const ev = limparEvento({
      exception: { values: [{ type: 'Error', value: 'boom' }] },
      request: {
        url: 'https://site/api/blog/revalidar?secret=valor-secreto',
        query_string: 'secret=valor-secreto',
      },
    } as unknown as ErrorEvent)!;

    expect(JSON.stringify(ev)).not.toContain('valor-secreto');
    expect(ev.request!.url).toContain('/api/blog/revalidar');
  });
});
