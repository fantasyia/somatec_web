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

export type FormInterestType =
  | 'food_service'
  | 'b2b'
  | 'terceirizacao'
  | 'envase'
  | 'marcas_proprias'
  | 'distribuicao'
  | 'representante';

export type FormType =
  | 'representante'
  | 'food_service'
  | 'b2b'
  | 'terceirizacao'
  | 'envase'
  | 'contato_geral';
