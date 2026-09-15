import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SKU_TESTE } from '@/lib/pedidos/precificar';

// =============================================================================
// A EXCEÇÃO DE CAPTCHA DO PEDIDO DE TESTE — 15/09/2026.
//
// Contexto, porque sem ele esta guarda parece zelo excessivo:
//
// O Turnstile entrou em `/api/pedidos` em 14/09 (`907ebd2`, item A2 da
// auditoria) e fechou junto a porta do PEDIDO DE TESTE da operação, que é
// disparado por script e não tem navegador pra resolver captcha. O sintoma foi
// mudo: o último pedido de teste entrou em 13/09, ninguém tentou de novo até
// 15/09, e a receita documentada no CLAUDE.md global simplesmente parou de
// funcionar sem nada acusar.
//
// A exceção devolve essa porta — e o que a torna segura NÃO é o segredo
// sozinho, é o par:
//
//   1. `x-pedido-teste` == PEDIDOS_STATUS_SECRET (tempo constante)
//   2. TODO item do corpo é o SKU `TESTE-NF`
//
// Só a (1) seria um caminho sem captcha pra pedido de QUALQUER valor — que é
// precisamente o que o A2 existe pra impedir (pool de IPs gerando cobrança e
// e-mail da marca em série). Com a (2), mesmo de posse do segredo o caminho só
// produz pedido de R$ 10 do SKU fictício.
//
// Por isso a guarda mira na CONJUNÇÃO. Trocar `&&` por `||`, ou afrouxar o
// `every` para `some`, reabre exatamente o buraco que o A2 fechou — e as duas
// coisas continuariam compilando, passando no lint e deixando o pedido de
// teste funcionando. Ninguém perceberia pelo caminho feliz.
// =============================================================================

const FONTE = readFileSync(resolve(process.cwd(), 'src/app/api/pedidos/route.ts'), 'utf-8');

/** Sem comentários: a explicação na própria rota descreve o que estas guardas
 *  proíbem, e medir com ela junto faria a guarda acusar a documentação. */
const CODIGO = FONTE.replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n')
  .filter((l) => !l.trim().startsWith('//'))
  .join('\n');

describe('dispensa de captcha exige as DUAS condições', () => {
  it('🔴 é conjunção, nunca alternativa', () => {
    expect(
      CODIGO,
      'trocar && por || libera pedido de QUALQUER valor sem captcha',
    ).toMatch(/const dispensaCaptcha\s*=\s*pedidoDeTeste\s*&&\s*soSkuDeTeste\s*;/);
    expect(CODIGO).not.toMatch(/dispensaCaptcha\s*=\s*[^;]*\|\|/);
  });

  it('🔴 TODO item tem de ser o SKU de teste — `some` deixaria passar corpo misto', () => {
    // Um corpo com TESTE-NF + um MB real passaria com `some`, e aí o caminho
    // sem captcha criaria pedido de R$ 4.350.
    expect(CODIGO).toMatch(/soSkuDeTeste\s*=[\s\S]{0,200}itens\.every\(/);
    expect(CODIGO, 'never `some` aqui').not.toMatch(/soSkuDeTeste\s*=[\s\S]{0,200}itens\.some\(/);
  });

  it('lista vazia não conta como pedido de teste', () => {
    // `[].every(...)` é `true` em JS. Sem o teste de comprimento, um corpo SEM
    // itens satisfaria a 2ª condição e dispensaria o captcha.
    expect(CODIGO).toMatch(/soSkuDeTeste\s*=\s*\n?\s*parsed\.data\.itens\.length\s*>\s*0\s*&&/);
  });

  it('o segredo é comparado em tempo constante, não com ===', () => {
    expect(CODIGO).toMatch(/constantTimeEquals\(\s*req\.headers\.get\('x-pedido-teste'\)/);
    expect(CODIGO).not.toMatch(/x-pedido-teste'\)\s*(\?\?\s*''\s*)?===/);
  });

  it('segredo ausente no ambiente não vira porta aberta', () => {
    // `segredoOperacao.length > 0` antes da comparação: sem a variável, o
    // cabeçalho vazio bateria com o segredo vazio.
    expect(CODIGO).toMatch(/segredoOperacao\.length\s*>\s*0\s*&&/);
  });
});

describe('o caminho normal continua exigindo captcha', () => {
  it('quem não dispensa passa por verifyTurnstile', () => {
    expect(CODIGO).toMatch(/dispensaCaptcha[\s\S]{0,160}await verifyTurnstile\(/);
  });

  it('token inválido sem falha de infra continua bloqueando com 400', () => {
    expect(CODIGO).toMatch(/if \(!ts\.ok && !ts\.infraFailure\)[\s\S]{0,260}status: 400/);
  });

  it('a dispensa deixa rastro no log', () => {
    // Caminho que pula proteção sem registrar é o que vira descoberta cara
    // seis meses depois.
    expect(CODIGO).toMatch(/if \(dispensaCaptcha\)[\s\S]{0,160}log\.warn\(/);
  });

  it('o log da dispensa não leva e-mail junto (B6)', () => {
    const trecho = CODIGO.match(/if \(dispensaCaptcha\)[\s\S]{0,300}?\}/)?.[0] ?? '';
    expect(trecho).not.toMatch(/email/i);
  });
});

describe('o SKU da exceção é o mesmo da precificação', () => {
  it('a rota usa a constante, não uma string repetida', () => {
    // Repetir 'TESTE-NF' aqui criaria duas fontes: renomear o SKU na
    // precificação deixaria a exceção apontando pro nome velho.
    expect(CODIGO).toContain('=== SKU_TESTE');
    expect(CODIGO).not.toMatch(/===\s*'TESTE-NF'/);
    expect(SKU_TESTE).toBe('TESTE-NF');
  });
});
