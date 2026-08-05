import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/constants/site';

export default function robots(): MetadataRoute.Robots {
  // Staging/provisório: bloqueia tudo. Desligar (SITE_NOINDEX != 'true') no go-live.
  if (process.env.SITE_NOINDEX === 'true') {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Mapas internos entram aqui pra seguirem fora do índice depois do
        // go-live (o X-Robots-Tag em next.config.js é a trava principal).
        disallow: [
          '/admin',
          '/api',
          '/login',
          '/cluster-mapa.html',
          '/mapa-visual-fluxos.html',
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
