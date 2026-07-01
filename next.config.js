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
const scriptSrc = `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://challenges.cloudflare.com https://cdn.jsdelivr.net`;

const cspDirectives = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
  "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://picsum.photos https://i.picsum.photos https://fastly.picsum.photos https://placehold.co",
  "media-src 'self' https://*.supabase.co https://*.supabase.in https://commondatastorage.googleapis.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://*.ingest.us.sentry.io",
  "frame-src https://challenges.cloudflare.com",
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
    ];
  },
  async redirects() {
    return [
      // Rename institucional /a-msm -> /a-somatec (slugs limpos).
      { source: '/a-msm', destination: '/a-somatec', permanent: true },
      { source: '/a-msm/quem-somos', destination: '/a-somatec/quem-somos', permanent: true },
      { source: '/a-msm/estrutura-industrial', destination: '/a-somatec/tecnologia-e-fabricacao', permanent: true },
      { source: '/a-msm/qualidade-e-seguranca', destination: '/a-somatec/comprovacao-e-normas', permanent: true },
      // Slugs antigos (food) de /solucoes -> novas soluções Somatec.
      { source: '/solucoes/food-service', destination: '/solucoes/protecao-contra-surtos', permanent: true },
      { source: '/solucoes/b2b', destination: '/solucoes/qualidade-de-energia', permanent: true },
      { source: '/solucoes/distribuicao', destination: '/solucoes/banco-de-capacitores', permanent: true },
      { source: '/solucoes/terceirizacao-de-producao', destination: '/solucoes/medicao-e-laudos', permanent: true },
      { source: '/solucoes/envase', destination: '/solucoes/manutencao-cabine-primaria', permanent: true },
      { source: '/solucoes/marcas-proprias', destination: '/solucoes', permanent: true },
    ];
  },
};

module.exports = nextConfig;
