/**
 * Conteúdo placeholder seguro para a home (v1.0 §9).
 * NÃO inventar certificações, números de clientes, anos, capacidade ou liderança.
 * Tom profissional, B2B, institucional.
 */

import {
  Zap,
  Gauge,
  ClipboardCheck,
  Wrench,
  ShieldCheck,
  BatteryCharging,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const HERO_FALLBACK = {
  eyebrow: 'MasterBlock · Supressor de surtos',
  title: 'O surto que destrói seu equipamento opera em 100 kHz',
  subtitle:
    'O DPS comum atua só até 10 kHz. O MasterBlock é a única proteção que age na frequência do dano.',
  primary: { label: 'Receba um diagnóstico de risco', href: '/contato' },
  secondary: { label: 'Conheça o MasterBlock', href: '/produtos' },
  fallback_image_url: null as string | null,
  // Hero estático, sem vídeo. Para usar vídeo, cadastrar em Admin → Home → Hero.
  video_url: null as string | null,
} as const;

// Slider editorial — placeholders sem dados inventados
export const SLIDER_FALLBACK = [
  {
    id: 'slide-food-service',
    title: 'Food Service',
    eyebrow: 'Solução comercial',
    description: 'Soluções práticas e saborosas para o dia a dia de cozinhas profissionais.',
    image_url: 'https://picsum.photos/seed/msm-slide-fs/1200/900',
    cta: { label: 'Conheça', href: '/solucoes/food-service' },
  },
  {
    id: 'slide-marcas-proprias',
    title: 'Marcas Próprias',
    eyebrow: 'Solução comercial',
    description: 'Desenvolvimento completo de marcas exclusivas com qualidade e confiança.',
    image_url: 'https://picsum.photos/seed/msm-slide-mp/1200/900',
    cta: { label: 'Conheça', href: '/solucoes/marcas-proprias' },
  },
  {
    id: 'slide-terceirizacao',
    title: 'Terceirização de Produção',
    eyebrow: 'Solução comercial',
    description: 'Estrutura completa para produzir sua marca com eficiência e segurança.',
    image_url: 'https://picsum.photos/seed/msm-slide-tc/1200/900',
    cta: { label: 'Conheça', href: '/solucoes/terceirizacao-de-producao' },
  },
  {
    id: 'slide-envase',
    title: 'Envase',
    eyebrow: 'Solução comercial',
    description: 'Tecnologia e precisão para diferentes formatos e necessidades.',
    image_url: 'https://picsum.photos/seed/msm-slide-en/1200/900',
    cta: { label: 'Conheça', href: '/solucoes/envase' },
  },
] as const;

// Indicadores institucionais — NÃO inventar números (v1.0 §9)
// Apenas categorias institucionais. Quando admin preencher home_indicators, vira dado real.
export const INDICATORS_FALLBACK = [
  { label: 'Indústria', description: 'Estrutura produtiva própria' },
  { label: 'Food Service', description: 'Operações profissionais' },
  { label: 'B2B', description: 'Indústrias, redes e atacadistas' },
  { label: 'Atendimento Nacional', description: 'Entregas para todo o Brasil' },
] as const;

// Soluções (6 fixas conforme v1.0 §12.4)
type SolutionFallback = {
  slug: string;
  href: string;
  title: string;
  description: string;
  Icon: LucideIcon;
};

export const SOLUTIONS_FALLBACK: readonly SolutionFallback[] = [
  {
    slug: 'food-service',
    href: '/solucoes/food-service',
    title: 'Proteção contra surtos',
    description: 'MasterBlock — supressor com filtro passivo atuante em 100 kHz.',
    Icon: Zap,
  },
  {
    slug: 'b2b',
    href: '/solucoes/b2b',
    title: 'Qualidade de energia',
    description: 'Diagnóstico e correção da qualidade de energia elétrica da planta.',
    Icon: Gauge,
  },
  {
    slug: 'terceirizacao',
    href: '/solucoes/terceirizacao-de-producao',
    title: 'Medições e laudos',
    description: 'Ensaios estáticos e dinâmicos e laudos técnicos conforme as normas.',
    Icon: ClipboardCheck,
  },
  {
    slug: 'envase',
    href: '/solucoes/envase',
    title: 'Manutenção elétrica',
    description: 'Manutenção elétrica industrial especializada para alta criticidade.',
    Icon: Wrench,
  },
  {
    slug: 'marcas-proprias',
    href: '/solucoes/marcas-proprias',
    title: 'Aterramento dedicado',
    description: 'Aterramento e equipotencialização conforme a NBR 5410.',
    Icon: ShieldCheck,
  },
  {
    slug: 'distribuicao',
    href: '/solucoes/distribuicao',
    title: 'Banco de capacitores',
    description: 'Correção de fator de potência e eficiência energética.',
    Icon: BatteryCharging,
  },
] as const;

// CTAs "Fale Conosco" segmentados
import { Users, Utensils, Building, Box, Boxes } from 'lucide-react';

type CtaFallback = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  /** Mesmo enum de home_cta_cards.interest_type — decide zap vs form. */
  interest_type?: string;
  cta: { label: string; href: string };
  Icon: LucideIcon;
};

export const CTA_CARDS_FALLBACK: readonly CtaFallback[] = [
  {
    id: 'cta-representantes',
    eyebrow: 'Para representantes',
    title: 'Seja um representante',
    description: 'Informações e materiais para representantes profissionais.',
    interest_type: 'representante',
    cta: { label: 'Enviar mensagem', href: '/representantes' },
    Icon: Users,
  },
  {
    id: 'cta-food-service',
    eyebrow: 'Para Food Service',
    title: 'Cozinhas profissionais',
    description: 'Fale com o time e encontre a melhor solução para a sua operação.',
    interest_type: 'food_service',
    cta: { label: 'Enviar mensagem', href: '/contato' },
    Icon: Utensils,
  },
  {
    id: 'cta-b2b',
    eyebrow: 'Para B2B',
    title: 'Indústrias e redes',
    description: 'Atendimento especializado para indústrias, redes e atacadistas.',
    interest_type: 'b2b',
    cta: { label: 'Enviar mensagem', href: '/contato' },
    Icon: Building,
  },
  {
    id: 'cta-terceirizacao',
    eyebrow: 'Terceirização',
    title: 'Produza com a MSM',
    description: 'Desenvolva sua marca com qualidade, segurança e flexibilidade.',
    interest_type: 'terceirizacao',
    cta: { label: 'Enviar mensagem', href: '/contato' },
    Icon: Boxes,
  },
  {
    id: 'cta-envase',
    eyebrow: 'Envase',
    title: 'Envase sob medida',
    description: 'Soluções em envase para diferentes formatos e demandas.',
    interest_type: 'envase',
    cta: { label: 'Enviar mensagem', href: '/contato' },
    Icon: Box,
  },
] as const;

export const CERTIFICATIONS = [
  { name: 'FSSC 22000', placeholder: true },
  { name: 'BRCGS', placeholder: true },
  { name: 'ISO 9001', placeholder: true },
  { name: 'Halal', placeholder: true },
] as const;

// Fallbacks visuais para validação de layout (substituídos pelo admin após deploy)
export const BRANDS_FALLBACK = [
  { id: 'b1', slug: 'marca-premium', name: 'Marca Premium', logo_url: 'https://placehold.co/240x80/C9A24A/03111F?text=Marca+Premium' },
  { id: 'b2', slug: 'marca-gourmet', name: 'Marca Gourmet', logo_url: 'https://placehold.co/240x80/C9A24A/03111F?text=Marca+Gourmet' },
  { id: 'b3', slug: 'marca-chef', name: 'Chef Line', logo_url: 'https://placehold.co/240x80/C9A24A/03111F?text=Chef+Line' },
  { id: 'b4', slug: 'marca-natural', name: 'Natural Select', logo_url: 'https://placehold.co/240x80/C9A24A/03111F?text=Natural+Select' },
  { id: 'b5', slug: 'marca-classic', name: 'Classic', logo_url: 'https://placehold.co/240x80/C9A24A/03111F?text=Classic' },
  { id: 'b6', slug: 'marca-pro', name: 'Pro Series', logo_url: 'https://placehold.co/240x80/C9A24A/03111F?text=Pro+Series' },
];

export const PRODUCTS_FALLBACK = [
  { id: 'p1', slug: 'molho-tomate-especial', name: 'Molho de Tomate Especial', main_image_url: 'https://picsum.photos/seed/msm-prod-1/600/750', brand_id: 'b1', packaging_summary: 'Embalagens de 340g, 1,7kg e 5kg' },
  { id: 'p2', slug: 'azeite-extravirgem', name: 'Azeite Extra Virgem', main_image_url: 'https://picsum.photos/seed/msm-prod-2/600/750', brand_id: 'b2', packaging_summary: 'Garrafas de 250ml, 500ml e 1L' },
  { id: 'p3', slug: 'creme-leite-culinario', name: 'Creme de Leite Culinário', main_image_url: 'https://picsum.photos/seed/msm-prod-3/600/750', brand_id: 'b3', packaging_summary: 'Caixinhas de 200g e 1kg' },
  { id: 'p4', slug: 'ketchup-gourmet', name: 'Ketchup Gourmet', main_image_url: 'https://picsum.photos/seed/msm-prod-4/600/750', brand_id: 'b1', packaging_summary: 'Sachês e frascos 1kg, 3kg' },
  { id: 'p5', slug: 'maionese-profissional', name: 'Maionese Profissional', main_image_url: 'https://picsum.photos/seed/msm-prod-5/600/750', brand_id: 'b4', packaging_summary: 'Baldes de 3,5kg e 20kg' },
  { id: 'p6', slug: 'tempero-churrasco', name: 'Tempero para Churrasco', main_image_url: 'https://picsum.photos/seed/msm-prod-6/600/750', brand_id: 'b5', packaging_summary: 'Sachês 500g e potes 1kg' },
];

export const RECIPES_FALLBACK = [
  { id: 'r1', slug: 'risoto-cogumelos-trufa', title: 'Risoto de Cogumelos com Trufa', image_url: 'https://picsum.photos/seed/msm-rec-1/800/600', total_time: '40 min' },
  { id: 'r2', slug: 'frango-grelhado-ervas', title: 'Frango Grelhado com Ervas', image_url: 'https://picsum.photos/seed/msm-rec-2/800/600', total_time: '30 min' },
  { id: 'r3', slug: 'massa-molho-pomodoro', title: 'Massa ao Molho Pomodoro', image_url: 'https://picsum.photos/seed/msm-rec-3/800/600', total_time: '25 min' },
];
