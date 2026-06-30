#!/usr/bin/env node
// =============================================================================
// MSM — Verificador de variáveis de ambiente
//
// Uso:  node scripts/check-env.mjs
//       npm run check:env
//
// Lê .env.local + .env, valida que cada chave esperada está presente
// e classifica como [obrigatória / recomendada / opcional]. Saída humana.
// Retorna exit 1 se faltar alguma OBRIGATÓRIA — útil em CI/pre-deploy.
// =============================================================================

import { config } from 'dotenv';
import { existsSync } from 'node:fs';

config({ path: '.env.local' });
config({ path: '.env' });

/** @type {Array<{name: string, level: 'required' | 'recommended' | 'optional', hint: string}>} */
const SCHEMA = [
  // Obrigatórias para o site abrir
  { name: 'NEXT_PUBLIC_SUPABASE_URL', level: 'required', hint: 'Supabase → Project Settings → API → Project URL' },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', level: 'required', hint: 'Supabase → Project Settings → API → anon public' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', level: 'required', hint: 'Supabase → Project Settings → API → service_role (secreto)' },
  { name: 'NEXT_PUBLIC_SITE_URL', level: 'required', hint: 'URL pública do site (ex: https://msm.com.br)' },

  // Recomendadas — pipeline de forms funciona sem, mas degradado
  { name: 'MULLERBOT_WEBHOOK_URL', level: 'recommended', hint: 'sem isso, forms ficam empilhados em pending na queue' },
  { name: 'MULLERBOT_API_KEY', level: 'recommended', hint: 'idem' },
  { name: 'NEXT_PUBLIC_TURNSTILE_SITE_KEY', level: 'recommended', hint: 'sem isso, Turnstile fica oculto (sem proteção)' },
  { name: 'TURNSTILE_SECRET_KEY', level: 'recommended', hint: 'em prod sem isso, /api/forms/submit bloqueia tudo' },
  { name: 'UPSTASH_REDIS_REST_URL', level: 'recommended', hint: 'sem isso, rate limit desligado' },
  { name: 'UPSTASH_REDIS_REST_TOKEN', level: 'recommended', hint: 'idem' },
  { name: 'REVALIDATE_SECRET', level: 'recommended', hint: '/api/revalidate fica aberto se ausente' },
  { name: 'CRON_SECRET', level: 'recommended', hint: 'em prod, /api/cron/* retorna 500 se ausente' },

  // Opcionais
  { name: 'NEXT_PUBLIC_REPRESENTATIVE_APP_URL', level: 'optional', hint: 'redirect externo da página /representantes' },
  { name: 'SENTRY_DSN', level: 'optional', hint: 'errors automáticos via logger.error → Sentry envelope' },
  { name: 'NEXT_PUBLIC_CONTACT_WHATSAPP', level: 'optional', hint: 'aparece no Footer' },
  { name: 'NEXT_PUBLIC_CONTACT_ADDRESS', level: 'optional', hint: 'idem' },
  { name: 'NEXT_PUBLIC_CONTACT_EMAIL', level: 'optional', hint: 'idem' },
  { name: 'NEXT_PUBLIC_SOCIAL_LINKEDIN', level: 'optional', hint: 'Footer só mostra socials com URL preenchida' },
  { name: 'NEXT_PUBLIC_SOCIAL_INSTAGRAM', level: 'optional', hint: 'idem' },
  { name: 'NEXT_PUBLIC_SOCIAL_YOUTUBE', level: 'optional', hint: 'idem' },
  { name: 'DATABASE_URL', level: 'optional', hint: 'usado apenas por scripts/apply-seed.mjs (migrations)' },
];

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

const c = (color, s) => `${colors[color]}${s}${colors.reset}`;

const checkValue = (raw) => {
  if (raw === undefined || raw === '') return 'missing';
  if (raw === 'SUBSTITUIR' || raw === 'CHANGE_ME' || raw === 'TODO') return 'placeholder';
  return 'set';
};

console.log(c('bold', '\n→ Verificando variáveis de ambiente\n'));

if (!existsSync('.env.local') && !existsSync('.env')) {
  console.log(c('yellow', '  ⚠  Nenhum arquivo .env.local ou .env encontrado.'));
  console.log(c('dim', '     Crie .env.local com base no .env.example.\n'));
}

const counts = { required_missing: 0, recommended_missing: 0, placeholder: 0, set: 0 };

const groupedByLevel = {
  required: SCHEMA.filter((s) => s.level === 'required'),
  recommended: SCHEMA.filter((s) => s.level === 'recommended'),
  optional: SCHEMA.filter((s) => s.level === 'optional'),
};

for (const [level, items] of Object.entries(groupedByLevel)) {
  const label = level === 'required' ? 'OBRIGATÓRIAS' : level === 'recommended' ? 'RECOMENDADAS' : 'OPCIONAIS';
  console.log(c('bold', `  ${label}`));
  for (const item of items) {
    const status = checkValue(process.env[item.name]);
    let symbol, color;
    if (status === 'set') {
      symbol = '✓';
      color = 'green';
      counts.set++;
    } else if (status === 'placeholder') {
      symbol = '⚠';
      color = 'yellow';
      counts.placeholder++;
      if (level === 'required') counts.required_missing++;
      if (level === 'recommended') counts.recommended_missing++;
    } else {
      symbol = level === 'required' ? '✗' : '○';
      color = level === 'required' ? 'red' : level === 'recommended' ? 'yellow' : 'dim';
      if (level === 'required') counts.required_missing++;
      if (level === 'recommended') counts.recommended_missing++;
    }
    console.log(`    ${c(color, symbol)} ${item.name}`);
    if (status !== 'set') console.log(c('dim', `        ${item.hint}`));
  }
  console.log('');
}

console.log(c('bold', '  RESUMO'));
console.log(`    ${c('green', '✓')} ${counts.set} configuradas`);
if (counts.placeholder > 0) console.log(`    ${c('yellow', '⚠')} ${counts.placeholder} com placeholder (SUBSTITUIR/CHANGE_ME/TODO)`);
if (counts.required_missing > 0) console.log(`    ${c('red', '✗')} ${counts.required_missing} obrigatória(s) faltando`);
if (counts.recommended_missing > 0) console.log(`    ${c('yellow', '○')} ${counts.recommended_missing} recomendada(s) não setada(s)`);
console.log('');

if (counts.required_missing > 0) {
  console.log(c('red', '  Falhou — preencha as variáveis obrigatórias antes de subir.\n'));
  process.exit(1);
}

console.log(c('green', '  OK — variáveis obrigatórias presentes.\n'));
