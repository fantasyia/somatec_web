import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// =============================================================================
// O QUARTO CAMPO DO PASSO DE CONTATO.
//
// Ele pedia "Empresa" no comercial e "Cidade" no residencial — mas mandava o
// valor no mesmo `company` nos dois casos. Resultado: a cidade do cliente
// residencial chegava ao CRM como se fosse o nome da empresa dele, e o campo
// `cidade` (que existe no contrato) ficava vazio.
//
// Decisão do Léo (31/08): TIRAR o campo no residencial, não remapear. Quem
// chega ao checkout informa o CEP no passo seguinte, e dali sai cidade, bairro
// e UF — mais preciso do que a pessoa digitando. Um campo a mais no passo de
// maior atrito não se paga por um dado que já vem melhor logo adiante.
// =============================================================================

const FONTE = readFileSync(
  resolve(process.cwd(), 'src/components/tools/CheckoutNI.tsx'),
  'utf-8',
);

/** Sem comentários: a explicação escrita no código cita justamente "Cidade
 *  (opcional)", e faria a guarda acusar o próprio comentário.
 *
 *  ORDEM IMPORTA, e eu já errei aqui: tirando primeiro as LINHAS iniciadas
 *  por asterisco, o bloco de comentário JSX perde o fechamento — e a limpeza
 *  de blocos seguinte casa até o PRÓXIMO fecha-bloco, engolindo o código do
 *  meio. Foi assim que a guarda deixou de achar a condicional que ela existe
 *  pra proteger, e passou verde sobre uma string mutilada.
 *  Bloco inteiro primeiro, linha depois. */
const CODIGO = FONTE.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .split('\n')
  .filter((l) => !l.trim().startsWith('//'))
  .join('\n');

describe('o campo de empresa no passo de contato', () => {
  it('NÃO existe mais rótulo de "Cidade" no passo de contato', () => {
    // Era este o rótulo que enganava: pedia cidade e gravava como empresa.
    expect(CODIGO).not.toMatch(/label=\{?\s*['"`]?Cidade \(opcional\)/);
  });

  it('o campo `company` só é renderizado na trilha comercial', () => {
    // A guarda é a condição em volta dele. Sem ela, o campo volta pras duas
    // trilhas e a cidade volta a virar empresa.
    expect(CODIGO).toMatch(/setor === 'comercial' && \(/);
    const i = CODIGO.search(/setor === 'comercial' && \(/);
    const bloco = CODIGO.slice(i, i + 420);
    expect(bloco).toContain('name="company"');
    expect(bloco).toContain('Empresa (opcional)');
  });

  it('o rótulo de empresa não volta a ser condicional entre dois textos', () => {
    // O defeito original: um ternário no LABEL, com o `name` fixo em company.
    expect(CODIGO).not.toMatch(/label=\{setor === 'comercial' \? 'Empresa/);
  });

  it('a varredura está mesmo lendo o checkout (âncora anti-falso-verde)', () => {
    // Se o arquivo mudar de nome ou o filtro comer o código, as asserções
    // acima passariam sobre uma string vazia.
    expect(CODIGO).toContain('name="whatsapp"');
    expect(CODIGO.length).toBeGreaterThan(5000);
  });
});
