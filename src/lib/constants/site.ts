export const SITE = {
  name: 'Somatec',
  fullName: 'Somatec Blocking',
  // Meta description — campo de BUSCA, segue técnica. O público, porém, não
  // pode ser só "a indústria": o site atende comércio e residência.
  description:
    'Proteção contra surtos e qualidade de energia para indústria, comércio e residências. MasterBlock — supressor com atuação em 100 kHz.',
  // Linha LIDA no rodapé, em toda página — inclusive nas LPs de casa e de
  // comércio. Dizer "para a indústria" ali ensinava o dono de casa que a
  // empresa não é pra ele, logo depois de a página inteira dizer que é.
  tagline:
    'Proteção elétrica e qualidade de energia — para indústria, comércio e residências.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://somatecblocking.com.br',
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
  address:
    'Edifício Austin Office Center — Av. Fagundes Filho, 145, Conj. 72 — Vila Monte Alegre, São Paulo - SP, 04304-000',
  /** Partes do endereço pro JSON-LD (schema.org PostalAddress). */
  endereco: {
    logradouro: 'Av. Fagundes Filho, 145, Conj. 72 — Edifício Austin Office Center',
    bairro: 'Vila Monte Alegre',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '04304-000',
  },
} as const;

/** Link do WhatsApp comercial. `texto` vira a mensagem já digitada pro cliente. */
export function whatsappHref(texto?: string): string {
  const qs = texto ? `?text=${encodeURIComponent(texto)}` : '';
  return `https://wa.me/${CONTACT.whatsappDigits}${qs}`;
}

export const SOCIALS = {
  linkedin: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN ?? '',
  instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? '',
  youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE ?? '',
} as const;
