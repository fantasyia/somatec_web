export const SITE = {
  name: 'Somatec',
  fullName: 'Somatec Blocking',
  // Meta description — campo de BUSCA, segue técnica. O público, porém, não
  // pode ser só "a indústria": o site atende comércio e residência.
  description:
    'Master Block: protetor de surto com filtro passivo até 100 kHz — segura os picos que o DPS comum não cobre. Proteção elétrica para indústria, comércio e residências.',
  // Linha LIDA no rodapé, em toda página — inclusive nas LPs de casa e de
  // comércio. Dizer "para a indústria" ali ensinava o dono de casa que a
  // empresa não é pra ele, logo depois de a página inteira dizer que é.
  tagline:
    'Proteção elétrica e qualidade de energia — para indústria, comércio e residências.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.somatecblocking.com.br',
  locale: 'pt-BR',
  ogImage: '/og-default.jpg',
} as const;

/** Array images padrão pra usar em metadata.openGraph.images quando uma página
 * sobrescreve openGraph completo (Next.js não faz deep-merge). */
export const DEFAULT_OG_IMAGES = [
  { url: SITE.ogImage, width: 1200, height: 630, alt: SITE.fullName },
] as const;

// FONTE ÚNICA dos dados de contato (Léo, 21/08). Antes o telefone, o e-mail e o
// endereço estavam escritos à mão em /contato, no JSON-LD e no rodapé — mudar um
// deles deixava os outros mentindo. Agora tudo sai daqui.
//
// ⛔ NÃO existe atendimento por telefone neste contato (Léo, 21/08) — só
// WhatsApp. Ligação só acontece via representante, e isso é combinado depois,
// não é canal de entrada do site. Por isso não há `tel:` em lugar nenhum.
export const CONTACT = {
  // ⛔ NADA de env var nem de linha no banco pra estes três. O telefone, o
  // e-mail e o endereço da empresa são UM fato só, igual em todo ambiente.
  // Quando eram sobrescrevíveis, produção ficou com valores velhos no Railway e
  // no site_settings e seguiu publicando o número e o e-mail antigos mesmo
  // depois do deploy — o site mentia e ninguém via.
  /** Só dígitos, E.164 sem '+'. É o formato que o wa.me exige. */
  whatsappDigits: '5511917644757',
  /** Como o número aparece na tela. */
  whatsappDisplay: '+55 11 91764-4757',
  email: 'comercial@somatecblocking.com.br',
  // 📍 ENDEREÇO — corrigido em 23/09/2026. Era `145` e CEP `04304-000`, e os
  // dois estavam errados pelo MESMO motivo: quem escreveu leu o COMPLEMENTO do
  // cadastro como se fosse o logradouro. Na Receita (CNPJ 16.774.052/0001-55) o
  // registro é `Logradouro: Avenida Fagundes Filho, 141` e
  // `Complemento: Sala Esc 72 Edif N 145` — o 145 é o número do EDIFÍCIO.
  // Confirmado pelo Léo: nº 141, complemento Conjunto 72.
  //
  // O CEP não precisou de confirmação, tem prova pública: na faixa dos Correios
  // `04304-000` é "até 710 — lado PAR" e `04304-010` é "até 721 — lado ÍMPAR".
  // 141 é ímpar, logo 04304-010. E como 145 também é ímpar, o `04304-000`
  // nunca serviu pra nenhuma das duas versões — o erro não era só o número.
  //
  // ⚠️ Isto NÃO é só rodapé: alimenta o JSON-LD (`Organization`), o /llms.txt,
  // o e-mail transacional e a identificação legal do checkout (Decreto
  // 7.962/2013). Divergir do registro público é ruído de entidade — a mesma
  // classe de problema do `sameAs` apontando pra perfil duplicado.
  address:
    'Edifício Austin Office Center — Av. Fagundes Filho, 141, Conjunto 72 — Vila Monte Alegre, São Paulo - SP, 04304-010',
  /** Partes do endereço pro JSON-LD (schema.org PostalAddress). */
  endereco: {
    logradouro: 'Av. Fagundes Filho, 141, Conjunto 72 — Edifício Austin Office Center',
    bairro: 'Vila Monte Alegre',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '04304-010',
  },
} as const;

// IDENTIFICAÇÃO LEGAL DO FORNECEDOR. O site VENDE DIRETO (CheckoutNI), e o
// Decreto 7.962/2013 (e-commerce no CDC) exige razão social, CNPJ, endereço
// físico e e-mail em local de destaque, visíveis antes de fechar a compra.
// Até 07/09 a razão social e o CNPJ estavam escritos à mão em 3 lugares e o
// endereço só aparecia em /contato e no JSON-LD — o rodapé e o checkout não
// tinham nenhum dos quatro (achado da Master Criador de Fluxo, 07/09).
// Consumido pelo rodapé (toda página) e pelo passo de pagamento do checkout.
export const EMPRESA = {
  razaoSocial: 'Somatecblocking UF Eletroeletrônicos LTDA',
  cnpj: '16.774.052/0001-55',
  /** Razão social · CNPJ, como vai no rodapé e no checkout. */
  linha: 'Somatecblocking UF Eletroeletrônicos LTDA · CNPJ 16.774.052/0001-55',
  /** Ano de fundação. FONTE: `clients/somatec/brand/kit-perfis-digitais.md`
   *  ("Fundação | 1999 · 26 anos").
   *
   *  ⚠️ Estava digitado solto em 6 arquivos, e por isso o MENU dizia 1998
   *  enquanto a página institucional, a de quem-somos e o `foundingDate` do
   *  JSON-LD diziam 1999 (B18 da auditoria 13/09). Nada acusava: cada arquivo
   *  estava internamente coerente. Agora o número mora aqui. */
  fundacao: 1999,
} as const;

/**
 * Anos de atuação — CALCULADO, nunca digitado.
 *
 * ⚠️ O número estava na mão em 12 pontos do site (páginas, FAQ, llms.txt,
 * selos de prova, checkout). Ele envelhece sozinho: no aniversário, o site
 * inteiro passa a dizer um ano a menos do que a empresa tem, em 12 lugares, e
 * ninguém é avisado. É a mesma família do `lastModified` falso do sitemap —
 * dado que parece certo porque um dia foi.
 *
 * 🔒 CONSERVADOR DE PROPÓSITO. O Léo confirmou o último trimestre de 1999 e
 * não o mês exato, então a conta assume 31/12: o site prefere dizer 26 quando
 * já são 27 a dizer 27 quando ainda são 26. A frase que acompanha o número é
 * "sem nenhum acidente" — inflar o tempo infla o histórico de segurança junto,
 * e isso é afirmação que não se arredonda pra cima.
 */
export function anosDeAtuacao(hoje = new Date()): number {
  const aniversario = new Date(Date.UTC(hoje.getUTCFullYear(), 11, 31));
  const completou = hoje.getTime() >= aniversario.getTime();
  return hoje.getUTCFullYear() - EMPRESA.fundacao - (completou ? 0 : 1);
}

/** Link do WhatsApp comercial. `texto` vira a mensagem já digitada pro cliente. */
export function whatsappHref(texto?: string): string {
  const qs = texto ? `?text=${encodeURIComponent(texto)}` : '';
  return `https://wa.me/${CONTACT.whatsappDigits}${qs}`;
}

/**
 * Redes sociais oficiais — FONTE ÚNICA, no repositório. Decisão do Léo, 17/09.
 *
 * Por que não env e não banco: rede social da empresa muda praticamente nunca,
 * e o que custou caro aqui não foi demorar pra trocar — foi ficar errado sem
 * ninguém ver. Em 17/09 a sessão de ADS achou o `sameAs` apontando havia
 * semanas pra uma página DUPLICADA do LinkedIn (60 seguidores em vez dos 250
 * da real), o que provavelmente explica a marca não resolver num painel de
 * conhecimento do Google.
 *
 * Valor em env ou em banco não está no repositório: não passa por revisão e
 * nenhum teste consegue olhar pra ele. Aqui passa pelas duas coisas —
 * `tests/socials-constante.test.ts` reprova subdomínio de locale
 * (`pt.linkedin.com`, que também estava no ar) e reprova o slug da duplicata.
 *
 * ⛔ Não reintroduzir leitura de env nem de `site_settings` pra estes três. Dois
 * lugares pro mesmo fato é o defeito, não a solução — o rodapé lia o banco e o
 * JSON-LD lia a env, e por isso arrumar um deixava o outro errado em silêncio.
 * Trocar rede social passa por commit, de propósito.
 */
export const SOCIALS = {
  linkedin: 'https://www.linkedin.com/company/somatecblocking',
  instagram: 'https://www.instagram.com/somatecblocking',
  youtube: 'https://www.youtube.com/c/somatecblocking',
} as const;
