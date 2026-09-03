// =============================================================================
// PDF do projeto de proteção (trilha industrial).
//
// Gera o documento que o cliente leva pro comitê de compra: a árvore da planta
// que ele montou + os pontos sensíveis + os Master Blocks por camada em cascata
// + o custo estimado. É DATA-DRIVEN: lê o que veio do wizard e do config de
// locação, então continua correto quando os valores reais substituírem os
// simulados — nada de número escrito aqui dentro.
//
// jsPDF entra por import() dinâmico (só baixa quando o usuário clica).
// =============================================================================

import { formatBRL } from '@/lib/constants/masterblock';
import type { ProjetoLocacao } from '@/lib/constants/locacao';
import { OFERTA_INDUSTRIAL } from '@/lib/constants/oferta-industrial';

export type DadosProjeto = {
  tensaoSaida: string;
  setores: string[];
  paineis: number;
  /** [rótulo do tipo, quantidade] só dos que têm quantidade > 0. */
  pontos: { label: string; qtd: number }[];
  projeto: ProjetoLocacao;
  /** true = imprime a tarja de valores simulados. */
  simulado: boolean;
  /** Data já formatada (o componente passa; evita depender de locale aqui). */
  emitidoEm: string;
};

const NAVY: [number, number, number] = [0, 65, 110];
const CINZA: [number, number, number] = [90, 100, 110];
const LARANJA: [number, number, number] = [243, 146, 0];

export async function gerarPdfProjeto(d: DadosProjeto): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const L = 18; // margem esquerda
  const W = 210; // largura A4
  let y = 0;

  // ── Cabeçalho ────────────────────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold').setFontSize(16);
  doc.text('Projeto de proteção em cascata', L, 15);
  doc.setFont('helvetica', 'normal').setFontSize(9);
  doc.text('Somatec Blocking · Master Block', L, 22);
  doc.text(d.emitidoEm, W - L, 22, { align: 'right' });
  y = 42;

  // ── Tarja de simulação ───────────────────────────────────────────────
  if (d.simulado) {
    doc.setFillColor(255, 244, 224);
    doc.setDrawColor(...LARANJA);
    doc.roundedRect(L, y - 6, W - L * 2, 14, 2, 2, 'FD');
    doc.setTextColor(...LARANJA);
    doc.setFont('helvetica', 'bold').setFontSize(9);
    doc.text('VALORES DE SIMULAÇÃO — não constitui proposta comercial.', L + 4, y + 1);
    doc.setFont('helvetica', 'normal').setTextColor(...CINZA);
    doc.text('A tabela oficial de locação será confirmada pelo representante.', L + 4, y + 5.5);
    y += 18;
  }

  // ── A planta ─────────────────────────────────────────────────────────
  const titulo = (t: string) => {
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold').setFontSize(12);
    doc.text(t, L, y);
    y += 7;
  };
  const linha = (rotulo: string, valor: string) => {
    doc.setFont('helvetica', 'normal').setFontSize(10);
    doc.setTextColor(...CINZA);
    doc.text(rotulo, L, y);
    doc.setTextColor(30, 41, 51);
    const texto = doc.splitTextToSize(valor, W - L * 2 - 42) as string[];
    doc.text(texto, L + 42, y);
    y += Math.max(6, texto.length * 5);
  };

  titulo('A sua planta');
  linha('Tensão de alimentação:', d.tensaoSaida || '—');
  linha('Setores / galpões:', d.setores.length ? d.setores.join(', ') : '—');
  linha('Painéis de distribuição:', String(d.paineis));
  linha(
    'Pontos sensíveis:',
    d.pontos.length ? d.pontos.map((p) => `${p.qtd} ${p.label.toLowerCase()}`).join(', ') : 'a levantar com a engenharia',
  );
  y += 4;

  // ── Árvore da cascata (desenho simples) ──────────────────────────────
  titulo('Onde a proteção entra');
  const boxW = 58;
  const boxH = 13;
  const xEntrada = L;
  const xPainel = L + 66;
  const xEquip = L + 132;
  const yTree = y;

  const caixa = (x: number, yy: number, txt: string, sub: string, destaque = false) => {
    doc.setDrawColor(...(destaque ? LARANJA : NAVY));
    doc.setFillColor(destaque ? 255 : 246, destaque ? 247 : 249, destaque ? 235 : 252);
    doc.roundedRect(x, yy, boxW, boxH, 2, 2, 'FD');
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold').setFontSize(9);
    doc.text(txt, x + 4, yy + 5.5);
    doc.setFont('helvetica', 'normal').setFontSize(7.5);
    doc.setTextColor(...CINZA);
    doc.text(sub, x + 4, yy + 10);
  };

  const qtdDe = (id: string) => d.projeto.linhas.find((l) => l.camada.id === id)?.quantidade ?? 0;

  caixa(xEntrada, yTree, 'Entrada de energia', `${qtdDe('entrada')}× Master Block`, true);
  caixa(xPainel, yTree, 'Painéis de distribuição', `${qtdDe('painel')}× Master Block`, qtdDe('painel') > 0);
  caixa(xEquip, yTree, 'Equipamentos críticos', `${qtdDe('equipamento')}× Master Block`, qtdDe('equipamento') > 0);

  doc.setDrawColor(...NAVY);
  doc.line(xEntrada + boxW, yTree + boxH / 2, xPainel, yTree + boxH / 2);
  doc.line(xPainel + boxW, yTree + boxH / 2, xEquip, yTree + boxH / 2);
  y = yTree + boxH + 12;

  // ── Tabela de Master Blocks ──────────────────────────────────────────
  titulo('Master Blocks por camada');
  doc.setFillColor(240, 244, 248);
  doc.rect(L, y - 5, W - L * 2, 8, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...CINZA);
  doc.text('Camada', L + 3, y);
  doc.text('Qtd', L + 96, y);
  doc.text('Locação', W - L - 3, y, { align: 'right' });
  y += 8;

  doc.setFont('helvetica', 'normal').setFontSize(9.5);
  for (const l of d.projeto.linhas) {
    doc.setTextColor(30, 41, 51);
    doc.text(l.camada.nome, L + 3, y);
    doc.text(`${l.quantidade}×`, L + 96, y);
    doc.text(`${formatBRL(l.subtotal)}/mês`, W - L - 3, y, { align: 'right' });
    y += 5;
    doc.setTextColor(...CINZA);
    doc.setFontSize(7.5);
    const desc = doc.splitTextToSize(l.camada.descricao, W - L * 2 - 6) as string[];
    doc.text(desc, L + 3, y);
    y += desc.length * 3.6 + 3;
    doc.setFontSize(9.5);
  }

  doc.setDrawColor(220, 226, 232);
  doc.line(L, y, W - L, y);
  y += 7;
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...NAVY);
  doc.text(`${d.projeto.totalMB} Master Blocks · locação estimada`, L, y);
  doc.setTextColor(...LARANJA).setFontSize(14);
  doc.text(`${formatBRL(d.projeto.mensalidadeTotal)}/mês`, W - L, y, { align: 'right' });
  y += 12;

  // ── Modelo comercial + rodapé ────────────────────────────────────────
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...CINZA);
  const nota = doc.splitTextToSize(
    `${OFERTA_INDUSTRIAL.paragrafo} ` +
      'Estimativa gerada a partir dos dados informados. Um representante revisa e confirma o valor final.',
    W - L * 2,
  ) as string[];
  doc.text(nota, L, y);

  doc.setFontSize(7.5);
  doc.text('Somatec Blocking · somatecblocking.com.br', L, 285);
  doc.text('Documento gerado pelo site a partir dos dados informados.', W - L, 285, { align: 'right' });

  doc.save('projeto-protecao-somatec.pdf');
}
