import 'server-only';
import { z } from 'zod';

// =============================================================================
// Schemas Zod para validar bodies POST/PUT do CMS admin.
//
// Filosofia:
// - Todos os campos opcionais para suportar PUT parcial (patches).
// - Campos extras são silenciosamente removidos (default .strip()).
// - Validação só rejeita o que claramente é inválido (slug com espaço, URL malformada).
// - Permite null em qualquer campo que aceita null no banco.
// =============================================================================

const slug = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9-]+$/, 'slug deve conter apenas letras minúsculas, números e hífens');

const status = z.enum(['draft', 'published']);
const url = z.string().url().max(2048).nullable();
const optionalString = (max = 500) => z.string().max(max).nullable().optional();
const optionalText = (max = 10000) => z.string().max(max).nullable().optional();
const displayOrder = z.number().int().min(0).max(99999);
const boolean = z.boolean();

// Campos SEO compartilhados
const seoFields = {
  seo_title: optionalString(160),
  seo_description: optionalString(320),
  og_title: optionalString(160),
  og_description: optionalString(320),
  og_image_url: url.optional(),
  canonical_url: url.optional(),
  robots_index: boolean.optional(),
  robots_follow: boolean.optional(),
};

// -----------------------------------------------------------------------------
// Schemas por tabela
// -----------------------------------------------------------------------------

export const solutionSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  slug: slug.optional(),
  route_path: z.string().min(1).max(200).optional(),
  short_description: optionalString(500),
  full_content: z.object({ sections: z.array(z.unknown()) }).optional(),
  hero_image_url: url.optional(),
  icon_url: url.optional(),
  benefits: z.array(z.object({
    icon_url: z.string().nullable(),
    title: z.string().max(200),
    description: z.string().max(1000),
  })).optional(),
  cta_label: optionalString(80),
  cta_url: optionalString(500),
  form_interest_type: optionalString(80),
  status: status.optional(),
  display_order: displayOrder.optional(),
  ...seoFields,
});

export const brandSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  slug: slug.optional(),
  short_description: optionalString(500),
  full_description: optionalText(),
  logo_url: url.optional(),
  cover_image_url: url.optional(),
  positioning: optionalString(500),
  target_audience: optionalString(500),
  categories: z.array(z.string().max(100)).optional(),
  featured: boolean.optional(),
  display_order: displayOrder.optional(),
  status: status.optional(),
  ...seoFields,
});

export const productCategorySchema = z.object({
  name: z.string().min(1).max(160).optional(),
  slug: slug.optional(),
  description: optionalText(),
  image_url: url.optional(),
  parent_id: z.string().uuid().nullable().optional(),
  display_order: displayOrder.optional(),
  status: status.optional(),
  ...seoFields,
});

export const productApplicationSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  slug: slug.optional(),
  description: optionalText(),
  image_url: url.optional(),
  display_order: displayOrder.optional(),
  status: status.optional(),
  ...seoFields,
});

export const productSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: slug.optional(),
  brand_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  short_description: optionalString(500),
  full_description: optionalText(),
  main_image_url: url.optional(),
  technical_sheet_url: url.optional(),
  packaging_summary: optionalString(500),
  commercial_notes: optionalText(2000),
  featured: boolean.optional(),
  display_order: displayOrder.optional(),
  status: status.optional(),
  ...seoFields,
});

export const recipeCategorySchema = z.object({
  name: z.string().min(1).max(160).optional(),
  slug: slug.optional(),
  description: optionalText(),
  image_url: url.optional(),
  display_order: displayOrder.optional(),
  status: status.optional(),
  ...seoFields,
});

export const recipeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: slug.optional(),
  category_id: z.string().uuid().nullable().optional(),
  short_description: optionalString(500),
  introduction: optionalText(),
  image_url: url.optional(),
  prep_time: optionalString(40),
  cook_time: optionalString(40),
  total_time: optionalString(40),
  yield_text: optionalString(80),
  ingredients: z.array(z.object({
    id: z.string(),
    name: z.string().max(200),
    quantity: z.string().max(40),
    unit: z.string().max(40),
    notes: z.string().nullable(),
    product_id: z.string().uuid().nullable(),
  })).optional(),
  instructions: z.array(z.object({
    step: z.number().int().min(1),
    text: z.string().max(2000),
    image_url: z.string().nullable(),
    tip: z.string().nullable(),
  })).optional(),
  chef_notes: optionalText(2000),
  application_context: optionalString(500),
  featured: boolean.optional(),
  display_order: displayOrder.optional(),
  status: status.optional(),
  ...seoFields,
});

export const bannerSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  subtitle: optionalString(200),
  description: optionalText(),
  location: z.string().min(1).max(80).optional(),
  route_path: optionalString(200),
  desktop_image_url: url.optional(),
  mobile_image_url: url.optional(),
  video_url: url.optional(),
  cta_label: optionalString(80),
  cta_url: optionalString(500),
  overlay_style: optionalString(40),
  display_order: displayOrder.optional(),
  active: boolean.optional(),
});

export const footerColumnSchema = z.object({
  title: z.string().min(1).max(80).optional(),
  display_order: displayOrder.optional(),
  active: boolean.optional(),
});

export const footerLinkSchema = z.object({
  column_id: z.string().uuid().optional(),
  label: z.string().min(1).max(120).optional(),
  href: z.string().min(1).max(500).optional(),
  is_external: boolean.optional(),
  open_in_new_tab: boolean.optional(),
  display_order: displayOrder.optional(),
  active: boolean.optional(),
});

export const navigationItemSchema = z.object({
  label: z.string().min(1).max(120).optional(),
  href: z.string().min(1).max(500).optional(),
  parent_id: z.string().uuid().nullable().optional(),
  location: z.string().min(1).max(40).optional(),
  display_order: displayOrder.optional(),
  active: boolean.optional(),
  is_external: boolean.optional(),
  open_in_new_tab: boolean.optional(),
});

export const pageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: slug.optional(),
  route_path: z.string().min(1).max(200).optional(),
  page_type: z.string().min(1).max(40).optional(),
  status: status.optional(),
  hero_title: optionalString(200),
  hero_subtitle: optionalString(500),
  hero_image_url: url.optional(),
  content: z.object({ sections: z.array(z.unknown()) }).optional(),
  ...seoFields,
});

export const redirectSchema = z.object({
  from_path: z.string().min(1).max(500).optional(),
  to_path: z.string().min(1).max(500).optional(),
  status_code: z.number().int().refine((v) => v === 301 || v === 302 || v === 307 || v === 308).optional(),
  active: boolean.optional(),
  notes: optionalText(),
});

// Tabelas da home (CRUD via makeCrudHandlers) — antes passavam SEM validação
// (mass-assignment / tipos errados). Campos opcionais (PUT parcial); campos não
// expostos pelo form ficam apenas ausentes (não são dropados).
export const homeSliderItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  subtitle: optionalString(200),
  description: optionalText(),
  image_url: optionalString(2048),
  mobile_image_url: optionalString(2048),
  cta_label: optionalString(80),
  cta_url: optionalString(500),
  display_order: displayOrder.optional(),
  transition_seconds: z.number().int().min(1).max(120).optional(),
  active: boolean.optional(),
});

export const homeIndicatorSchema = z.object({
  main_text: z.string().min(1).max(200).optional(),
  description: optionalString(500),
  icon_url: optionalString(2048),
  internal_note: optionalString(500),
  display_order: displayOrder.optional(),
  active: boolean.optional(),
});

export const homeCtaCardSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: optionalString(500),
  icon_url: optionalString(2048),
  interest_type: optionalString(80),
  button_label: optionalString(80),
  button_url: optionalString(500),
  display_order: displayOrder.optional(),
  active: boolean.optional(),
});

// -----------------------------------------------------------------------------
// Mapping table → schema (passado para makeCrudHandlers automaticamente)
// -----------------------------------------------------------------------------

export const SCHEMA_BY_TABLE: Record<string, z.ZodType> = {
  solutions: solutionSchema,
  brands: brandSchema,
  products: productSchema,
  product_categories: productCategorySchema,
  product_applications: productApplicationSchema,
  recipes: recipeSchema,
  recipe_categories: recipeCategorySchema,
  banners: bannerSchema,
  footer_columns: footerColumnSchema,
  footer_links: footerLinkSchema,
  navigation_items: navigationItemSchema,
  pages: pageSchema,
  redirects: redirectSchema,
  home_slider_items: homeSliderItemSchema,
  home_indicators: homeIndicatorSchema,
  home_cta_cards: homeCtaCardSchema,
};
