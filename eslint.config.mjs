// ESLint 9 flat config para Next.js 16.
// Equivalente ao antigo .eslintrc.json com `extends: "next/core-web-vitals"`.
// eslint-config-next 16+ exporta um array flat-config nativo.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  ...nextCoreWebVitals,
  {
    // Globally ignored paths além dos defaults do eslint-config-next
    // (que já ignora .next/, out/, build/, next-env.d.ts).
    ignores: [
      'coverage/**',
      'node_modules/**',
      'public/**',
      'scripts/**',
      'supabase/**',
      '*.recovered',
      'src_app_*.recovered',
    ],
  },
];

export default config;
