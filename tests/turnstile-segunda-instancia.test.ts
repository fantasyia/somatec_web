import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// =============================================================================
// TURNSTILE COM MAIS DE UM WIDGET NA PÁGINA.
//
// O `onLoad` do <Script> só dispara pra QUEM carrega o script. Quando uma
// segunda instância monta depois — o checkout tem uma no passo de contato e
// outra no de pagamento — o script já está na página, o evento não vem, e o
// widget nunca renderiza. O token nunca nasce.
//
// O envio então sai com `captcha_token: ""` e o servidor devolve 400. Foi
// exatamente o que aconteceu em produção em 02/09: o pedido era criado (201) e
// o LEAD do pedido era rejeitado — pedido no banco, ninguém avisado no CRM.
//
// Era bug latente: antes só um widget montava por sessão. Passou a doer quando
// o segundo apareceu.
// =============================================================================

const FONTE = readFileSync(
  resolve(process.cwd(), 'src/components/forms/fields/TurnstileWidget.tsx'),
  'utf-8',
);

/** Sem comentários. A explicação escrita no componente cita justamente
 *  `onLoad` e `scriptLoaded` — que é o que estas guardas proíbem. Medir com o
 *  comentário junto faria a guarda acusar a própria explicação do conserto.
 *
 *  Bloco primeiro, linha depois: tirar as linhas antes quebra o fechamento do
 *  bloco, e a limpeza seguinte engole código de verdade. */
const CODIGO = FONTE.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n')
  .filter((l) => !l.trim().startsWith('//'))
  .join('\n');

describe('o widget não depende só do onLoad', () => {
  it('checa o turnstile direto, em vez de esperar um evento que não vem', () => {
    expect(CODIGO).toMatch(/window\.turnstile/);
  });

  it('continua esperando quando o script ainda não chegou', () => {
    // A primeira instância monta ANTES do script existir — se só checasse uma
    // vez, ela é que ficaria sem widget.
    expect(CODIGO).toMatch(/setInterval\(/);
  });

  it('desiste depois de um tempo — nada de intervalo eterno', () => {
    // Numa página onde o script foi bloqueado (adblock, rede corporativa), o
    // intervalo rodaria pra sempre.
    expect(CODIGO).toMatch(/clearInterval\(/);
    expect(CODIGO).toMatch(/setTimeout\(/);
  });

  it('NÃO volta a depender do onLoad — era ele a causa', () => {
    expect(CODIGO).not.toMatch(/onLoad=/);
  });

  it('não guarda "script chegou" em estado — setState em efeito é render em cascata', () => {
    expect(CODIGO).not.toMatch(/scriptLoaded/);
  });

  it('limpa o widget ao desmontar — senão o passo seguinte herda lixo', () => {
    expect(CODIGO).toMatch(/turnstile\.remove\(/);
  });

  it('a varredura está lendo o arquivo certo (âncora anti-falso-verde)', () => {
    expect(CODIGO).toContain('challenges.cloudflare.com');
    expect(CODIGO).toContain("size: 'invisible'");
  });
});
