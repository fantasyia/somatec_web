import { SITE, CONTACT, SOCIALS, EMPRESA } from '@/lib/constants/site';
import { MASTER_BLOCK_MODELS } from '@/lib/constants/masterblock';

/**
 * Helpers para gerar Schema.org JSON-LD structured data.
 * Usados via <JsonLd> nos pages.
 */

function absoluteUrl(path: string): string {
  const base = SITE.url.replace(/\/$/, '');
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Organization — informações institucionais base (usado na home). */
export function organizationSchema() {
  const sameAs = [SOCIALS.linkedin, SOCIALS.instagram, SOCIALS.youtube].filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.fullName,
    legalName: EMPRESA.razaoSocial,
    url: SITE.url,
    logo: absoluteUrl('/logo-somatec.png'),
    image: absoluteUrl(SITE.ogImage),
    description: SITE.description,
    slogan: 'Proteção contra surtos elétricos até 100 kHz',
    foundingDate: '1999',
    areaServed: 'BR',
    address: {
      '@type': 'PostalAddress',
      streetAddress: CONTACT.endereco.logradouro,
      addressLocality: CONTACT.endereco.cidade,
      addressRegion: CONTACT.endereco.uf,
      postalCode: CONTACT.endereco.cep,
      addressCountry: 'BR',
    },
    knowsAbout: [
      'Proteção contra surtos elétricos',
      'Supressor de transientes',
      'Qualidade de energia elétrica',
      'DPS Classe III',
      'Aterramento industrial',
      'ABNT NBR 5410',
    ],
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(CONTACT.email
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            email: CONTACT.email,
            ...(CONTACT.whatsappDigits ? { telephone: CONTACT.whatsappDisplay } : {}),
            contactType: 'sales',
            areaServed: 'BR',
            availableLanguage: ['Portuguese'],
          },
        }
      : {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// PRODUCT — DOIS schemas, não um. Decisão da master /plano-somatec (12/09).
//
// Era um só (`masterBlockProductSchema`) servido em TRÊS páginas: /produtos,
// /protecao-comercial e /protecao-residencial. Isso deixou de funcionar quando
// o vocabulário passou a depender do público:
//
//   não-industrial → "protetor de surto" é como o cliente BUSCA
//                    (~2.900/mês no termo-cabeça)
//   industrial     → "supressor de surtos e transientes" é o termo do
//                    especificador, e continua
//
// Um schema não atende os dois sem mentir pra um deles. Dois atendem, e o
// `alternateName` faz a ponte: cada um declara o vocabulário do outro, então
// nenhum dos dois perde a correspondência quando a busca vem pelo outro termo.
//
// ⚠️ "supressor" NÃO está errado — o Master Block é um supressor de surtos. O
// que pertence a componente de painel (contator, diodo, bloco WEG) é a CAUDA
// DE BUSCA da palavra, não a palavra. O problema sempre foi descoberta, nunca
// precisão: o site estava certo e invisível.
//
// ⛔ FALTA `offers` (preço + disponibilidade) nos dois. É o que habilita o rich
// result de produto — sem ele o Google não monta o card com preço, que é
// justamente o formato com que Clamper, Intelbras e Mercado Livre ocupam esse
// SERP. Não é esquecimento: depende de PUBLICAR PREÇO na página, decisão
// comercial do Léo que ainda não foi tomada. Os preços existem em
// `constants/masterblock.ts` e hoje só o checkout os lê.
// ─────────────────────────────────────────────────────────────────────────

/**
 * A OFERTA DE COMPRA, derivada do catálogo — nunca digitada.
 *
 * `AggregateOffer` e não `Offer`: são 12 modelos com 12 preços, e o que o
 * Google monta a partir disso é a faixa ("a partir de R$ 4.350"). Um `Offer`
 * único obrigaria a escolher UM preço pra representar a linha inteira, e
 * qualquer escolha seria mentira sobre os outros onze.
 *
 * Os números saem de `MASTER_BLOCK_MODELS`, a mesma fonte que a tabela da
 * página e que o checkout usam. Preço de schema divergindo do preço da tela é
 * o tipo de erro que o Google pune (structured data que não corresponde ao
 * conteúdo visível) e que ninguém vê, porque os dois textos vivem longe um do
 * outro. Derivando, não tem como divergir.
 *
 * ⚠️ É a oferta de COMPRA DIRETA — comércio e residência. Na indústria o
 * modelo é LOCAÇÃO, e vender equipamento pro industrial é oferta que morreu em
 * 25/08. Por isso a tabela da página declara "compra direta" na coluna e no
 * rodapé: o schema espelha o que a página diz, nunca o contrário.
 */
function ofertaDeCompra() {
  const precos = MASTER_BLOCK_MODELS.map((m) => m.preco);
  return {
    '@type': 'AggregateOffer',
    priceCurrency: 'BRL',
    lowPrice: Math.min(...precos),
    highPrice: Math.max(...precos),
    offerCount: precos.length,
    availability: 'https://schema.org/InStock',
    seller: { '@type': 'Organization', name: SITE.fullName },
  };
}

/** O que os dois schemas têm em comum — ficha técnica não muda com o público. */
function produtoBase() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    image: absoluteUrl(SITE.ogImage),
    brand: { '@type': 'Brand', name: 'Master Block' },
    manufacturer: { '@type': 'Organization', name: SITE.fullName, url: SITE.url },
    description:
      'Supressor e protetor contra surtos elétricos com filtro passivo atuante até 100 kHz. Diferente dos DPS comuns (que atuam até 10 kHz), o Master Block protege equipamentos automatizados — CLPs, servos e inversores — contra transientes de alta frequência. Linha MB-01 a MB-12 (8 a 100 kA), DPS Classe III conforme ABNT NBR 5410 e IEC 61643-1.',
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Faixa de atuação', value: '100 kHz' },
      { '@type': 'PropertyValue', name: 'Corrente máxima de surto', value: '8 kA a 100 kA' },
      { '@type': 'PropertyValue', name: 'Classificação', value: 'DPS Classe III' },
      { '@type': 'PropertyValue', name: 'Grau de proteção', value: 'IP-65' },
      { '@type': 'PropertyValue', name: 'Temperatura de operação', value: '-40 °C a 60 °C' },
      { '@type': 'PropertyValue', name: 'Normas', value: 'ABNT NBR 5410 · IEC 61643-1' },
    ],
  };
}

/** Product INDUSTRIAL — `/produtos`, o catálogo. Vocabulário do especificador. */
export function masterBlockProductSchema() {
  return {
    ...produtoBase(),
    name: 'Master Block — supressor de surtos e transientes (DPS Classe III)',
    alternateName: 'protetor de surto',
    category: 'Supressor de surtos elétricos · DPS Classe III',
    url: absoluteUrl('/produtos'),
    offers: ofertaDeCompra(),
  };
}

/** Product NÃO-INDUSTRIAL — LPs de comércio e residência. Vocabulário de quem compra. */
export function masterBlockProdutoNiSchema(caminho: string) {
  return {
    ...produtoBase(),
    name: 'Master Block — protetor de surto para o quadro de entrada',
    alternateName: 'supressor de surtos e transientes',
    category: 'Protetor de surto',
    url: absoluteUrl(caminho),
    offers: ofertaDeCompra(),
  };
}

/** FAQPage — perguntas frequentes (forte pra SEO e principalmente GEO/IA). */
export function faqSchema() {
  const faqs: { q: string; a: string }[] = [
    {
      q: 'O que é o MasterBlock?',
      a: 'O MasterBlock é um supressor e protetor contra surtos elétricos com filtro passivo que atua até 100 kHz, fabricado pela Somatec Blocking. Protege equipamentos eletroeletrônicos e automatizados contra picos de tensão causados por descargas atmosféricas, comutação de motores e oscilações da rede.',
    },
    {
      q: 'Qual a diferença do MasterBlock para um DPS comum?',
      a: 'O DPS comum atua em frequências abaixo de 10 kHz. O MasterBlock atua até 100 kHz — a faixa onde estão os transientes de alta frequência que mais danificam equipamentos automatizados, CLPs, servos e inversores.',
    },
    {
      q: 'O MasterBlock atende quais normas?',
      a: 'É classificado como DPS Classe III conforme a ABNT NBR 5410 e a IEC 61643-1, com grau de proteção IP-65 e operação de -40 °C a 60 °C.',
    },
    {
      q: 'Como o MasterBlock é instalado?',
      a: 'É instalado em paralelo no quadro de distribuição, com proteção em cascata (entrada da instalação, quadro e próximo ao equipamento sensível) e um sistema de aterramento dedicado projetado pela Somatec conforme a NBR 5410.',
    },
    {
      q: 'Para quais indústrias o MasterBlock é indicado?',
      a: 'Para qualquer planta com equipamentos críticos ou automatizados: frigoríficos, metalurgia, automação industrial, agronegócio, data centers, telecom e hospitais.',
    },
  ];
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/** Product — para páginas de produto. */
type ProductInput = {
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  brandName?: string | null;
  categoryName?: string | null;
};

export function productSchema(p: ProductInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    url: absoluteUrl(`/produtos/${p.slug}`),
    ...(p.description ? { description: p.description } : {}),
    ...(p.image ? { image: absoluteUrl(p.image) } : { image: absoluteUrl(SITE.ogImage) }),
    ...(p.brandName ? { brand: { '@type': 'Brand', name: p.brandName } } : {}),
    ...(p.categoryName ? { category: p.categoryName } : {}),
  };
}

