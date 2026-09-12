// Tipos compartilhados do projeto MSM.
// Tipos do Supabase serão gerados em src/types/supabase.ts na Fase 2.

export type Status = 'draft' | 'published';

export type SeoFields = {
  seo_title: string | null;
  seo_description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  robots_index: boolean;
  robots_follow: boolean;
};

// ⚠️ RESÍDUO CROSS-CLIENTE: 'food_service', 'terceirizacao', 'envase',
// 'marcas_proprias' e 'distribuicao' eram segmentos da MSM Alimentos. Saíram em
// 12/09/2026. Estes tipos espelham schemas.ts — mudou lá, muda aqui.
export type FormInterestType = 'b2b' | 'representante';

export type FormType = 'representante' | 'b2b' | 'contato_geral';
