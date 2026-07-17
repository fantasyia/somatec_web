/**
 * Conteúdo placeholder seguro para a home (v1.0 §9).
 * NÃO inventar certificações, números de clientes, anos, capacidade ou liderança.
 * Tom profissional, B2B, institucional.
 */

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
