import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cotarFreteErp, montarItens, normalizar, dimensoesCm } from '@/lib/erp/frete';

// =============================================================================
// Cotação de frete pelo ERP.
//
// O que está em jogo aqui é o PRAZO na tela do cliente — o único número do
// checkout que ele leva a sério e cobra depois. Duas coisas o estragam em
// silêncio: cotar numa fonte diferente da que despacha (prazo da tela ≠ prazo
// da etiqueta) e a cotação falhar de um jeito que trave a venda em vez de
// cair no "confirmado no pedido".
// =============================================================================

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.stubEnv('ERP_COTACAO_URL', 'https://erp.olist.com/webhook/api/v1/parceiro/53309/cotar');
  vi.stubEnv('ERP_API_TOKEN', 'token-da-conta');
  vi.restoreAllMocks();
});
afterEach(() => vi.unstubAllEnvs());

function respondeCom(corpo: unknown, status = 200) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(JSON.stringify(corpo), { status }));
}

describe('montagem dos itens', () => {
  it('converte milímetro em centímetro e vírgula em ponto (o ERP fala cm e kg)', () => {
    // MB-01: 150 × 100 × 60 mm, 1,4 kg
    const [i] = montarItens([{ model: 'MB-01', quantidade: 1 }]);

    expect(i).toMatchObject({
      sku: 'MB-01',
      comprimento: 15,
      largura: 10,
      altura: 6,
      peso: 1.4,
    });
  });

  it('dimensão menor que 1 cm vira 1 — zero seria recusado como caixa sem volume', () => {
    expect(dimensoesCm('4 × 3 × 2')).toEqual({ comprimento: 1, largura: 1, altura: 1 });
  });

  it('modelo que não existe no catálogo é descartado, não vira item torto', () => {
    expect(
      montarItens([
        { model: 'MB-01', quantidade: 1 },
        { model: 'nao-sei', quantidade: 1 },
      ]),
    ).toHaveLength(1);
  });

  it('quantidade zero vira 1 (carrinho não cota caixa nenhuma)', () => {
    expect(montarItens([{ model: 'MB-01', quantidade: 0 }])[0].quantidade).toBe(1);
  });
});

describe('normalização da resposta', () => {
  it('lê preço, prazo e transportadora com os nomes do contrato', () => {
    // Fixture com os nomes na posição REAL (conferido em produção): a fixture
    // antiga tinha os dois trocados, e por isso o teste passava com o código
    // errado — o erro só apareceu na tela.
    const [o] = normalizar([
      {
        preco: 89.9,
        prazo: 4,
        id_forma_envio: 12,
        nome_forma_envio: 'Jadlog via Melhor Envio',
        nome_forma_frete: '.Package',
      },
    ]);

    expect(o).toEqual({
      id: '12',
      nome: '.Package',
      transportadora: 'Jadlog',
      valor: 89.9,
      prazoDias: 4,
    });
  });

  it('preço em string vira número (o ERP às vezes manda assim)', () => {
    expect(normalizar([{ preco: '45.50', prazo: '3', nome_forma_envio: 'X' }])[0]).toMatchObject({
      valor: 45.5,
      prazoDias: 3,
    });
  });

  it('opção com erro ou sem preço não vai pra tela', () => {
    expect(
      normalizar([
        { erro: 'sem cobertura', nome_forma_envio: 'A' },
        { nome_forma_envio: 'B' },
        { preco: 10, prazo: 2, nome_forma_envio: 'C' },
      ]),
    ).toHaveLength(1);
  });

  it('PRESERVA a ordem do ERP — a primeira é a preferencial, que é quem despacha', () => {
    // Reordenar por prazo (ou preço) faria a tela prometer o prazo de uma
    // transportadora e a expedição usar outra — o problema que cotar pelo ERP
    // veio resolver. A preferencial vem primeiro mesmo sendo mais lenta.
    const r = normalizar([
      { preco: 90, prazo: 9, nome_forma_envio: 'Jadlog (preferencial)' },
      { preco: 10, prazo: 2, nome_forma_envio: 'alternativa mais rapida' },
    ]);

    expect(r.map((o) => o.nome)).toEqual(['Jadlog (preferencial)', 'alternativa mais rapida']);
  });

  it('aceita a resposta embrulhada em `cotacoes` sem quebrar', () => {
    expect(normalizar({ cotacoes: [{ preco: 10, prazo: 2, nome_forma_envio: 'A' }] })).toHaveLength(
      1,
    );
  });

  it('resposta inesperada vira lista vazia, não exceção', () => {
    expect(normalizar(null)).toEqual([]);
    expect(normalizar({ mensagem: 'erro' })).toEqual([]);
  });
});

describe('cotarFreteErp', () => {
  it('manda o token no header `Token` e o CEP só com dígitos', async () => {
    const spy = respondeCom([{ preco: 50, prazo: 3, nome_forma_envio: 'Jadlog' }]);

    await cotarFreteErp('01310-100', [{ model: 'MB-01', quantidade: 1 }]);

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/parceiro/53309/cotar');
    expect((init.headers as Record<string, string>).Token).toBe('token-da-conta');
    expect(JSON.parse(String(init.body))).toMatchObject({ cep_destino: '01310100' });
  });

  it('pede cotação AGRUPADA e com dias de preparação', async () => {
    // Agrupada: é uma entrega só — somar caixas mostraria frete que ninguém
    // cobra. Preparação: a operação é sob encomenda, e o prazo da
    // transportadora sozinho seria promessa curta.
    const spy = respondeCom([{ preco: 50, prazo: 3, nome_forma_envio: 'Jadlog' }]);

    await cotarFreteErp('01310100', [{ model: 'MB-01', quantidade: 1 }]);

    expect(JSON.parse(String((spy.mock.calls[0][1] as RequestInit).body)).opcoes).toEqual({
      cotar_agrupado: true,
      considerar_dias_preparacao: true,
    });
  });

  it('sem CEP de origem configurado, NÃO manda o campo (o ERP usa o da empresa)', async () => {
    const spy = respondeCom([]);

    await cotarFreteErp('01310100', [{ model: 'MB-01', quantidade: 1 }]);

    expect('cep_origem' in JSON.parse(String((spy.mock.calls[0][1] as RequestInit).body))).toBe(
      false,
    );
  });

  it('sem credencial devolve `sem_credencial` e NÃO chama ninguém', async () => {
    vi.stubEnv('ERP_API_TOKEN', '');
    const spy = vi.spyOn(globalThis, 'fetch');

    expect(await cotarFreteErp('01310100', [{ model: 'MB-01', quantidade: 1 }])).toMatchObject({
      ok: false,
      motivo: 'sem_credencial',
      opcoes: [],
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it('carrinho só com item a dimensionar não vira chamada', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');

    expect(await cotarFreteErp('01310100', [{ model: 'nao-sei', quantidade: 1 }])).toMatchObject({
      ok: false,
      motivo: 'dados_invalidos',
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it('ERP fora do ar devolve `indisponivel` — o checkout segue sem prazo', async () => {
    respondeCom({ erro: 'oops' }, 500);

    expect(await cotarFreteErp('01310100', [{ model: 'MB-01', quantidade: 1 }])).toMatchObject({
      ok: false,
      motivo: 'indisponivel',
    });
  });

  it('timeout/rede não estoura exceção pra cima', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ETIMEDOUT'));

    expect(await cotarFreteErp('01310100', [{ model: 'MB-01', quantidade: 1 }])).toMatchObject({
      ok: false,
      motivo: 'indisponivel',
    });
  });
});

// =============================================================================
// O ERP responde 200 com TEXTO PURO quando o token não presta ("token
// invalido"). Medido contra o endpoint real em 30/08. Isso quebra a leitura
// ingênua (`r.ok` → `.json()`): a exceção viraria "indisponível", que é
// mentira — o ERP está de pé, quem está errado é a configuração. E como o
// checkout degrada sozinho, ninguém descobriria até o prazo sumir da tela.
// =============================================================================
describe('resposta 200 que na verdade é erro', () => {
  function textoPuro(corpo: string, status = 200) {
    return vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(corpo, { status, headers: { 'Content-Type': 'text/plain' } }));
  }

  it('"token invalido" com 200 vira credencial_invalida, NÃO indisponivel', async () => {
    textoPuro('token invalido');

    expect(await cotarFreteErp('01310100', [{ model: 'MB-01', quantidade: 1 }])).toMatchObject({
      ok: false,
      motivo: 'credencial_invalida',
      opcoes: [],
    });
  });

  it('texto que não fala de token continua sendo indisponivel', async () => {
    textoPuro('<html>502 Bad Gateway</html>');

    expect(await cotarFreteErp('01310100', [{ model: 'MB-01', quantidade: 1 }])).toMatchObject({
      motivo: 'indisponivel',
    });
  });

  it('cotação vazia é sucesso, não falha (CEP sem cobertura é resposta válida)', async () => {
    respondeCom([]);

    expect(await cotarFreteErp('01310100', [{ model: 'MB-01', quantidade: 1 }])).toMatchObject({
      ok: true,
      opcoes: [],
    });
  });
});

describe('diagnóstico da falha', () => {
  it('timeout diz que foi timeout, não vira "indisponivel" mudo', async () => {
    const e = new Error('The operation was aborted due to timeout');
    e.name = 'TimeoutError';
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(e);

    const r = await cotarFreteErp('01310100', [{ model: 'MB-01', quantidade: 1 }]);

    expect(r.detalhe).toContain('TimeoutError');
  });

  it('não-2xx carrega status e corpo (URL errada dá 404, e isso precisa aparecer)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"status":404}', { status: 404 }),
    );

    const r = await cotarFreteErp('01310100', [{ model: 'MB-01', quantidade: 1 }]);

    expect(r.detalhe).toContain('404');
  });

  it('sem credencial diz QUAL env falta', async () => {
    vi.stubEnv('ERP_API_TOKEN', '');

    const r = await cotarFreteErp('01310100', [{ model: 'MB-01', quantidade: 1 }]);

    expect(r.detalhe).toContain('ERP_API_TOKEN');
  });

  it('cotação vazia mostra a resposta crua — é o caso mais difícil de diagnosticar', async () => {
    respondeCom([]);

    const r = await cotarFreteErp('01310100', [{ model: 'MB-01', quantidade: 1 }]);

    expect(r.ok).toBe(true);
    expect(r.detalhe).toContain('sem opções');
  });
});

// =============================================================================
// PRODUTO NÃO VINCULADO À INTEGRAÇÃO.
//
// O `/cotar` não procura no catálogo geral do ERP: procura no cadastro de
// produtos da integração. Enquanto os MB-01..MB-12 não estiverem vinculados
// lá, toda cotação volta `400 {"error":"Item 'MB-01' não encontrado."}`.
//
// O ERP está DE PÉ nesse cenário. Chamar isso de "indisponível" esconde um
// erro de cadastro atrás de uma falha de infraestrutura — e como o checkout
// degrada sozinho pro "prazo confirmado no pedido", ninguém descobre até
// alguém reparar que o prazo sumiu da tela.
// =============================================================================

describe('SKU que o ERP não conhece', () => {
  it('vira produto_nao_vinculado, NÃO indisponivel', async () => {
    respondeCom({ error: "Item 'MB-01' não encontrado." }, 400);
    const r = await cotarFreteErp('01310100', [{ model: 'MB-01', quantidade: 1 }]);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.motivo).toBe('produto_nao_vinculado');
  });

  it.each([
    ['acento normal', "Item 'MB-07' não encontrado."],
    ['sem acento', "Item 'MB-07' nao encontrado."],
    // Acontece quando o ERP declara latin1 e manda utf-8. Continua sendo JSON
    // válido, então chega inteiro até aqui e passaria batido num matcher que
    // procurasse o "ã" — voltando a se passar por queda do ERP.
    ['mojibake latin1', "Item 'MB-07' nÃ£o encontrado."],
  ])('reconhece o erro com o texto em %s', async (_nome, msg) => {
    respondeCom({ error: msg }, 400);
    const r = await cotarFreteErp('01310100', [{ model: 'MB-07', quantidade: 1 }]);
    if (r.ok) throw new Error('esperava falha');
    expect(r.motivo).toBe('produto_nao_vinculado');
  });

  it('aguenta a mensagem sem acento', async () => {
    respondeCom({ error: "Item 'MB-07' nao encontrado." }, 400);
    const r = await cotarFreteErp('01310100', [{ model: 'MB-07', quantidade: 1 }]);
    if (r.ok) throw new Error('esperava falha');
    expect(r.motivo).toBe('produto_nao_vinculado');
  });

  it('o checkout continua degradando — lista vazia, sem exceção', async () => {
    respondeCom({ error: "Item 'MB-01' não encontrado." }, 400);
    const r = await cotarFreteErp('01310100', [{ model: 'MB-01', quantidade: 1 }]);
    expect(r.opcoes).toEqual([]);
  });

  it('carrega o corpo do ERP no detalhe — é o que diz QUAL sku falhou', async () => {
    respondeCom({ error: "Item 'MB-09' não encontrado." }, 400);
    const r = await cotarFreteErp('01310100', [{ model: 'MB-09', quantidade: 1 }]);
    if (r.ok) throw new Error('esperava falha');
    expect(r.detalhe).toContain('MB-09');
    expect(r.detalhe).toContain('400');
  });

  it('outro 400 do ERP continua sendo indisponivel', async () => {
    // Só "não encontrado" de ITEM é cadastro. O resto é o ERP recusando.
    respondeCom({ error: "Parameter 'itens' not found" }, 400);
    const r = await cotarFreteErp('01310100', [{ model: 'MB-01', quantidade: 1 }]);
    if (r.ok) throw new Error('esperava falha');
    expect(r.motivo).toBe('indisponivel');
  });

  it('404 de URL errada NÃO é confundido com produto não vinculado', async () => {
    // A rota errada devolve 404; nada a ver com cadastro de produto.
    respondeCom({ error: 'Not Found' }, 404);
    const r = await cotarFreteErp('01310100', [{ model: 'MB-01', quantidade: 1 }]);
    if (r.ok) throw new Error('esperava falha');
    expect(r.motivo).toBe('indisponivel');
  });
});

// Conferido contra a resposta REAL do ERP em 30/08:
//   nome_forma_envio = "Jadlog via Melhor Envio"  (transportadora)
//   nome_forma_frete = ".Package"                 (serviço)
// A suposição inicial era o contrário, e a tela dizia "entrega em 5 dias
// úteis — .Package" — que não diz nada pra quem está comprando.
describe('nome da transportadora na tela', () => {
  it('mostra quem ENTREGA, sem o agregador de frete no meio', () => {
    const [o] = normalizar([
      {
        preco: 40.75,
        prazo: 6,
        nome_forma_envio: 'Jadlog via Melhor Envio',
        nome_forma_frete: '.Package',
      },
    ]);

    expect(o.transportadora).toBe('Jadlog');
    expect(o.nome).toBe('.Package');
  });

  it('transportadora sem "via Melhor Envio" passa intacta', () => {
    expect(normalizar([{ preco: 1, nome_forma_envio: 'Correios' }])[0].transportadora).toBe(
      'Correios',
    );
  });
});
