#!/usr/bin/env node
/**
 * Gera /public/og-default.jpg — imagem 1200x630 usada como fallback OG nas
 * páginas sem og_image_url específico. Sem ela, compartilhar o site no
 * WhatsApp/LinkedIn/Twitter aparece sem imagem.
 *
 * Uso:
 *   node scripts/generate-og-default.mjs
 *
 * Re-rode sempre que o brand/tagline mudar.
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, '..', 'public', 'og-default.jpg');

const WIDTH = 1200;
const HEIGHT = 630;

// Cores MSM
const NAVY = '#071B33';
const DEEP_NAVY = '#03111F';
const GOLD = '#C9A24A';
const SOFT_GOLD = '#E1C878';
const OFF_WHITE = '#F7F5EF';

// SVG composto:
// - Fundo navy com gradient sutil pro deep_navy nas bordas
// - Pattern sutil de linhas diagonais (decoração)
// - Logo "MSM" em serif grande
// - Linha dourada divisória
// - Tagline em duas linhas
// - Eyebrow "INDÚSTRIA · FOOD SERVICE · B2B"
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${NAVY}" />
      <stop offset="100%" stop-color="${DEEP_NAVY}" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${GOLD}" />
      <stop offset="100%" stop-color="${SOFT_GOLD}" />
    </linearGradient>
    <pattern id="lines" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="20" stroke="${OFF_WHITE}" stroke-width="1" opacity="0.04" />
    </pattern>
  </defs>

  <!-- Fundo -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#lines)" />

  <!-- Borda dourada superior -->
  <rect x="0" y="0" width="${WIDTH}" height="6" fill="url(#gold)" />

  <!-- Eyebrow -->
  <text x="${WIDTH / 2}" y="220" text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif" font-size="22"
        letter-spacing="6" font-weight="600"
        fill="${GOLD}">
    INDÚSTRIA · FOOD SERVICE · B2B
  </text>

  <!-- Logo MSM -->
  <text x="${WIDTH / 2}" y="350" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif" font-size="120"
        font-weight="700" letter-spacing="-4"
        fill="${OFF_WHITE}">
    MSM
  </text>

  <!-- Divider dourado -->
  <line x1="${WIDTH / 2 - 60}" y1="390" x2="${WIDTH / 2 + 60}" y2="390"
        stroke="${GOLD}" stroke-width="2" opacity="0.7" />

  <!-- Tagline linha 1 -->
  <text x="${WIDTH / 2}" y="450" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif" font-size="30"
        font-weight="400" font-style="italic"
        fill="${OFF_WHITE}">
    Indústria, marcas e soluções
  </text>

  <!-- Tagline linha 2 -->
  <text x="${WIDTH / 2}" y="495" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif" font-size="30"
        font-weight="400" font-style="italic"
        fill="${OFF_WHITE}">
    para o mercado food service e B2B
  </text>

  <!-- Footer com domínio -->
  <text x="${WIDTH / 2}" y="585" text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif" font-size="16"
        letter-spacing="4" font-weight="500"
        fill="${GOLD}" opacity="0.7">
    MSM ALIMENTOS
  </text>
</svg>`;

console.log(`[og-gen] gerando ${OUTPUT}…`);

const buffer = await sharp(Buffer.from(svg))
  .jpeg({ quality: 88, progressive: true })
  .toBuffer();

writeFileSync(OUTPUT, buffer);

const stats = await sharp(OUTPUT).metadata();
console.log(`[og-gen] OK — ${stats.width}×${stats.height} · ${(buffer.length / 1024).toFixed(1)} KB`);
