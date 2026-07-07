import { SITE, CONTACT, SOCIALS } from '@/lib/constants/site';

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
    legalName: 'Somatecblocking UF Eletroeletrônicos LTDA',
    url: SITE.url,
    logo: absoluteUrl('/logo-somatec.png'),
    image: absoluteUrl(SITE.ogImage),
    description: SITE.description,
    slogan: 'Proteção contra surtos elétricos em 100 kHz',
    foundingDate: '1999',
    areaServed: 'BR',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Rua XV de Novembro, 743 — Centro',
      addressLocality: 'Dracena',
      addressRegion: 'SP',
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
            ...(CONTACT.whatsapp ? { telephone: CONTACT.whatsapp } : {}),
            contactType: 'sales',
            areaServed: 'BR',
            availableLanguage: ['Portuguese'],
          },
        }
      : {}),
  };
}

/** Product — MasterBlock (produto-herói, usado na home pra SEO + GEO). */
export function masterBlockProductSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'MasterBlock',
    category: 'Supressor de surtos elétricos · DPS Classe III',
    url: absoluteUrl('/produtos'),
    image: absoluteUrl(SITE.ogImage),
    brand: { '@type': 'Brand', name: 'MasterBlock' },
    manufacturer: { '@type': 'Organization', name: SITE.fullName, url: SITE.url },
    description:
      'Supressor e protetor contra surtos elétricos com filtro passivo atuante em 100 kHz. Diferente dos DPS comuns (que atuam até 10 kHz), o MasterBlock protege equipamentos automatizados — CLPs, servos e inversores — contra transientes de alta frequência. Linha MB-01 a MB-12 (8 a 100 kA), DPS Classe III conforme ABNT NBR 5410 e IEC 61643-1.',
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

/** FAQPage — perguntas frequentes (forte pra SEO e principalmente GEO/IA). */
export function faqSchema() {
  const faqs: { q: string; a: string }[] = [
    {
      q: 'O que é o MasterBlock?',
      a: 'O MasterBlock é um supressor e protetor contra surtos elétricos com filtro passivo que atua em 100 kHz, fabricado pela Somatec Blocking. Protege equipamentos eletroeletrônicos e automatizados contra picos de tensão causados por descargas atmosféricas, comutação de motores e oscilações da rede.',
    },
    {
      q: 'Qual a diferença do MasterBlock para um DPS comum?',
      a: 'O DPS comum atua em frequências abaixo de 10 kHz. O MasterBlock atua em 100 kHz — a faixa onde estão os transientes de alta frequência que mais danificam equipamentos automatizados, CLPs, servos e inversores.',
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

/** Recipe — para páginas de receita. */
type RecipeIngredientInput = { name: string; quantity?: string; unit?: string };
type RecipeInstructionInput = { step: number; text: string };
type RecipeInput = {
  title: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  prepTime?: string | null;
  cookTime?: string | null;
  totalTime?: string | null;
  yieldText?: string | null;
  ingredients: RecipeIngredientInput[];
  instructions: RecipeInstructionInput[];
  categoryName?: string | null;
};

/** Converte "15 min" / "1 h 30 min" → ISO 8601 duration (PT15M / PT1H30M). */
function toIsoDuration(input?: string | null): string | undefined {
  if (!input) return undefined;
  const text = input.toLowerCase();
  const hMatch = text.match(/(\d+)\s*h/);
  const mMatch = text.match(/(\d+)\s*min/);
  if (!hMatch && !mMatch) return undefined;
  const h = hMatch ? parseInt(hMatch[1]!, 10) : 0;
  const m = mMatch ? parseInt(mMatch[1]!, 10) : 0;
  let iso = 'PT';
  if (h > 0) iso += `${h}H`;
  if (m > 0) iso += `${m}M`;
  return iso === 'PT' ? undefined : iso;
}

export function recipeSchema(r: RecipeInput) {
  const ingredientStrings = r.ingredients
    .filter((ing) => ing.name)
    .map((ing) =>
      [ing.quantity, ing.unit, ing.name].filter(Boolean).join(' ').trim(),
    );

  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: r.title,
    url: absoluteUrl(`/receitas/${r.slug}`),
    ...(r.description ? { description: r.description } : {}),
    ...(r.image ? { image: absoluteUrl(r.image) } : { image: absoluteUrl(SITE.ogImage) }),
    ...(r.categoryName ? { recipeCategory: r.categoryName } : {}),
    ...(r.yieldText ? { recipeYield: r.yieldText } : {}),
    ...(toIsoDuration(r.prepTime) ? { prepTime: toIsoDuration(r.prepTime) } : {}),
    ...(toIsoDuration(r.cookTime) ? { cookTime: toIsoDuration(r.cookTime) } : {}),
    ...(toIsoDuration(r.totalTime) ? { totalTime: toIsoDuration(r.totalTime) } : {}),
    ...(ingredientStrings.length > 0 ? { recipeIngredient: ingredientStrings } : {}),
    ...(r.instructions.length > 0
      ? {
          recipeInstructions: r.instructions
            .filter((ins) => ins.text)
            .map((ins) => ({
              '@type': 'HowToStep',
              position: ins.step,
              text: ins.text,
            })),
        }
      : {}),
    author: { '@type': 'Organization', name: SITE.fullName },
  };
}
