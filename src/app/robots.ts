import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/constants/site';

/**
 * Rotas que ficam fora do índice mesmo depois do go-live.
 *
 * ⚠️ Esta lista precisa ser repetida em TODO grupo de user-agent. Em
 * robots.txt o robô obedece só ao grupo MAIS ESPECÍFICO que casa com ele:
 * se existir um grupo `GPTBot` e ele não repetir estes disallow, o GPTBot
 * deixa de herdar o grupo `*` e passa a poder rastrear /api e /login.
 * É o erro clássico de quem adiciona bot de IA no robots.
 */
const FORA_DO_INDICE = ['/api', '/login', '/cluster-mapa.html', '/mapa-visual-fluxos.html'];

/**
 * Robôs de IA citados na referência de GEO da Somatec, listados
 * explicitamente em vez de depender do curinga.
 *
 * Motivo de ser explícito: `Google-Extended` é o token que controla o uso do
 * conteúdo nas respostas de IA do Google, separado do Googlebot. Deixar os
 * quatro por escrito também protege de alguém, no futuro, apertar o grupo `*`
 * sem perceber que está cortando a citação em ChatGPT e Perplexity junto.
 */
const ROBOS_DE_IA = ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'];

export default function robots(): MetadataRoute.Robots {
  // Staging/provisório: bloqueia tudo, inclusive os robôs de IA. Desligar
  // (SITE_NOINDEX != 'true') no go-live.
  //
  // 🔑 Lembrete: esta NÃO é a única chave. O layout raiz lê
  // `seo_robots_index` em `site_settings` (Supabase), com default false.
  // Virar só esta variável abre o robots.txt e mantém a meta noindex.
  if (process.env.SITE_NOINDEX === 'true') {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: FORA_DO_INDICE },
      ...ROBOS_DE_IA.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: FORA_DO_INDICE,
      })),
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
