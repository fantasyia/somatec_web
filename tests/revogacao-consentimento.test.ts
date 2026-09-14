import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { COOKIES_DO_SITE, COOKIES_ATUALIZADO_EM } from '@/lib/constants/cookies';

// =============================================================================
// REVOGAÇÃO DE CONSENTIMENTO — o caminho de volta, que não existia.
//
// ⚖️ Achado em 14/09/2026 pela sessão master, conferido aqui no código:
// `gravarConsentimento` e `aplicarConsentimento` sempre existiram, mas só o
// `CookieBanner` os chamava — e o banner só aparece pra quem NUNCA respondeu.
// O comentário do próprio `consent.ts` já admitia: "e ele não reaparece".
// Na prática, a primeira resposta era definitiva.
//
// Enquanto isso `/politica-de-privacidade` prometia por escrito o direito de
// "revogar consentimento", e a LGPD pede que retirar seja tão fácil quanto dar.
// O único caminho era limpar o navegador na mão.
//
// E a mesma página afirmava três coisas que o site desmente — a causa é a de
// sempre: texto escrito uma vez, código andou depois.
// =============================================================================

function fonte(caminho: string): string {
  return readFileSync(resolve(process.cwd(), caminho), 'utf8');
}

/** Fonte SEM comentário. Os comentários deste projeto citam de propósito a
 *  frase errada que estava no ar, pra explicar o defeito — e uma guarda que
 *  procura essa frase no arquivo inteiro reprova justamente a documentação do
 *  conserto. O que interessa aqui é o que a página RENDERIZA. */
function semComentarios(caminho: string): string {
  return fonte(caminho)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split(/\r?\n/)
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n');
}

describe('mecânica da revogação', () => {
  const consent = fonte('src/lib/consent.ts');
  const banner = fonte('src/components/layout/CookieBanner.tsx');
  const botao = fonte('src/components/layout/RevisarConsentimento.tsx');

  it('existe um evento que reabre o banner', () => {
    expect(consent).toContain('EVENTO_REVER_CONSENTIMENTO');
    expect(banner).toContain('EVENTO_REVER_CONSENTIMENTO');
    expect(botao).toContain('pedirParaRever');
  });

  it('abrir NÃO apaga o registro anterior', () => {
    // Quem abre e fecha sem responder continua com a escolha anterior valendo:
    // apagar no clique transformaria "dar uma olhada" em "revogar sem querer".
    expect(consent).toMatch(/export function pedirParaRever\(\)[\s\S]{0,260}dispatchEvent/);
    expect(consent).not.toMatch(/pedirParaRever[\s\S]{0,300}removeItem/);
  });

  it('rebaixar APAGA os cookies do Google e da Meta', () => {
    // O `consent update` para de ALIMENTAR e não apaga o que já foi gravado.
    // Sem isto a pessoa pede pra não ter identificador e ele fica até 2 anos.
    expect(consent).toContain('apagarCookiesDeMedicao');
    expect(banner).toMatch(/if \(value === 'rejected'\) apagarCookiesDeMedicao\(\)/);
  });

  it('a lista de cookies apagados cobre os quatro que o site declara de terceiro', () => {
    const declarados = COOKIES_DO_SITE.filter((c) => c.origem !== 'somatec')
      .flatMap((c) => c.nome.split(',').map((n) => n.trim()));
    // `_ga`, `_ga_*`, `_fbp`, `_fbc`
    for (const nome of declarados) {
      const base = nome.replace('*', '');
      expect(consent, `padrão de exclusão não cobre ${nome}`).toContain(base.replace(/_$/, '_'));
    }
  });

  it('o foco volta pro botão quando o banner fecha', () => {
    expect(banner).toContain('quemAbriuRef');
    expect(banner).toMatch(/quemAbriuRef\.current\?\.focus\(\)/);
  });

  it('confirma em região viva depois de responder', () => {
    expect(botao).toContain('role="status"');
    expect(botao).toContain('Sua escolha foi atualizada');
  });

  it('mostra o estado atual, inclusive quando não há registro', () => {
    expect(botao).toContain('lerConsentimento');
    expect(botao).toContain('Você ainda não respondeu');
    expect(botao).toContain('Apenas essenciais');
    expect(botao).toContain('Aceitar todos');
  });
});

describe('/cookies passou a descrever o site que existe', () => {
  const pagina = semComentarios('src/app/cookies/page.tsx');

  it('não afirma mais que não há rastreamento', () => {
    expect(pagina).not.toContain('exclusivamente cookies técnicos');
    expect(pagina).not.toMatch(/não utilizamos cookies de rastreamento/i);
  });

  it('não cita a preferência de tema, que nunca existiu', () => {
    expect(pagina).not.toMatch(/tema \(claro\/escuro\)/i);
  });

  it('assume GA4 e Pixel por nome', () => {
    expect(pagina).toContain('Google Analytics 4');
    expect(pagina).toContain('Meta Pixel');
  });

  it('a tabela vem da constante, não é prosa repetida', () => {
    expect(pagina).toContain('COOKIES_DO_SITE.map');
    // Se alguém voltar a digitar o inventário, some a fonte única.
    expect(pagina).not.toContain("'stc_attrib'");
  });

  it('a data de atualização vem de constante', () => {
    expect(pagina).toContain('COOKIES_ATUALIZADO_EM');
    expect(COOKIES_ATUALIZADO_EM).not.toMatch(/2025/);
  });

  it('tem o botão de rever a escolha', () => {
    expect(pagina).toContain('RevisarConsentimento');
  });
});

describe('/politica-de-privacidade parou de afirmar o que o site desmente', () => {
  const pol = semComentarios('src/app/politica-de-privacidade/page.tsx');

  it('não diz mais que não há rastreamento comportamental', () => {
    expect(pol).not.toMatch(/nem realizamos rastreamento comportamental/i);
  });

  it('não diz mais que coleta APENAS o que vem dos formulários', () => {
    expect(pol).not.toMatch(/Coletamos apenas os dados fornecidos/i);
    expect(pol).toMatch(/se você autorizar no banner de cookies/i);
  });

  it('mantém a parte verdadeira: não vender nem alugar', () => {
    expect(pol).toMatch(/Não vendemos nem alugamos seus dados pessoais, em nenhuma hipótese/);
  });

  it('assume que Google e Meta recebem dados com o aceite', () => {
    expect(pol).toMatch(/Google e Meta recebem dados/);
    expect(pol).toMatch(/fora do Brasil/);
  });

  it('a promessa de revogar aponta pro caminho que existe', () => {
    // Era promessa sem lastro: a página garantia o direito e não havia como.
    expect(pol).toContain('Rever minha escolha de cookies');
  });
});

// =============================================================================
// ATALHO DO RODAPÉ — decisão da master (14/09).
//
// "Preferências de cookies" e não "Rever minha escolha" porque é o rótulo que
// a pessoa VARRE procurando num rodapé; dentro da página o botão continua em
// primeira pessoa, e a diferença é de propósito.
//
// ⚠️ O link leva à ÂNCORA, não abre o banner. A pessoa chega na seção, vê qual
// é a escolha dela hoje e por que aquilo importa, e só então decide. Também
// mantém UM lugar só onde o consentimento se administra — que é pra onde a
// política de privacidade já aponta.
// =============================================================================

describe('atalho de preferências no rodapé', () => {
  const rodape = fonte('src/components/layout/Footer.tsx');
  const pagina = fonte('src/app/cookies/page.tsx');

  it('existe, com o rótulo que se varre num rodapé', () => {
    expect(rodape).toContain('Preferências de cookies');
    expect(rodape).toContain('/cookies#preferencias');
  });

  it('não abre o banner direto do rodapé', () => {
    expect(rodape).not.toContain('pedirParaRever');
    expect(rodape).not.toContain('EVENTO_REVER_CONSENTIMENTO');
  });

  it('a âncora existe na página e não fica atrás do cabeçalho fixo', () => {
    expect(pagina).toContain('id="preferencias"');
    // Cabeçalho é `fixed` com h-20: sem margem de rolagem o título encosta
    // atrás do menu e a pessoa cai numa seção cujo começo não vê.
    expect(pagina).toMatch(/id="preferencias"[\s\S]{0,80}scroll-mt/);
  });
});
