import 'server-only';

import { CONTACT, EMPRESA, SITE } from '@/lib/constants/site';

// =============================================================================
// ESQUELETO ÚNICO dos e-mails do site.
//
// Existe pra que os e-mails do site sejam a MESMA marca dos outros dez que a
// Somatec já manda (os 8 transacionais do app e a régua E6). Antes desta
// camada, cada e-mail do site trazia seu próprio cabeçalho, seu próprio botão e
// seu próprio rodapé — e o resultado era o cliente recebendo duas caras
// diferentes da mesma empresa na mesma compra.
//
// Padrão canônico em:
//   leo-Skills-master/clients/somatec/reports/email/layout-transacional/
//   (template-fluxo.CANONICO.html + README.md)
//
// AS QUATRO DECISÕES ABAIXO NÃO SÃO ESTÉTICA. Cada uma corrige um jeito
// conhecido de o e-mail chegar quebrado:
//
// 1. TEXTURA E LOGO ASSADOS NA IMAGEM, nunca em CSS. Outlook não renderiza
//    gradiente CSS. E `background-color` navy atrás da imagem: quem bloqueia
//    imagem vê a barra navy sólida, não uma faixa branca vazia.
//
// 2. SEM WEBFONT. Cliente de e-mail não baixa fonte. A pilha é a que existe
//    instalada nas três plataformas.
//
// 3. BOTÃO EM CÉLULA DE TABELA, nunca `<a>` solto. Outlook ignora `padding` em
//    link inline — o botão colapsa e vira texto sublinhado.
//
// 4. COR DO BOTÃO NO ATRIBUTO `bgcolor`, além do CSS. Sanitizador de cliente
//    corta CSS; com o rótulo BRANCO, o botão sumia no branco SEM DEIXAR RASTRO
//    (foi o que aconteceu em 07/09). Atributo sobrevive. E `background-color`
//    em vez do atalho `background`, que é o primeiro a cair.
// =============================================================================

export const CORES = {
  navy: '#00416E',
  acao: '#F39200',
  texto: '#333d47',
  suave: '#5A6B7C',
  fundo: '#e9eef3',
  rodapeTexto: '#93a4b5',
} as const;

export const FONTE = "'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** Barra do topo com o logo já assado na imagem. Servida pelo próprio site
 *  (`public/email/`), que é domínio nosso e com HTTPS — imagem em domínio de
 *  terceiro é sinal de spam. */
const BARRA = `${SITE.url}/email/bar-navy.png`;

/**
 * O botão. Sempre por aqui — a tabela e o `bgcolor` são o motivo de ele
 * aparecer em Outlook e sobreviver a sanitizador.
 */
export function botao(href: string, texto: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td bgcolor="${CORES.acao}" style="background-color:${CORES.acao};">
        <a href="${href}" style="display:inline-block;padding:15px 30px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;font-family:${FONTE};letter-spacing:.2px;">${texto}</a>
      </td></tr></table>`;
}

/**
 * Monta o e-mail inteiro em volta do conteúdo.
 *
 * `motivo` fecha o rodapé dizendo por que aquela pessoa recebeu — é o que
 * diferencia e-mail esperado de e-mail que vira denúncia de spam, e muda de um
 * e-mail para o outro.
 */
export function layoutEmail(args: {
  titulo: string;
  /** O que aparece na prévia da caixa, ao lado do assunto. Nunca vazio: sem
   *  ele, a lista de e-mails mostra o começo do HTML. */
  preheader: string;
  /** As `<tr>` do miolo. */
  corpo: string;
  motivo: string;
}): string {
  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${args.titulo}</title></head>
<body style="margin:0;padding:0;background:${CORES.fundo};font-family:${FONTE};">

<div style="display:none;font-size:1px;max-height:0;opacity:0;overflow:hidden;">${args.preheader}</div>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${CORES.fundo};"><tr>
<td align="center" style="padding:32px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;">

  <tr><td style="padding:0;line-height:0;background-color:${CORES.navy};">
    <img src="${BARRA}" width="600" alt="Somatec Blocking" style="display:block;border:0;width:100%;max-width:600px;height:auto;"></td></tr>

${args.corpo}

  <tr><td style="background:${CORES.navy};padding:26px 44px;">
    <p style="margin:0 0 8px 0;font-size:11px;color:#ffffff;font-weight:700;letter-spacing:1.4px;">SOMATEC BLOCKING</p>
    <p style="margin:0;font-size:11px;line-height:1.7;color:${CORES.rodapeTexto};">${EMPRESA.linha} &middot; ${CONTACT.email}<br>${CONTACT.address}<br>${args.motivo}</p>
  </td></tr>

</table></td></tr></table></body></html>`;
}
