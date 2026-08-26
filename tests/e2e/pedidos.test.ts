import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { config } from 'dotenv';

// =============================================================================
// PEDIDOS — número único e consulta pelo número.
//
// Bate no Supabase de VERDADE, por isso mora aqui e não no `npm test`: as
// funções são SECURITY DEFINER e o comportamento que interessa (RLS negando
// leitura direta, unicidade garantida pelo UNIQUE, a consulta escondendo dado
// pessoal) só existe no banco. Testar com mock provaria que o mock funciona.
//
// Os pedidos criados aqui ficam marcados com `origem: 'teste-automatizado'` e
// são removidos no fim.
// =============================================================================

config({ path: '.env.local', quiet: true });

const temAmbiente = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Import dinâmico: `server-only` só resolve pelo alias da config, e o módulo
// lê env na chamada — o dotenv acima tem de rodar antes.
async function lib() {
  return import('@/lib/pedidos/servidor');
}

const criados: string[] = [];

async function novoPedido(extra: Record<string, unknown> = {}) {
  const { criarPedido } = await lib();
  const r = await criarPedido({
    nome: 'Cliente Teste',
    email: 'cliente.teste@exemplo.test',
    whatsapp: '11999999999',
    itens: [{ descricao: 'Quadro de entrada', modelo: 'MB-03', quantidade: 1, precoCentavos: 189000 }],
    totalCentavos: 189000,
    freteCentavos: 0,
    formaPagamento: 'pix',
    endereco: { rua: 'Rua Secreta', numero: '42', cidade: 'Campinas', uf: 'SP', cep: '13010-000' },
    setor: 'residencial',
    origem: 'teste-automatizado',
    ...extra,
  });
  if (r.ok) criados.push(r.numero);
  return r;
}

describe.runIf(temAmbiente)('pedidos — número', () => {
  it('cria e devolve um número no formato combinado', async () => {
    const r = await novoPedido();
    expect(r.ok, JSON.stringify(r)).toBe(true);
    if (!r.ok) return;
    expect(r.numero).toMatch(/^SB\d{4}[23456789ABCDEFGHJKMNPQRSTVWXYZ]{6}$/);
    // sem hifen, sem espaco, sem nada que nao seja letra ou numero
    expect(r.numero).not.toMatch(/[^A-Z0-9]/);
  });

  it('nunca repete — 30 pedidos seguidos, 30 números distintos', async () => {
    const numeros = new Set<string>();
    for (let i = 0; i < 30; i++) {
      // E-mail diferente a cada pedido: o freio do banco é de 10 por e-mail
      // por hora, e aqui o que se testa é a unicidade do número, não ele.
      const r = await novoPedido({ email: `lote${i}@exemplo.test` });
      expect(r.ok, JSON.stringify(r)).toBe(true);
      if (r.ok) numeros.add(r.numero);
    }
    expect(numeros.size).toBe(30);
  }, 60_000);

  it('o número não carrega caractere que o cliente confunde', async () => {
    // I, L, O, U, 0 e 1 ficam de fora: são os que erram ao ditar no telefone
    for (const n of criados) {
      expect(n.slice(6), n).not.toMatch(/[ILOU01]/);
    }
  });

  it('🔒 freia 10 pedidos por e-mail por hora', async () => {
    // O limitador do site depende do Redis, e o Redis de produção está fora
    // do ar — quando ele cai, o limitador LIBERA. Este freio é do banco e não
    // depende de infra nenhuma.
    const email = `freio-${Date.now()}@exemplo.test`;
    let bloqueado = false;
    for (let i = 0; i < 12; i++) {
      const r = await novoPedido({ email });
      if (!r.ok) {
        bloqueado = true;
        expect(r.erro).toMatch(/muitos pedidos/i);
        // e tem de ser reconhecível como limite, não como erro de servidor
        expect((r as { excedeuLimite?: boolean }).excedeuLimite).toBe(true);
        break;
      }
    }
    expect(bloqueado, 'o 11º pedido do mesmo e-mail deveria ter sido barrado').toBe(true);
  }, 60_000);

  it('cliente diferente não é afetado pelo freio do vizinho', async () => {
    const r = await novoPedido({ email: `sozinho-${Date.now()}@exemplo.test` });
    expect(r.ok).toBe(true);
  });

  it('nome ou e-mail em branco é recusado', async () => {
    const { criarPedido } = await lib();
    const semNome = await criarPedido({
      nome: '  ', email: 'x@y.test', itens: [], totalCentavos: 0, freteCentavos: 0,
    });
    expect(semNome.ok).toBe(false);
  });
});

describe.runIf(temAmbiente)('pedidos — consulta', () => {
  it('acha pelo número exato', async () => {
    const { consultarPedido } = await lib();
    const p = await consultarPedido(criados[0]);
    expect(p?.numero).toBe(criados[0]);
    expect(p?.status).toBe('recebido');
    expect(p?.itens.length).toBe(1);
  });

  it('tolera o que o cliente digita de verdade', async () => {
    const { consultarPedido } = await lib();
    const alvo = criados[0];
    // inclusive com hifen: alguem vai digitar assim de qualquer jeito
    const comHifen = `${alvo.slice(0, 2)}-${alvo.slice(2, 6)}-${alvo.slice(6)}`;
    for (const variante of [alvo.toLowerCase(), comHifen, `  ${alvo}  `, alvo.split('').join(' ')]) {
      const p = await consultarPedido(variante);
      expect(p?.numero, `variante "${variante}"`).toBe(alvo);
    }
  });

  it('🔒 NÃO devolve e-mail, WhatsApp nem endereço completo', async () => {
    // O número é a credencial. Se vazar, o estrago tem de ser saber que
    // alguém comprou — não o cadastro da pessoa.
    const { consultarPedido } = await lib();
    const bruto = JSON.stringify(await consultarPedido(criados[0]));
    expect(bruto).not.toMatch(/exemplo\.test/); // e-mail
    expect(bruto).not.toMatch(/11999999999/); // whatsapp
    expect(bruto).not.toMatch(/Rua Secreta/); // logradouro
    expect(bruto).not.toMatch(/13010/); // CEP
    // o que PODE aparecer: cidade e UF, pra pessoa reconhecer o pedido
    expect(bruto).toMatch(/Campinas/);
  });

  it('número inexistente ou lixo devolve vazio — e do MESMO jeito', async () => {
    // Responder diferente pra "não existe" e "formato inválido" entregaria
    // quais números valem a pena tentar.
    const { consultarPedido } = await lib();
    for (const v of ['SB2608ZZZZZZ', 'qualquer coisa', '', 'SB2608IIIIII', "' or 1=1--"]) {
      expect(await consultarPedido(v), `entrada: "${v}"`).toBeUndefined();
    }
  });
});

describe.runIf(temAmbiente)('pedidos — status e rastreio', () => {
  it('move o status e grava o rastreio', async () => {
    const { atualizarStatus, consultarPedido } = await lib();
    const alvo = criados[0];
    const r = await atualizarStatus({
      numero: alvo, status: 'enviado', nota: 'Postado na agência.',
      transportadora: 'Correios', rastreioCodigo: 'AA123456789BR',
      rastreioUrl: 'https://rastreamento.correios.com.br/app/index.php',
    });
    expect(r.ok, JSON.stringify(r)).toBe(true);

    const p = await consultarPedido(alvo);
    expect(p?.status).toBe('enviado');
    expect(p?.rastreioCodigo).toBe('AA123456789BR');
    expect(p?.transportadora).toBe('Correios');
  });

  it('o histórico EMPILHA em vez de sobrescrever', async () => {
    const { consultarPedido } = await lib();
    const p = await consultarPedido(criados[0]);
    expect(p!.historico.length).toBeGreaterThanOrEqual(2);
    expect(p!.historico[0].status).toBe('recebido');
    expect(p!.historico[p!.historico.length - 1].status).toBe('enviado');
  });

  it('status repetido não duplica linha no histórico', async () => {
    const { atualizarStatus, consultarPedido } = await lib();
    const antes = (await consultarPedido(criados[0]))!.historico.length;
    await atualizarStatus({ numero: criados[0], status: 'enviado' });
    expect((await consultarPedido(criados[0]))!.historico.length).toBe(antes);
  });

  it('🔒 segredo errado NÃO move o pedido', async () => {
    const { atualizarStatus, consultarPedido } = await lib();
    const bom = process.env.PEDIDOS_STATUS_SECRET;
    process.env.PEDIDOS_STATUS_SECRET = 'chute-errado';
    const r = await atualizarStatus({ numero: criados[0], status: 'entregue' });
    process.env.PEDIDOS_STATUS_SECRET = bom;

    expect(r.ok).toBe(false);
    // e o pedido continua onde estava
    expect((await consultarPedido(criados[0]))!.status).toBe('enviado');
  });

  it('status fora da lista é recusado', async () => {
    const { atualizarStatus } = await lib();
    const r = await atualizarStatus({ numero: criados[0], status: 'inventado' as never });
    expect(r.ok).toBe(false);
  });

  it('pedido inexistente é recusado', async () => {
    const { atualizarStatus } = await lib();
    const r = await atualizarStatus({ numero: 'SB2608ZZZZZZ', status: 'enviado' });
    expect(r.ok).toBe(false);
  });
});

afterAll(async () => {
  if (!temAmbiente || criados.length === 0) return;

  // Limpeza: pedido de teste NÃO pode ficar no banco de produção.
  //
  // Sem barulho aqui, uma falha de limpeza é invisível — e o que sobra é
  // pedido fantasma acumulando na mesma tabela dos pedidos reais. Já
  // aconteceu: uma rodada que quebrou no meio deixou 30 linhas pra trás e só
  // apareceram numa conferência manual.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  try {
    const r = await fetch(`${url}/rest/v1/rpc/limpar_pedidos_de_teste`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_origem: 'teste-automatizado' }),
    });
    const apagados = await r.text();
    if (!r.ok) {
      console.error(`[pedidos] LIMPEZA FALHOU (HTTP ${r.status}): ${apagados}`);
      console.error(`[pedidos] ${criados.length} pedidos de teste podem ter ficado no banco.`);
      return;
    }
    console.info(`[pedidos] limpeza: ${apagados} pedido(s) de teste removido(s)`);
  } catch (e) {
    console.error('[pedidos] LIMPEZA FALHOU:', e);
    console.error(`[pedidos] ${criados.length} pedidos de teste podem ter ficado no banco.`);
  }
});

beforeAll(() => {
  if (!temAmbiente) {
    console.warn('[pedidos] sem .env.local com Supabase — testes pulados');
  }
});
