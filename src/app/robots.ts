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
        disallow: ['/admin', '/api', '/login'],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
