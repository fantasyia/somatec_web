/** @type {import('next').NextConfig} */

// CSP enforce mode — qualquer violação BLOQUEIA o recurso e POSTa em /api/csp-report.
// Permissões abaixo refletem fontes legítimas do projeto:
//   - script-src: self + Turnstile + Swagger UI (jsdelivr). unsafe-inline+eval mandatórios pro Next.js dev/runtime.
//   - style-src: self + Google Fonts (CSS) + Swagger UI (jsdelivr).
//   - img-src: self + data/blob + Supabase storage + placeholders (picsum, placehold).
//   - media-src: self + Supabase + Google CDN (vídeo hero placeholder).
//   - connect-src: self + Supabase REST/realtime + Turnstile + Sentry envelope (qualquer host com /api/envelope).
//   - frame-src: Turnstile.
//   - font-src: self + Google Fonts.
//   - report-uri: /api/csp-report (legacy spec; Chrome usa, mas browsers modernos preferem report-to).
// 'unsafe-eval' só em dev (HMR/source maps do webpack). Em produção é REMOVIDO
// para reduzir a superfície de XSS. 'unsafe-inline' permanece: o Next injeta
// scripts inline no SSR/ISR e a alternativa (nonce) forçaria render dinâmico —
// regrediria o ISR da home (fix do 503). O vetor concreto (GA ID) já é
// validado/escapado no servidor (ver settings/route + layout).
const isDev = process.env.NODE_ENV !== 'production';
// ⚠️ TAG NOVA = LIBERAR NO CSP, SENÃO ELA MORRE CALADA. Em 08/09 o container
// GTM foi ligado (seo_gtm_id) e o `gtm.js` passou a ser BLOQUEADO aqui — o
// console dizia "violates Content Security Policy" e mais nada: nenhuma tag
// carregava, e a validação por requisição de rede parecia certa porque o
// pedido chega a sair. Google Tag Manager, GA4 e Meta Pixel abaixo.
const GOOGLE_TAGS = 'https://www.googletagmanager.com https://www.google-analytics.com';
const META_TAGS = 'https://connect.facebook.net';
const scriptSrc = `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://challenges.cloudflare.com https://*.challenges.cloudflare.com https://cdn.jsdelivr.net ${GOOGLE_TAGS} ${META_TAGS}`;

const cspDirectives = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
  // GA4 e Pixel medem por imagem (pixel 1x1) quando o navegador bloqueia fetch.
  `img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://picsum.photos https://i.picsum.photos https://fastly.picsum.photos https://placehold.co ${GOOGLE_TAGS} https://www.facebook.com`,
  "media-src 'self' https://*.supabase.co https://*.supabase.in https://commondatastorage.googleapis.com",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://*.challenges.cloudflare.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://*.ingest.us.sentry.io ${GOOGLE_TAGS} https://analytics.google.com ${META_TAGS} https://www.facebook.com`,
  // Turnstile monta o desafio em IFRAME — sem isto, token sempre vazio e 400 em
  // todo formulário. E o desafio conversa com SUBDOMÍNIOS (hagen.challenges…),
  // não só com o host principal: medido em 09/09, a chamada pro `hagen.` era a
  // única que abortava. Por isso o curinga, aqui e no connect-src. O GTM usa
  // iframe no modo Preview.
  `frame-src https://challenges.cloudflare.com https://*.challenges.cloudflare.com https://www.googletagmanager.com https://www.facebook.com`,
  "font-src 'self' data: https://fonts.gstatic.com",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "report-uri /api/csp-report",
].join('; ');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // CSP enforce mode — substituiu Content-Security-Policy-Report-Only em 2026-05-17.
  // Violations vão para /api/csp-report (logged + counted em msm_csp_violations_total).
  { key: 'Content-Security-Policy', value: cspDirectives },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // q75 (padrão) + q90 (imagens de marca em alta qualidade, ex.: faixa
    // industrial da home — despacho de qualidade).
    qualities: [75, 90],
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'i.picsum.photos' },
      { protocol: 'https', hostname: 'fastly.picsum.photos' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Mapas internos (documento de trabalho, não conteúdo do site). Hoje eles
      // só não são indexados porque SITE_NOINDEX bloqueia o site inteiro — no
      // go-live essa flag cai. O X-Robots-Tag garante o noindex de forma
      // permanente e vale pra arquivo estático, que não passa pelo metadata do
      // Next. O cluster-mapa nem tem a meta tag no HTML.
      ...['/cluster-mapa.html', '/mapa-visual-fluxos.html'].map((source) => ({
        source,
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      })),
    ];
  },
  async redirects() {
    return [
      // LP /protecao antiga (uma só p/ os 2 públicos) foi substituída pelas 2
      // LPs segmentadas (/protecao-residencial + /protecao-comercial). 301 pra
      // a bifurcação da home (escolha de perfil), sem quebrar links/UTM.
      { source: '/protecao', destination: '/#bifurcacao', permanent: true },
      // A calculadora genérica /ferramentas/orcamento atendia os 2 públicos NI
      // e foi substituída pelas LPs segmentadas (cada uma com o CheckoutNI
      // embutido) e pelo /orcamento-industrial. Manda pra bifurcação, que é
      // onde o visitante escolhe o próprio perfil.
      { source: '/ferramentas/orcamento', destination: '/#bifurcacao', permanent: true },
      // O seletor "qual Master Block é o meu" foi removido: a jornada do
      // cliente é LP → calculadora, e um seletor solto entregava
      // dimensionamento (e preço de venda) sem saber com quem estava falando.
      { source: '/ferramentas/qual-master-block', destination: '/produtos', permanent: true },
      // Rename institucional /a-msm -> /a-somatec (slugs limpos).
      { source: '/a-msm', destination: '/a-somatec', permanent: true },
      { source: '/a-msm/quem-somos', destination: '/a-somatec/quem-somos', permanent: true },
      { source: '/a-msm/estrutura-industrial', destination: '/a-somatec/tecnologia-e-fabricacao', permanent: true },
      { source: '/a-msm/qualidade-e-seguranca', destination: '/a-somatec/comprovacao-e-normas', permanent: true },
      // ── /solucoes INTEIRA saiu em 04/09 ────────────────────────────
      // Decisão do Léo: o site passa a ser SÓ Master Block, dividido entre
      // industrial e não-industrial. Saíram Banco de Capacitores e Manutenção
      // de Cabine Primária (não são Master Block), e a Gestão de Qualidade de
      // Energia virou seção de /produtos — nunca foi produto à parte.
      //
      // Um curinga cobre tudo: os slugs Somatec, os slugs food do site antigo
      // (food-service, b2b, distribuicao, envase, marcas-proprias,
      // terceirizacao-de-producao) e o medicao-e-laudos aposentado em 24/08.
      //
      // ⚠️ O curinga substitui as regras individuais DE PROPÓSITO. Elas
      // apontavam uma pra outra dentro de /solucoes, e manter isso agora
      // criaria redirect encadeado (/solucoes/envase → /solucoes/manutencao…
      // → /produtos): dois saltos, que o Google penaliza e o navegador
      // paga. Assim é um salto só, de qualquer URL antiga.
      { source: '/solucoes', destination: '/produtos', permanent: true },
      { source: '/solucoes/:slug*', destination: '/produtos', permanent: true },
      // Seções food removidas (não existem no negócio Somatec).
      { source: '/marcas', destination: '/produtos', permanent: true },
      { source: '/marcas/:slug', destination: '/produtos', permanent: true },
      { source: '/receitas', destination: '/', permanent: true },
      { source: '/receitas/:path*', destination: '/', permanent: true },

      // ── O SITE ANTIGO DO DOMÍNIO — 32 URLs ainda indexadas ────────────
      //
      // Medido em 11/09 pelo Search Console + índice do Google. Existiu um site
      // neste domínio, em três idiomas, com blog (`/conteudos`) e páginas de
      // produto. Todas as 32 respondem 404 hoje.
      //
      // ⚠️ Isto corrige uma premissa errada que estava escrita em dois cards:
      // "não existe site antigo, o domínio nunca serviu nada". A medição por
      // DNS de 07/09 estava certa sobre o PRESENTE (o apex não tinha A/AAAA) e
      // foi lida como se valesse pro passado.
      //
      // 🔴 O MOTIVO PRINCIPAL não é SEO — é a OFERTA EXTINTA:
      //
      //   /produto/servico-de-medicoes-e-laudos
      //
      // "Serviço de Medições e Laudos" é a mecânica que morreu em 20/08: ir
      // medir na planta ANTES do contrato. A página não serve nada (404), mas o
      // RESULTADO DE BUSCA existe, com o título e a descrição da época. O 301 é
      // o que faz o Google substituir aquela entrada por /produtos no recrawl.
      //
      // Sobre equity: não há. Search Console, 16 meses — 9 páginas com
      // impressão, ZERO cliques, a maior com 4 impressões. Isto é higiene de
      // índice e de link velho, não resgate de autoridade. Por isso são cinco
      // regras com curinga, e não um mapa de 32 linhas.
      //
      // ⏱️ Só vale ANTES do go-live: depois de o NOINDEX sair, o Google já terá
      // recrawleado e registrado as 404.
      //
      // ⚠️ ORDEM IMPORTA: o Next usa a PRIMEIRA regra que casa. As específicas
      // de /en e /es vêm antes do curinga de idioma, senão `/en/product/x` cairia
      // na home em vez de /produtos.
      { source: '/produto', destination: '/produtos', permanent: true },
      { source: '/produto/:slug*', destination: '/produtos', permanent: true },
      { source: '/en/product/:slug*', destination: '/produtos', permanent: true },
      { source: '/es/producto/:slug*', destination: '/produtos', permanent: true },
      // O blog antigo. `/en/contents` tinha querystring (?c=…&page=…) — o Next
      // preserva a query no 301, e /blog simplesmente ignora o que não conhece.
      { source: '/conteudos', destination: '/blog', permanent: true },
      { source: '/conteudos/:slug*', destination: '/blog', permanent: true },
      { source: '/en/contents', destination: '/blog', permanent: true },
      { source: '/en/contents/:slug*', destination: '/blog', permanent: true },
      { source: '/es/contenido/:slug*', destination: '/blog', permanent: true },
      // A página de clientes do site antigo virou a de resultados.
      { source: '/clientes', destination: '/resultados', permanent: true },
      // Curinga de idioma, POR ÚLTIMO: o site novo é só PT. O multilíngue
      // PT/EN/ES aparecia no plano antigo e nunca saiu do papel — mandar pra
      // home é melhor que 404 pra quem chega de link velho em espanhol.
      { source: '/en', destination: '/', permanent: true },
      { source: '/en/:path*', destination: '/', permanent: true },
      { source: '/es', destination: '/', permanent: true },
      { source: '/es/:path*', destination: '/', permanent: true },
    ];
  },
};

module.exports = nextConfig;
